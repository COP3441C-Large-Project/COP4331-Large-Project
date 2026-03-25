// Creates a Set of common stop words to exclude from tokenization
const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'but',
  'by',
  'for',
  'from',
  'how',
  'i',
  'in',
  'is',
  'it',
  'its',
  'of',
  'on',
  'or',
  'so',
  'that',
  'the',
  'their',
  'they',
  'this',
  'to',
  'was',
  'we',
  'with',
  'you',
  'your'
]);

// Converts a text string into tokens 
function tokenize(text = '') {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token && token.length > 2 && !STOP_WORDS.has(token));
}

// Finds overlapping values between 2 arrays
function overlap(left = [], right = []) {
  // Coverts right array to Set for faster lookup
  const rightSet = new Set(right);
  // Keeps only values that exist in both arrays
  return left.filter((value) => rightSet.has(value));
}

// Main matching function between 2 users
export function scoreMatch(currentUser, candidate) {
  // Finds shared interests/tags between users
  const sharedTags = overlap(currentUser.tags, candidate.tags);
  // Finds shared meaningful words from bios
  const sharedTerms = overlap(tokenize(currentUser.bio), tokenize(candidate.bio));

  // Scores based on shared tags
  const tagScore = Math.min(sharedTags.length * 22, 66);
  // Scores based on shared bio terms
  const textScore = Math.min(sharedTerms.length * 8, 24);
  // Adds bonus points if candidate was recently active
  const activityBonus = candidate.lastActiveAt ? 10 : 0;
  const score = Math.max(0, Math.min(99, tagScore + textScore + activityBonus));

  return {
    score,
    sharedTags,
    sharedTerms
  };
}
