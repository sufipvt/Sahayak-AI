import axios from 'axios'
import { loadToken } from './store.js'

// All calls to the FastAPI backend go through this file.
// "/api" is forwarded to http://127.0.0.1:8000 by vite.config.js.
const api = axios.create({ baseURL: '/api', timeout: 60000 })

// If the user is logged in, send the login token with every request.
api.interceptors.request.use((config) => {
  const token = loadToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// 1. Chat: send a message, get an answer + sources + updated profile.
//    Logged-in users also get conversation_id and message_id back.
export async function sendChat({ message, profile, history, schemeId, conversationId }) {
  const { data } = await api.post('/chat', {
    message,
    profile,
    history,
    scheme_id: schemeId || null,
    conversation_id: conversationId || null,
  })
  return data
}

// 2. Eligibility check only (no AI, instant). Used when the user edits the profile.
export async function matchSchemes(profile, includeNotEligible = false) {
  const { data } = await api.post('/schemes/match', {
    profile,
    include_not_eligible: includeNotEligible,
  })
  return data
}

// 3. Scheme list and scheme details.
export async function getSchemes() {
  const { data } = await api.get('/schemes')
  return data
}

export async function getScheme(schemeId) {
  const { data } = await api.get(`/schemes/${schemeId}`)
  return data
}

// 4. Login and registration. Both return { token, user }.
export async function login(email, password) {
  const { data } = await api.post('/auth/login', { email, password })
  return data
}

export async function register(name, email, password) {
  const { data } = await api.post('/auth/register', { name, email, password })
  return data
}

export async function getMe() {
  const { data } = await api.get('/auth/me')
  return data
}

// 5. The logged-in user's own data.
export const getSavedProfile = async () => (await api.get('/me/profile')).data
export const saveProfileToAccount = async (profile, consent) => (await api.put('/me/profile', { profile, consent })).data
export const deleteSavedProfile = async () => (await api.delete('/me/profile')).data

export const getConversations = async () => (await api.get('/me/conversations')).data
export const getConversation = async (id) => (await api.get(`/me/conversations/${id}`)).data
export const deleteConversation = async (id) => (await api.delete(`/me/conversations/${id}`)).data

export const rateAnswer = async (messageId, rating) => (await api.post(`/me/messages/${messageId}/rating`, { rating })).data

export const getSavedSchemes = async () => (await api.get('/me/saved')).data
export const saveScheme = async (schemeId) => (await api.post(`/me/saved/${schemeId}`)).data
export const unsaveScheme = async (schemeId) => (await api.delete(`/me/saved/${schemeId}`)).data

// 6. Upload a PDF: returns an explanation and any profile details found.
//    The file is read on the server in memory and not stored.
export async function analyseDocument(file) {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post('/documents/analyse', form, { timeout: 90000 })
  return data
}

// 7. Nearest centres: by city / PIN code, or by the browser's location.
export async function getCentres({ place, lat, lon }) {
  const params = place ? { place } : { lat, lon }
  const { data } = await api.get('/centres', { params })
  return data
}

// 8. Admin only.
export const getAdminStats = async () => (await api.get('/admin/stats')).data

// Turn any error into a short message for the user.
export function errorMessage(error) {
  if (error.response?.data?.detail) {
    const detail = error.response.data.detail
    return typeof detail === 'string' ? detail : 'The request was not valid.'
  }
  if (error.code === 'ECONNABORTED') return 'The server took too long to answer. Please try again.'
  return 'Could not reach the Sahayak server. Is the backend running?'
}
