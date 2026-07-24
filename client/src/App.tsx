import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeProvider'
import { ToastProvider } from '@/context/ToastProvider'
import { AppRoutes } from '@/routes/AppRoutes'

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}

export default App
