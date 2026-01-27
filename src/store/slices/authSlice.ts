import { createSlice, PayloadAction } from '@reduxjs/toolkit'

type AuthState = {
  token: string | null
  patientId?: string | null
}

const initialState: AuthState = {
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  patientId: typeof window !== 'undefined' ? localStorage.getItem('patientId') : null
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth(state, action: PayloadAction<{ token: string; patientId?: string }>) {
      state.token = action.payload.token
      state.patientId = action.payload.patientId ?? null
      try {
        localStorage.setItem('token', action.payload.token)
        // username is not persisted to localStorage
        if (action.payload.patientId) localStorage.setItem('patientId', action.payload.patientId)
        else localStorage.removeItem('patientId')
      } catch {}
    },
    clearAuth(state) {
      state.token = null
      try {
        localStorage.removeItem('token')
        // username not stored, nothing to remove
      } catch {}
    }
  }
})

export const { setAuth, clearAuth } = authSlice.actions
export default authSlice.reducer
