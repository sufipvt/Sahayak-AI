import axios from 'axios'

// All calls to the FastAPI backend go through this file.
// "/api" is forwarded to http://127.0.0.1:8000 by vite.config.js.
const api = axios.create({ baseURL: '/api', timeout: 60000 })

// 1. Chat: send a message, get an answer + sources + updated profile.
export async function sendChat({ message, profile, history, schemeId }) {
  const { data } = await api.post('/chat', {
    message,
    profile,
    history,
    scheme_id: schemeId || null,
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

// Turn any error into a short message for the user.
export function errorMessage(error) {
  if (error.response?.data?.detail) {
    const detail = error.response.data.detail
    return typeof detail === 'string' ? detail : 'The request was not valid.'
  }
  if (error.code === 'ECONNABORTED') return 'The server took too long to answer. Please try again.'
  return 'Could not reach the Sahayak server. Is the backend running?'
}
