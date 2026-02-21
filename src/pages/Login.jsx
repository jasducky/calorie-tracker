import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { UtensilsIcon } from '../components/Icons'

export default function Login() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword } = useAuth()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  const handleGoogleSignIn = async () => {
    try {
      setError(null)
      await signInWithGoogle()
    } catch (err) {
      setError(err.message || 'Failed to sign in. Please try again.')
    }
  }

  const handleEmailAuth = async (e) => {
    e.preventDefault()
    if (!email || !password) return

    setSubmitting(true)
    setError(null)
    setMessage(null)

    try {
      if (isSignUp) {
        await signUpWithEmail(email, password)
        setMessage('Check your email for a confirmation link.')
      } else {
        await signInWithEmail(email, password)
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center font-sketch px-4">
      <div className="max-w-sm w-full space-y-6 text-center">
        <div>
          <UtensilsIcon className="w-10 h-10 text-ink mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-ink">CalorieTracker</h1>
          <p className="text-ink-light mt-2">
            Snap your food, track your day
          </p>
        </div>

        {/* Google sign-in */}
        <button
          onClick={handleGoogleSignIn}
          className="w-full py-3 rounded-md text-base font-bold bg-accent text-ink hover:bg-accent-hover border-2 border-ink active:scale-[0.98] transition-all flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 border-t-2 border-dashed border-ink-faint" />
          <span className="text-xs text-ink-faint">or</span>
          <div className="flex-1 border-t-2 border-dashed border-ink-faint" />
        </div>

        {/* Email form */}
        <form onSubmit={handleEmailAuth} className="space-y-3 text-left">
          <div>
            <label className="text-xs font-bold text-ink-light block mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-3 py-2.5 rounded-md border-2 border-ink-faint bg-card text-ink font-sketch text-sm focus:border-ink outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-ink-light block mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isSignUp ? 'Create a password (min 6 chars)' : 'Your password'}
              required
              minLength={6}
              className="w-full px-3 py-2.5 rounded-md border-2 border-ink-faint bg-card text-ink font-sketch text-sm focus:border-ink outline-none"
            />
          </div>
          {!isSignUp && (
            <div className="text-right">
              <button
                type="button"
                onClick={async () => {
                  if (!email) { setError('Enter your email address first.'); return }
                  setError(null)
                  try {
                    await resetPassword(email)
                    setResetSent(true)
                    setMessage('Password reset link sent — check your email.')
                  } catch (err) {
                    setError(err.message)
                  }
                }}
                className="text-xs text-ink-light hover:text-ink underline"
              >
                Forgot password?
              </button>
            </div>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-md text-base font-bold bg-ink text-cream hover:bg-ink-light border-2 border-ink active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {submitting ? 'Please wait...' : isSignUp ? 'Create account' : 'Sign in'}
          </button>
        </form>

        {/* Toggle sign in / sign up */}
        <p className="text-sm text-ink-light">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError(null); setMessage(null) }}
            className="font-bold text-ink underline"
          >
            {isSignUp ? 'Sign in' : 'Sign up'}
          </button>
        </p>

        {/* Messages */}
        {error && (
          <div className="border-2 border-dashed border-ink-faint rounded-md px-4 py-3">
            <p className="text-sm text-ink">{error}</p>
          </div>
        )}
        {message && (
          <div className="border-2 border-dashed border-ink-faint rounded-md px-4 py-3 bg-accent-soft">
            <p className="text-sm text-ink">{message}</p>
          </div>
        )}
      </div>
    </div>
  )
}
