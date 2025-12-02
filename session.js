// Simple in-memory session store
const sessions = new Map();

export function createSession(userId, user) {
  const sessionId = Math.random().toString(36).substring(7);
  sessions.set(sessionId, user);
  return sessionId;
}

export function getSession(sessionId) {
  return sessions.get(sessionId) || null;
}

export function deleteSession(sessionId) {
  sessions.delete(sessionId);
}