import { useState } from 'react'
import { Zap, Eye, EyeOff } from 'lucide-react'
import { API_BASE_URL } from '@/lib/config'

export function ResetPasswordForm({ token }: { token: string | null }) {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!token) {
      setError('This reset link is invalid or missing a token.')
      return
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.error || 'Something went wrong')
      }
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const goToLogin = () => {
    window.location.href = '/'
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
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
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <h1 className="font-serif text-4xl text-foreground">
            Set a new password
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {done
              ? 'Your password has been updated.'
              : 'Choose a new password for your account.'}
          </p>

          {done ? (
            <div className="mt-8 flex flex-col gap-5">
              <p className="text-sm text-foreground bg-muted border border-border rounded-xl px-4 py-3">
                Password updated successfully.
              </p>
              <button
                type="button"
                onClick={goToLogin}
                className="w-full rounded-xl bg-linear-to-br from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 cursor-pointer transition-all py-3 text-sm font-semibold text-white shadow-xl hover:shadow-purple-500/50">
                Go to log in
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
              {!token && (
                <p className="text-xs text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                  This reset link is invalid or missing a token. Request a new
                  one from the log in screen.
                </p>
              )}

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="new-password"
                  className="text-sm font-medium text-foreground">
                  New password
                </label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
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

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="confirm-password"
                  className="text-sm font-medium text-foreground">
                  Confirm password
                </label>
                <input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-input text-foreground placeholder-muted-foreground rounded-xl px-4 py-3 border border-border focus:outline-none focus:border-purple-500 transition-colors text-sm"
                />
              </div>

              {error && (
                <p className="text-xs text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !token}
                className="w-full rounded-xl bg-linear-to-br from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all py-3 text-sm font-semibold text-white shadow-xl hover:shadow-purple-500/50">
                {loading ? 'Updating…' : 'Update password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
