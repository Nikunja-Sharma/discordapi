import { useState } from 'react'
import { AuthProvider, useAuth } from './components/AuthContext'
import LoginForm from './components/LoginForm'
import RegisterForm from './components/RegisterForm'
import DiscordLogin from './components/DiscordLogin'
import UserProfile from './components/UserProfile'
import './App.css'

function AuthenticatedApp() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (user) {
    return <UserProfile />;
  }

  return <AuthPage />;
}

function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1>Discord Bot Manager</h1>
        
        <DiscordLogin />
        
        <div className="divider">
          <span>or</span>
        </div>

        {isLogin ? (
          <LoginForm onToggleMode={() => setIsLogin(false)} />
        ) : (
          <RegisterForm onToggleMode={() => setIsLogin(true)} />
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <div className="app">
        <AuthenticatedApp />
      </div>
    </AuthProvider>
  )
}

export default App
