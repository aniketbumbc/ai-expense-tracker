
import './App.css'
import { ChatContainer } from './componets/ChatContainer'
import { AuthForm } from './componets/AuthForm'
import { AuthProvider, useAuth } from '@/lib/auth'
import { ThemeProvider } from '@/lib/theme'

function AppShell() {
  const { token } = useAuth()

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
