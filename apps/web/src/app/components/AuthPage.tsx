import { useState } from 'react'
import { Card, Input, Button } from './common'
import './AuthPage.css'

type AuthPageProps = {
  loading: boolean
  error: string | null
  onLogin: (payload: { username: string; password: string }) => Promise<void>
  onRegister: (payload: { username: string; password: string }) => Promise<void>
}

type AuthMode = 'login' | 'register'

export const AuthPage = ({ loading, error, onLogin, onRegister }: AuthPageProps) => {
  const [mode, setMode] = useState<AuthMode>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [localError, setLocalError] = useState('')

  const handleSubmit = async () => {
    setLocalError('')
    if (!username.trim()) {
      setLocalError('请输入用户名')
      return
    }
    if (!password) {
      setLocalError('请输入密码')
      return
    }
    if (mode === 'register' && password !== confirmPassword) {
      setLocalError('两次密码不一致')
      return
    }
    if (mode === 'register') {
      await onRegister({ username: username.trim(), password })
    } else {
      await onLogin({ username: username.trim(), password })
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1 className="auth-title">NovelStudio</h1>
          <p className="auth-subtitle">登录后进入你的专属创作空间</p>
        </div>
        <Card>
          <div className="auth-mode">
            <button
              className={`auth-mode-btn ${mode === 'login' ? 'active' : ''}`}
              onClick={() => setMode('login')}
              type="button"
              data-testid="auth-mode-login"
            >
              登录
            </button>
            <button
              className={`auth-mode-btn ${mode === 'register' ? 'active' : ''}`}
              onClick={() => setMode('register')}
              type="button"
              data-testid="auth-mode-register"
            >
              注册
            </button>
          </div>
          <div className="auth-form">
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="用户名"
              label="用户名"
              data-testid="auth-username"
            />
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="密码"
              label="密码"
              type="password"
              data-testid="auth-password"
            />
            {mode === 'register' && (
              <Input
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="再次输入密码"
                label="确认密码"
                type="password"
                data-testid="auth-confirm-password"
              />
            )}
            {(localError || error) && (
              <div className="auth-error" data-testid="auth-error">
                {localError || error}
              </div>
            )}
            <Button
              variant="primary"
              loading={loading}
              onClick={handleSubmit}
              data-testid="auth-submit"
            >
              {mode === 'register' ? '创建账号' : '登录'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
