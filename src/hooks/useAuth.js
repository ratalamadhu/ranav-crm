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
    const { data, error } = await insforge
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
    // Restore session on mount
    insforge.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setCurrentUser(session.user)
        const p = await fetchProfile(session.user.id)
        setProfile(p)
      }
      setIsLoading(false)
    })

    // Listen for auth state changes
    const { data: { subscription } } = insforge.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setCurrentUser(session.user)
        const p = await fetchProfile(session.user.id)
        setProfile(p)
      } else {
        setCurrentUser(null)
        setProfile(null)
      }
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  const login = useCallback(async (email, password) => {
    setIsLoading(true)
    const { data, error } = await insforge.auth.signInWithPassword({ email, password })
    if (error) {
      setIsLoading(false)
      throw error
    }
    return data
  }, [])

  const logout = useCallback(async () => {
    await insforge.auth.signOut()
    setCurrentUser(null)
    setProfile(null)
  }, [])

  return { currentUser, profile, isLoading, login, logout }
}
