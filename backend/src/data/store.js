import crypto from 'node:crypto';
import { scoreMatch } from '../services/matching.js';

function id(prefix) {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}

function now() {
  return new Date().toISOString();
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

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

function makeSeedUsers() {
  const timestamp = now();
  return [
    {
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

export function createStore() {
  const users = makeSeedUsers();
  const chats = makeSeedChats();
  const sessions = new Map();

  function findUserByEmail(email) {
    return users.find((user) => user.email.toLowerCase() === email.toLowerCase());
  }

  function findUserById(userId) {
    return users.find((user) => user.id === userId);
  }

  function getUserFromToken(token) {
    const userId = sessions.get(token);
    return userId ? findUserById(userId) : undefined;
  }

  function createSession(userId) {
    const token = crypto.randomUUID();
    sessions.set(token, userId);
    return token;
  }

  return {
    register({ username, email, password }) {
      if (findUserByEmail(email)) {
        return { error: 'Email already registered.' };
      }

      const timestamp = now();
      const user = {
        id: id('user'),
        username,
        email,
        passwordHash: hashPassword(password),
        bio: '',
        tags: [],
        createdAt: timestamp,
        updatedAt: timestamp,
        lastActiveAt: timestamp
      };

      users.push(user);

      return {
        token: createSession(user.id),
        user: sanitizeUser(user)
      };
    },

    login({ email, password }) {
      const user = findUserByEmail(email);

      if (!user || user.passwordHash !== hashPassword(password)) {
        return { error: 'Invalid email or password.' };
      }

      user.lastActiveAt = now();

      return {
        token: createSession(user.id),
        user: sanitizeUser(user)
      };
    },

    getCurrentUser(token) {
      const user = getUserFromToken(token);
      return user ? sanitizeUser(user) : null;
    },

    updateInterests(token, { bio, tags }) {
      const user = getUserFromToken(token);

      if (!user) {
        return { error: 'Unauthorized.' };
      }

      user.bio = bio.trim();
      user.tags = [...new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))].slice(0, 10);
      user.updatedAt = now();
      user.lastActiveAt = now();

      return { user: sanitizeUser(user) };
    },

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
        .filter((candidate) => candidate.score > 0)
        .sort((left, right) => right.score - left.score);

      return { matches: results };
    },

    listChats(token) {
      const currentUser = getUserFromToken(token);

      if (!currentUser) {
        return { error: 'Unauthorized.' };
      }

      const results = chats
        .filter((chat) => chat.participantIds.includes(currentUser.id))
        .map((chat) => {
          const otherUserId = chat.participantIds.find((participantId) => participantId !== currentUser.id);
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

    startChat(token, matchUserId) {
      const currentUser = getUserFromToken(token);
      const matchUser = findUserById(matchUserId);

      if (!currentUser) {
        return { error: 'Unauthorized.' };
      }

      if (!matchUser || matchUser.id === currentUser.id) {
        return { error: 'Match user not found.' };
      }

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

      chat.messages.push(message);
      chat.updatedAt = now();
      currentUser.lastActiveAt = now();

      return { message };
    }
  };
}
