// For hashing, UUIDs, etc.
import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import { getDB } from './db.js';
import { scoreMatch } from '../services/matching.js';

// Helper func to generate short IDs w/ a prefix
function id(prefix) {
  // Generates UUID and takes first 8 chars
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}

// Helper func to get current timestamp in ISO format
function now() {
  return new Date().toISOString();
}

// Removes sensitive fields before sending urser to client
function sanitizeUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    bio: user.bio,
    tags: user.tags,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

// Main func to create in-memory data store
export function createStore() {
  // Bridge array: populated as users register/login via MongoDB so other
  // not-yet-migrated methods (listMatches, listChats, etc.) can find them
  const users = [];
  // Chats still in-memory until migrated
  const chats = [];
  // Map token
  const sessions = new Map();

  // Finds user by email
  function findUserByEmail(email) {
    return users.find((user) => user.email.toLowerCase() === email.toLowerCase());
  }

  // Finds user by ID
  function findUserById(userId) {
    return users.find((user) => user.id === userId);
  }

  // Gets user from auth token
  function getUserFromToken(token) {
    // Gets userID from session map
    const userId = sessions.get(token);
    // Returns user or undefined
    return userId ? findUserById(userId) : undefined;
  }

  // Creates a session (login)
  function createSession(userId) {
    // Generates session token
    const token = crypto.randomUUID();
    // Stores mapping
    sessions.set(token, userId);
    // Returns token to client
    return token;
  }

  // Returns public API of the store
  return {
    // Registers a new user
    async register({ username, email, password }) {
      const col = getDB().collection('users');

      // Prevents duplicate emails
      const existing = await col.findOne({ email: email.toLowerCase() });
      if (existing) {
        return { error: 'Email already registered.' };
      }

      const timestamp = now();
      const user = {
        id: id('user'),
        username,
        email: email.toLowerCase(),
        passwordHash: await bcrypt.hash(password, 10),
        bio: '',
        tags: [],
        createdAt: timestamp,
        updatedAt: timestamp,
        lastActiveAt: timestamp
      };

      await col.insertOne(user);

      // Keep in-memory copy so other (not-yet-migrated) methods can find this user
      users.push(user);

      return {
        token: createSession(user.id),
        user: sanitizeUser(user)
      };
    },

    // Logins user
    async login({ email, password }) {
      const col = getDB().collection('users');

      const user = await col.findOne({ email: email.toLowerCase() });

      // Invalid credentials
      if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        return { error: 'Invalid email or password.' };
      }

      // Updates activity timestamp in MongoDB
      await col.updateOne({ id: user.id }, { $set: { lastActiveAt: now() } });
      user.lastActiveAt = now();

      // Keep in-memory copy in sync for other methods
      const inMemory = users.find((u) => u.id === user.id);
      if (inMemory) {
        inMemory.lastActiveAt = user.lastActiveAt;
      } else {
        users.push(user);
      }

      return {
        token: createSession(user.id),
        user: sanitizeUser(user)
      };
    },

    // Gets currently logged in user
    getCurrentUser(token) {
      const user = getUserFromToken(token);
      return user ? sanitizeUser(user) : null;
    },

    // Updates user bio and tags
    updateInterests(token, { bio, tags }) {
      const user = getUserFromToken(token);

      if (!user) {
        return { error: 'Unauthorized.' };
      }

      // Cleans bio
      user.bio = bio.trim();
      // Normalizes tags
      // lowercase, removes duplicates, max 10 tags
      user.tags = [...new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))].slice(0, 10);
      // Updates timestamps
      user.updatedAt = now();
      user.lastActiveAt = now();

      return { user: sanitizeUser(user) };
    },

    // Gets matches for current user
    listMatches(token) {
      const currentUser = getUserFromToken(token);

      if (!currentUser) {
        return { error: 'Unauthorized.' };
      }

      const results = users
        .filter((candidate) => candidate.id !== currentUser.id)
        .map((candidate) => {
          const match = scoreMatch(currentUser, candidate);
          return {
            userId: candidate.id,
            username: candidate.username,
            bio: candidate.bio,
            tags: candidate.tags,
            score: match.score,
            sharedTags: match.sharedTags,
            sharedTerms: match.sharedTerms
          };
        })
        // Only relevant matches
        .filter((candidate) => candidate.score > 0)
        // Sorts best first
        .sort((left, right) => right.score - left.score);

      return { matches: results };
    },

    // Lists chats for current user
    listChats(token) {
      const currentUser = getUserFromToken(token);

      if (!currentUser) {
        return { error: 'Unauthorized.' };
      }

      const results = chats
        .filter((chat) => chat.participantIds.includes(currentUser.id))
        .map((chat) => {
          // Gets other participant
          const otherUserId = chat.participantIds.find((participantId) => participantId !== currentUser.id);
          // Gets last message
          const otherUser = findUserById(otherUserId);
          const lastMessage = chat.messages.at(-1) ?? null;
          const match = otherUser ? scoreMatch(currentUser, otherUser) : { score: 0, sharedTags: [] };

          return {
            id: chat.id,
            participant: otherUser ? sanitizeUser(otherUser) : null,
            matchScore: match.score,
            sharedTags: match.sharedTags,
            lastMessage
          };
        });

      return { chats: results };
    },

    // Gets meqssages for a chat
    getChatMessages(token, chatId) {
      const currentUser = getUserFromToken(token);

      if (!currentUser) {
        return { error: 'Unauthorized.' };
      }

      const chat = chats.find((entry) => entry.id === chatId && entry.participantIds.includes(currentUser.id));

      if (!chat) {
        return { error: 'Chat not found.' };
      }

      return { messages: chat.messages };
    },

    // Starts a new chat w/ a match
    startChat(token, matchUserId) {
      const currentUser = getUserFromToken(token);
      const matchUser = findUserById(matchUserId);

      if (!currentUser) {
        return { error: 'Unauthorized.' };
      }

      if (!matchUser || matchUser.id === currentUser.id) {
        return { error: 'Match user not found.' };
      }

      // Checks if chat already exists
      const existingChat = chats.find((chat) => {
        return chat.participantIds.includes(currentUser.id) && chat.participantIds.includes(matchUser.id);
      });

      if (existingChat) {
        return { chatId: existingChat.id };
      }

      const chat = {
        id: id('chat'),
        participantIds: [currentUser.id, matchUser.id],
        createdAt: now(),
        updatedAt: now(),
        messages: []
      };

      chats.push(chat);
      return { chatId: chat.id };
    },

    // Sends a message in a chat
    sendMessage(token, chatId, text) {
      const currentUser = getUserFromToken(token);

      if (!currentUser) {
        return { error: 'Unauthorized.' };
      }

      const chat = chats.find((entry) => entry.id === chatId && entry.participantIds.includes(currentUser.id));

      if (!chat) {
        return { error: 'Chat not found.' };
      }

      const message = {
        id: id('msg'),
        senderId: currentUser.id,
        text: text.trim(),
        sentAt: now()
      };

      // Adds a message to chat
      chat.messages.push(message);
      // Updates chat timestamp
      chat.updatedAt = now();
      // Updates user activity
      currentUser.lastActiveAt = now();

      return { message };
    }
  };
}
