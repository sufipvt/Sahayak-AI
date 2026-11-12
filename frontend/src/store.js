// Saves the profile and the chat in the browser (localStorage), so they
// survive moving between pages and reloading. Nothing leaves the browser
// except what is sent to our own backend. In step 4 (login), the profile
// will also be saved on the server.

const PROFILE_KEY = 'sahayak_profile'
const CHAT_KEY = 'sahayak_chat'
const TOKEN_KEY = 'sahayak_token'
const USER_KEY = 'sahayak_user'

function read(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage can be blocked (private mode). The app still works without it.
  }
}

export const loadProfile = () => read(PROFILE_KEY, {})
export const saveProfile = (profile) => write(PROFILE_KEY, profile)

export const EMPTY_CHAT = { messages: [], matches: [], followUps: [], conversationId: null }
export const loadChat = () => ({ ...EMPTY_CHAT, ...read(CHAT_KEY, {}) })
export const saveChat = (chat) => write(CHAT_KEY, chat)

// The login token and the user's name/role.
export const loadToken = () => read(TOKEN_KEY, null)
export const loadUser = () => read(USER_KEY, null)
export function saveLogin(token, user) {
  write(TOKEN_KEY, token)
  write(USER_KEY, user)
}

// Profile + chat only (the "Clear" button).
export function clearChatAndProfile() {
  try {
    localStorage.removeItem(PROFILE_KEY)
    localStorage.removeItem(CHAT_KEY)
  } catch {
    // ignore
  }
}

// Everything, including the login (used on logout, so the next person
// on a shared computer sees nothing).
export function clearAll() {
  clearChatAndProfile()
  try {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  } catch {
    // ignore
  }
}

// The last 4 messages, in the format the backend expects.
// Error messages ("could not reach the server") are not sent.
export function lastMessages(messages, count = 4) {
  return messages
    .filter((m) => !m.error)
    .slice(-count)
    .map((m) => ({ role: m.role, content: m.content }))
}
