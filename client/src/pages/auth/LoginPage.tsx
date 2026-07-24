import { ArrowRight, Eye, EyeOff, LoaderCircle, LockKeyhole } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { InlineError } from '@/components/states/InlineError'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { getHomePath } from '@/lib/navigation'
import { getApiErrorMessage } from '@/services/api'

interface LoginLocationState {
  from?: {
    pathname?: string
  }
}

export function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isSubmitting) {
      return
    }

    if (!username.trim() || !password) {
      setError('Enter your username and password.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const user = await login({ username: username.trim(), password })
      const state = location.state as LoginLocationState | null
      const attemptedPath = state?.from?.pathname
      const safeDestination =
        attemptedPath &&
        ((user.role === 'SUPER_ADMIN' && attemptedPath.startsWith('/logistics')) ||
          (user.role === 'COMMITTEE' && attemptedPath.startsWith('/committee')))
          ? attemptedPath
          : getHomePath(user.role)

      navigate(safeDestination, { replace: true })
    } catch (loginError) {
      setError(getApiErrorMessage(loginError, 'Unable to sign in. Check your credentials and try again.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="border-t-2 border-t-primary shadow-sm">
      <CardHeader>
        <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <LockKeyhole className="size-5" aria-hidden="true" />
        </div>
        <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
        <CardDescription>Sign in with your SITEAO account to continue.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          {error ? <InlineError message={error} /> : null}
          <div className="space-y-2">
            <Label htmlFor="username">
              Username <span className="text-destructive" aria-hidden="true">*</span>
            </Label>
            <Input
              id="username"
              name="username"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              aria-invalid={Boolean(error && !username.trim())}
              disabled={isSubmitting}
              required
              autoFocus
            />
            <p className="text-xs text-muted-foreground">Use the username assigned to your SITEAO account.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">
              Password <span className="text-destructive" aria-hidden="true">*</span>
            </Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-invalid={Boolean(error && !password)}
                className="pr-10"
                disabled={isSubmitting}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute right-1 top-1/2 -translate-y-1/2"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                disabled={isSubmitting}
              >
                {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
              </Button>
            </div>
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <LoaderCircle className="animate-spin" aria-hidden="true" />
                Signing in…
              </>
            ) : (
              <>
                Sign in
                <ArrowRight aria-hidden="true" />
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
