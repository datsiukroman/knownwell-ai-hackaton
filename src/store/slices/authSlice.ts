import { createSlice, PayloadAction } from '@reduxjs/toolkit'

type AuthState = {
  token: string | null
  patientId?: string | null
  username?: string | null
  role?: string | null
  clinicianId?: string | null
}

const initialState: AuthState = {
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  patientId: typeof window !== 'undefined' ? localStorage.getItem('patientId') : null,
  username: typeof window !== 'undefined' ? localStorage.getItem('username') : null,
  role: typeof window !== 'undefined' ? localStorage.getItem('role') : null,
  clinicianId: typeof window !== 'undefined' ? localStorage.getItem('clinicianId') : null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth(state, action: PayloadAction<{ token: string; patientId?: string; username?: string; role?: string; clinicianId?: string }>) {
      state.token = action.payload.token
      state.patientId = action.payload.patientId ?? null
      state.username = action.payload.username ?? null
      state.role = action.payload.role ?? null
      state.clinicianId = action.payload.clinicianId ?? null
      try {
        localStorage.setItem('token', action.payload.token)
        if (action.payload.patientId) localStorage.setItem('patientId', action.payload.patientId)
        else localStorage.removeItem('patientId')
        if (action.payload.username) localStorage.setItem('username', action.payload.username)
        else localStorage.removeItem('username')
        if (action.payload.role) localStorage.setItem('role', action.payload.role)
        else localStorage.removeItem('role')
        if (action.payload.clinicianId) localStorage.setItem('clinicianId', action.payload.clinicianId)
        else localStorage.removeItem('clinicianId')
      } catch {}
    },
    clearAuth(state) {
      state.token = null
      state.patientId = null
      state.username = null
      state.role = null
      state.clinicianId = null
      try {
        localStorage.removeItem('token')
        localStorage.removeItem('patientId')
        localStorage.removeItem('username')
        localStorage.removeItem('role')
        localStorage.removeItem('clinicianId')
      } catch {}
    }
  }
})

export const { setAuth, clearAuth } = authSlice.actions
export default authSlice.reducer
