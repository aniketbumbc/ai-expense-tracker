import { useState } from 'react'
import { Zap, Eye, EyeOff, BookOpen } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { API_BASE_URL } from '@/lib/config'
import { AboutModal } from './AboutModal'

export function AuthForm() {
  const { login, register } = useAuth()
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login')
  const [showAbout, setShowAbout] = useState(false)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [keepSignedIn, setKeepSignedIn] = useState(true)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!username.trim() || !password || (mode === 'register' && !email.trim())) {
      setError(
        mode === 'register'
          ? 'Username, email and password are required'
          : 'Username and password are required',
      )
      return
    }

    setLoading(true)
    try {
      if (mode === 'login') {
        await login(username.trim(), password, keepSignedIn)
      } else {
        await register(username.trim(), password, email.trim())
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const toggleMode = () => {
    setMode((m) => (m === 'register' ? 'login' : 'register'))
    setError(null)
  }

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!resetEmail.trim()) {
      setError('Email is required')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.error || 'Something went wrong')
      }
      setResetSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const backToLogin = () => {
    setMode('login')
    setError(null)
    setResetSent(false)
    setResetEmail('')
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <button
        type="button"
        onClick={() => setShowAbout(true)}
        className="fixed right-5 top-5 z-30 flex items-center gap-1.5 rounded-full border border-purple-500 bg-card px-4 py-2 text-sm font-medium text-foreground shadow-lg hover:scale-105 hover:shadow-purple-500/30 active:scale-95 transition-all cursor-pointer">
        <BookOpen className="h-4 w-4" />
        How it works
      </button>

      {showAbout && (
        <AboutModal
          onClose={() => setShowAbout(false)}
          onGetStarted={() => {
            setShowAbout(false)
            setMode('register')
            setError(null)
          }}
        />
      )}

      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between overflow-hidden bg-linear-to-br from-purple-600 via-pink-600 to-orange-500 p-12 text-white">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
              <Zap className="h-5 w-5 fill-white text-white" />
            </div>
            <span className="text-lg font-bold">Ledger</span>
          </div>

          <h1 className="mt-16 max-w-md text-5xl font-extrabold leading-[1.1]">
            Every receipt, filed and accounted for.
          </h1>

          <p className="mt-6 max-w-sm text-lg text-white/80">
            Capture spend as it happens, reconcile at month end, and export a
            clean set of books.
          </p>
        </div>

        <div className="border-t border-white/20 pt-6">
          <p className="text-xl font-medium leading-snug">
            &ldquo;Closing the month went from a weekend to a coffee
            break.&rdquo;
          </p>
          <p className="mt-3 text-sm text-white/70">
            Marguerite Okafor — Studio Verrine
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <h1 className="font-serif text-4xl text-foreground">
            {mode === 'forgot'
              ? 'Reset your password'
              : mode === 'login'
                ? 'Welcome back'
                : 'Create your account'}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === 'forgot'
              ? "Enter your email and we'll send you a reset link."
              : mode === 'login'
                ? 'Log in to your expense tracker.'
                : 'Start tracking your expenses.'}
          </p>

          {mode === 'forgot' ? (
            <form
              onSubmit={handleForgotSubmit}
              className="mt-8 flex flex-col gap-5">
              {resetSent ? (
                <p className="text-sm text-foreground bg-muted border border-border rounded-xl px-4 py-3">
                  If that email is registered, a reset link has been sent.
                </p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="reset-email"
                    className="text-sm font-medium text-foreground">
                    Email
                  </label>
                  <input
                    id="reset-email"
                    type="email"
                    autoComplete="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="jane@example.com"
                    className="bg-input text-foreground placeholder-muted-foreground rounded-xl px-4 py-3 border border-border focus:outline-none focus:border-purple-500 transition-colors text-sm"
                  />
                </div>
              )}

              {error && (
                <p className="text-xs text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                  {error}
                </p>
              )}

              {!resetSent && (
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-linear-to-br from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all py-3 text-sm font-semibold text-white shadow-xl hover:shadow-purple-500/50">
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              )}

              <button
                type="button"
                onClick={backToLogin}
                className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300 transition-colors cursor-pointer">
                Back to log in
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="username"
                  className="text-sm font-medium text-foreground">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="jane"
                  className="bg-input text-foreground placeholder-muted-foreground rounded-xl px-4 py-3 border border-border focus:outline-none focus:border-purple-500 transition-colors text-sm"
                />
              </div>

              {mode === 'register' && (
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-foreground">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@example.com"
                    className="bg-input text-foreground placeholder-muted-foreground rounded-xl px-4 py-3 border border-border focus:outline-none focus:border-purple-500 transition-colors text-sm"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-foreground">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={
                      mode === 'login' ? 'current-password' : 'new-password'
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-input text-foreground placeholder-muted-foreground rounded-xl px-4 py-3 pr-11 border border-border focus:outline-none focus:border-purple-500 transition-colors text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {mode === 'login' && (
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={keepSignedIn}
                      onChange={(e) => setKeepSignedIn(e.target.checked)}
                      className="h-4 w-4 rounded border-border accent-pink-600 cursor-pointer"
                    />
                    Keep me signed in
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot')
                      setError(null)
                      setResetSent(false)
                    }}
                    className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300 transition-colors cursor-pointer">
                    Forgot password?
                  </button>
                </div>
              )}

              {error && (
                <p className="text-xs text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-linear-to-br from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all py-3 text-sm font-semibold text-white shadow-xl hover:shadow-purple-500/50">
                {loading
                  ? 'Please wait…'
                  : mode === 'login'
                    ? 'Log in'
                    : 'Create account'}
              </button>
            </form>
          )}

          {mode !== 'forgot' && (
            <p className="text-center text-sm text-muted-foreground mt-6">
              {mode === 'login'
                ? "Don't have an account? "
                : 'Already have an account? '}
              <button
                type="button"
                onClick={toggleMode}
                className="text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300 font-medium transition-colors cursor-pointer">
                {mode === 'login' ? 'Sign up' : 'Log in'}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
