import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

type FormState = {
  email: string
  name: string
  age: string
  weight: string
  height: string
  password: string
  passwordConfirm: string
}

export default function CreateAccount() {
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>({ email: '', name: '', age: '', weight: '', height: '', password: '', passwordConfirm: '' })
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})

  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {}
    if (!form.email.trim()) next.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Email is invalid'

    if (!form.name.trim()) next.name = 'Name is required'

    if (!form.age.trim()) next.age = 'Age is required'
    else if (!/^\d+$/.test(form.age) || Number(form.age) <= 0) next.age = 'Enter a valid age'

    if (!form.weight.trim()) next.weight = 'Weight is required'
    else if (!/^\d+(?:\.\d+)?$/.test(form.weight)) next.weight = 'Enter a valid weight'

    if (!form.height.trim()) next.height = 'Height is required'
    else if (!/^\d+(?:\.\d+)?$/.test(form.height)) next.height = 'Enter a valid height'

    if (!form.password || !form.password.trim()) next.password = 'Password is required'
    else if (form.password.length < 8) next.password = 'Password must be at least 8 characters'

    if (!form.passwordConfirm || !form.passwordConfirm.trim()) next.passwordConfirm = 'Please repeat the password'
    else if (form.password !== form.passwordConfirm) next.passwordConfirm = 'Passwords do not match'

    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    // For now just log minimal info; replace with API call as needed
    console.log('Create account for', form.email)
    navigate('/sign-in')
  }

  return (
    <div className="create-account-page">
      <h2>Create Account</h2>
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-row">
          <label>Email *</label>
          <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" />
          {errors.email && <div className="error">{errors.email}</div>}
        </div>

        <div className="form-row">
          <label>Name *</label>
          <input name="name" type="text" value={form.name} onChange={handleChange} placeholder="Full name" />
          {errors.name && <div className="error">{errors.name}</div>}
        </div>

        <div className="form-row">
          <label>Password *</label>
          <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="At least 8 characters" required />
          {errors.password && <div className="error">{errors.password}</div>}
        </div>

        <div className="form-row">
          <label>Repeat Password *</label>
          <input name="passwordConfirm" type="password" value={form.passwordConfirm} onChange={handleChange} placeholder="Repeat password" required />
          {errors.passwordConfirm && <div className="error">{errors.passwordConfirm}</div>}
        </div>

        <div className="form-row">
          <label>Age *</label>
          <input name="age" type="number" value={form.age} onChange={handleChange} placeholder="e.g. 30" />
          {errors.age && <div className="error">{errors.age}</div>}
        </div>

        <div className="form-row">
          <label>Weight *</label>
          <input name="weight" type="text" value={form.weight} onChange={handleChange} placeholder="e.g. 70 kg" required />
          {errors.weight && <div className="error">{errors.weight}</div>}
        </div>

        <div className="form-row">
            <label>Height *</label>
          <input name="height" type="text" value={form.height} onChange={handleChange} placeholder="e.g. 175 cm" required />
          {errors.height && <div className="error">{errors.height}</div>}
        </div>

        <div className="form-actions">
          <button type="submit">Create Account</button>
        </div>
      </form>
    </div>
  )
}
