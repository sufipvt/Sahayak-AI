import { createContext, useContext, useEffect, useState } from 'react'
import * as api from './api.js'
import { loadUser, saveLogin, clearAll, saveProfile } from './store.js'

// Keeps track of who is logged in, for every page.
// Use it in a page with:  const { user, login, register, logout } = useAuth()

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadUser)   // null = guest

  // 1. When the app opens, check that the saved token is still valid.
  useEffect(() => {
    if (!user) return
    api.getMe().then(setUser).catch(() => {
      clearAll()       // expired or invalid: log out
      setUser(null)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 2. After login, load the profile saved in the account (if any).
  async function afterLogin({ token, user }) {
    saveLogin(token, user)
    setUser(user)
    try {
      const saved = await api.getSavedProfile()
      if (saved.profile) saveProfile(saved.profile)
    } catch {
      // no saved profile: keep the current one
    }
  }

  const login = async (email, password) => afterLogin(await api.login(email, password))
  const register = async (name, email, password) => afterLogin(await api.register(name, email, password))

  // 3. Logout removes everything from this browser (shared computers).
  function logout() {
    clearAll()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
