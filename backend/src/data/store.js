// For hashing, UUIDs, etc.
import crypto from 'node:crypto';
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

// Hashes password using SHA-256(for demo purposes only)
function hashPassword(password) {
  // Creates SHA-256 hash object, adds password data, and coverts hash to hext string
  return crypto.createHash('sha256').update(password).digest('hex');
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

// Seeds initial users (fake database)
function makeSeedUsers() {
  // Uses the same timestamp for consistency
  const timestamp = now();
  return [
    {
      // Static demo user for demo
      id: 'user_demo',
      username: 'demo_user',
      email: 'demo@hottake.app',
      passwordHash: hashPassword('password123'),
      bio: 'I like arguing about movies, philosophy, and why endings matter more than plot twists.',
      tags: ['film', 'philosophy', 'writing'],
      createdAt: timestamp,
      updatedAt: timestamp,
      lastActiveAt: timestamp
    },
    {
      id: 'user_stranger01',
      username: 'stranger_01',
      email: 'stranger01@hottake.app',
      passwordHash: hashPassword('password123'),
      bio: 'I can talk for hours about auteur cinema, existentialism, and overrated classics.',
      tags: ['film', 'philosophy', 'art'],
      createdAt: timestamp,
      updatedAt: timestamp,
      lastActiveAt: timestamp
    },
    {
      id: 'user_musicnerd',
      username: 'vinyl_riot',
      email: 'vinyl@hottake.app',
      passwordHash: hashPassword('password123'),
      bio: 'Alt rock is fine, but weird electronic music and music production are where the real fun starts.',
      tags: ['music', 'production', 'technology'],
      createdAt: timestamp,
      updatedAt: timestamp,
      lastActiveAt: timestamp
    },
    {
      id: 'user_policywonk',
      username: 'policywonk',
      email: 'policy@hottake.app',
      passwordHash: hashPassword('password123'),
      bio: 'I am into politics, startups, and climate conversations that go deeper than headlines.',
      tags: ['politics', 'climate', 'startups'],
      createdAt: timestamp,
      updatedAt: timestamp,
      lastActiveAt: timestamp
    }
  ];
}

// Seeds initial chats (fake database)
function makeSeedChats() {
  return [
    {
      id: 'chat_demo_stranger',
      participantIds: ['user_demo', 'user_stranger01'],
      createdAt: now(),
      updatedAt: now(),
      messages: [
        {
          id: 'msg_1',
          senderId: 'user_stranger01',
          text: 'hi, you’re interested in film too?',
          sentAt: now()
        },
        {
          id: 'msg_2',
          senderId: 'user_demo',
          text: 'yeah, i’ve been trying to expand my film genres lately',
          sentAt: now()
        }
      ]
    }
  ];
}

// Main func to create in-memory data store
export function createStore() {
  // Initializes users array
  const users = makeSeedUsers();
  // Initializes chats array
  const chats = makeSeedChats();
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
    register({ username, email, password }) {
      // Prevents duplicate emails
      if (findUserByEmail(email)) {
        return { error: 'Email already registered.' };
      }

      const timestamp = now();
      const user = {
        // Generates user ID
        id: id('user'),
        username,
        email,
        // Stores hashed password
        passwordHash: hashPassword(password),
        bio: '',
        tags: [],
        createdAt: timestamp,
        updatedAt: timestamp,
        lastActiveAt: timestamp
      };

      // Adds to (fake) database
      users.push(user);

      return {
        // Auto login after register
        token: createSession(user.id),
        // Returns safe user object
        user: sanitizeUser(user)
      };
    },

    // Logins user
    login({ email, password }) {
      const user = findUserByEmail(email);

      // Invalid credentials
      if (!user || user.passwordHash !== hashPassword(password)) {
        return { error: 'Invalid email or password.' };
      }

      // Updates activity timestamp
      user.lastActiveAt = now();

      return {
        // Creates session token
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
