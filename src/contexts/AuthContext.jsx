import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isRecovery, setIsRecovery] = useState(false)
  const [authDebug, setAuthDebug] = useState(null)

  useEffect(() => {
    // Check URL hash for recovery token
    const hash = window.location.hash
    if (hash && hash.includes('type=recovery')) {
      setIsRecovery(true)
    }

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
        if (event === 'PASSWORD_RECOVERY') {
          setIsRecovery(true)
        }
      }
    )

    // Handle PKCE code exchange manually (detectSessionInUrl is off)
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    if (code) {
      // Show debug info on screen so we can see what's happening
      const verifierKeys = Object.keys(localStorage).filter(k => k.includes('supabase') || k.includes('pkce') || k.includes('code'))
      setAuthDebug(`Code found: ${code.substring(0, 8)}... | localStorage keys: ${verifierKeys.join(', ') || 'NONE'}`)

      supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
        if (error) {
          setAuthDebug(prev => `${prev} | EXCHANGE ERROR: ${error.message}`)
        } else {
          setAuthDebug(prev => `${prev} | SUCCESS: ${data.session?.user?.email}`)
          window.history.replaceState({}, '', window.location.pathname)
        }
      })
    } else {
      // No code — check existing session
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null)
        setLoading(false)
      })
    }

    return () => subscription.unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    })
    if (error) throw error
  }

  const signUpWithEmail = async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  }

  const signInWithEmail = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    })
    if (error) throw error
  }

  const updatePassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
    setIsRecovery(false)
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ user, loading, isRecovery, authDebug, signInWithGoogle, signUpWithEmail, signInWithEmail, resetPassword, updatePassword, signOut }}>
      {authDebug && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#1a1a1a', color: '#0f0', padding: '12px', fontSize: '12px', fontFamily: 'monospace', zIndex: 9999, wordBreak: 'break-all' }}>
          DEBUG: {authDebug}
        </div>
      )}
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
