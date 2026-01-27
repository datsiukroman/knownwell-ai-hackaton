import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSignupMutation } from '../store/api/authApi'

type FormState = {
  email: string
  name: string
  username: string
  age: string
  weight: string
  height: string
  password: string
  role: string
}

export default function CreateAccount() {
  const navigate = useNavigate()
  const [step, setStep] = useState<number>(1)
  const [form, setForm] = useState<FormState>({ email: '', name: '', username: '', age: '', weight: '', height: '', password: '', role: 'ROLE_PATIENT' })
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [signup, { isLoading }] = useSignupMutation()
  function validate(forStep: number = step): boolean {
    const next: Partial<Record<keyof FormState, string>> = {}
    if (forStep === 1) {
      if (!form.email.trim()) next.email = 'Email is required'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Email is invalid'

      if (!form.name.trim()) next.name = 'Name is required'
      if (!form.username.trim()) next.username = 'Username is required'

      if (!form.password || !form.password.trim()) next.password = 'Password is required'
      else if (form.password.length < 8) next.password = 'Password must be at least 8 characters'
    } else {
      if (!form.age.trim()) next.age = 'Age is required'
      else if (!/^\d+$/.test(form.age) || Number(form.age) <= 0) next.age = 'Enter a valid age'

      if (!form.weight.trim()) next.weight = 'Weight is required'
      else if (isNaN(Number(form.weight))) next.weight = 'Enter a valid weight'

      if (!form.height.trim()) next.height = 'Height is required'
      else if (isNaN(Number(form.height))) next.height = 'Enter a valid height'

      if (!form.role || !form.role.trim()) next.role = 'Role is required'
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  function handleBack(e?: React.MouseEvent) {
    e?.preventDefault()
    setErrors({})
    setServerError(null)
    setStep(1)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (step === 1) {
      if (!validate(1)) return
      setStep(2)
      return
    }
    if (!validate(2)) return
    setServerError(null)

    try {
      const payload = {
        email: form.email,
          name: form.name,
          username: form.username,
        age: form.age ? Number(form.age) : undefined,
        weight: form.weight ? Number(form.weight) : undefined,
        height: form.height ? Number(form.height) : undefined,
        password: form.password,
        roles: form.role ? [form.role] : undefined,
      }

      await signup(payload).unwrap()
      navigate('/sign-in')
    } catch (err: any) {
      const message = err?.data?.message || err?.error || err?.message || JSON.stringify(err)
      setServerError(message)
    }
  }

  return (
    <div className="create-account-page">
      <h2>Create Account</h2>
      <form onSubmit={handleSubmit} noValidate>
        

        {step === 1 && (
          <>
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
              <label>Username *</label>
              <input name="username" type="text" value={form.username} onChange={handleChange} placeholder="e.g. johndoe" />
              {errors.username && <div className="error">{errors.username}</div>}
            </div>

            <div className="form-row">
              <label>Password *</label>
              <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="At least 8 characters" required />
              {errors.password && <div className="error">{errors.password}</div>}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="form-row">
              <label>Role *</label>
              <div className="radio-group">
                <label>
                  <input name="role" type="radio" value="ROLE_PATIENT" checked={form.role === 'ROLE_PATIENT'} onChange={handleChange} /> Patient
                </label>
                <label>
                  <input name="role" type="radio" value="ROLE_CLINICIAN" checked={form.role === 'ROLE_CLINICIAN'} onChange={handleChange} /> Clinician
                </label>
              </div>
              {errors.role && <div className="error">{errors.role}</div>}
            </div>

            <div className="form-row">
              <label>Age *</label>
              <input name="age" type="number" value={form.age} onChange={handleChange} placeholder="e.g. 30" />
              {errors.age && <div className="error">{errors.age}</div>}
            </div>

            <div className="form-row">
              <label>Weight *</label>
              <input name="weight" type="number" value={form.weight} onChange={handleChange} placeholder="e.g. 70" required />
              {errors.weight && <div className="error">{errors.weight}</div>}
            </div>

            <div className="form-row">
              <label>Height *</label>
              <input name="height" type="number" value={form.height} onChange={handleChange} placeholder="e.g. 175" required />
              {errors.height && <div className="error">{errors.height}</div>}
            </div>

            
          </>
        )}

        {serverError && <div className="error server-error" style={{ marginBottom: 12 }}>{serverError}</div>}

        <div className="form-actions">
          {step === 1 ? (
            <button type="submit" disabled={isLoading}>
              {isLoading && <span className="spinner" aria-hidden />}
              Next
            </button>
          ) : (
            <>
              <button type="button" className="secondary" onClick={handleBack} style={{ marginRight: 12 }} disabled={isLoading}>Back</button>
              <button type="submit" disabled={isLoading}>
                {isLoading && <span className="spinner" aria-hidden />}
                {isLoading ? 'Creating...' : 'Create Account'}
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  )
}
