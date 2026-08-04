
import './App.css'
import { ChatContainer } from './componets/ChatContainer'
import { AuthForm } from './componets/AuthForm'
import { ResetPasswordForm } from './componets/ResetPasswordForm'
import { AuthProvider, useAuth } from '@/lib/auth'
import { ThemeProvider } from '@/lib/theme'

function AppShell() {
  const { token } = useAuth()

  if (window.location.pathname === '/reset-password') {
    const resetToken = new URLSearchParams(window.location.search).get(
      'token',
    )
    return <ResetPasswordForm token={resetToken} />
  }

  if (!token) {
    return <AuthForm />
  }

  return <ChatContainer />
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
