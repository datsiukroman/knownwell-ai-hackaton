import React, { useState } from 'react'
import { useSignInMutation } from '../store/api/authApi'
import { useDispatch } from 'react-redux'
import { setAuth } from '../store/slices/authSlice'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [signIn, { isLoading }] = useSignInMutation()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const res: any = await signIn({ email: form.email, password: form.password }).unwrap()
      dispatch(setAuth({ token: res.token, username: res.username }))
      navigate('/')
    } catch (err: any) {
      setError(err?.data?.message || 'Sign in failed')
    }
  }

  return (
    <div className="create-account-page">
      <h2>Sign In</h2>
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-row">
          <label>Email *</label>
          <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required />
        </div>

        <div className="form-row">
          <label>Password *</label>
          <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Your password" required />
        </div>

        {error && <div className="error">{error}</div>}

        <div className="form-actions">
          <button type="submit" disabled={isLoading}>Sign In</button>
        </div>
      </form>
    </div>
  )
}
