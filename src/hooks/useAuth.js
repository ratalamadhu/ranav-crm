import { useState, useEffect, useCallback } from 'react'
import { insforge } from '../insforge'

/**
 * Returns { currentUser, profile, isLoading, login, logout }
 * `profile` includes the user_profiles row (full_name, role, mobile, etc.)
 */
export function useAuth() {
  const [currentUser, setCurrentUser] = useState(null)
  const [profile, setProfile]         = useState(null)
  const [isLoading, setIsLoading]     = useState(true)

  const fetchProfile = useCallback(async (userId) => {
    const { data, error } = await insforge.database
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (error) {
      console.error('Error fetching profile:', error.message)
      return null
    }
    return data
  }, [])

  useEffect(() => {
    // Restore session on mount (getCurrentUser handles token refresh)
    insforge.auth.getCurrentUser().then(async ({ data, error }) => {
      if (!error && data?.user) {
        setCurrentUser(data.user)
        const p = await fetchProfile(data.user.id)
        setProfile(p)
      }
      setIsLoading(false)
    })
  }, [fetchProfile])

  const login = useCallback(async (email, password) => {
    setIsLoading(true)
    const { data, error } = await insforge.auth.signInWithPassword({ email, password })
    if (error) {
      setIsLoading(false)
      throw error
    }
    if (data?.user) {
      setCurrentUser(data.user)
      const p = await fetchProfile(data.user.id)
      setProfile(p)
    }
    setIsLoading(false)
    return data
  }, [fetchProfile])

  const logout = useCallback(async () => {
    await insforge.auth.signOut()
    setCurrentUser(null)
    setProfile(null)
  }, [])

  return { currentUser, profile, isLoading, login, logout }
}
