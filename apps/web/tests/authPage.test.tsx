import { fireEvent, render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { AuthPage } from '../src/app/components/AuthPage'

test('AuthPage switches to register mode and validates password', async () => {
  const onLogin = vi.fn()
  const onRegister = vi.fn().mockResolvedValue(undefined)

  render(<AuthPage loading={false} error={null} onLogin={onLogin} onRegister={onRegister} />)

  fireEvent.click(screen.getByTestId('auth-mode-register'))
  expect(screen.getByTestId('auth-confirm-password')).toBeInTheDocument()

  fireEvent.change(screen.getByTestId('auth-username'), { target: { value: 'user' } })
  fireEvent.change(screen.getByTestId('auth-password'), { target: { value: 'pass1234' } })
  fireEvent.change(screen.getByTestId('auth-confirm-password'), { target: { value: 'pass0000' } })
  fireEvent.click(screen.getByTestId('auth-submit'))

  expect(await screen.findByTestId('auth-error')).toHaveTextContent('两次密码不一致')
  expect(onRegister).not.toHaveBeenCalled()
})

