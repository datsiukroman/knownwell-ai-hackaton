import { createSlice, PayloadAction } from '@reduxjs/toolkit'

type AuthState = {
  token: string | null
  username: string | null
}

const initialState: AuthState = {
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  username: typeof window !== 'undefined' ? localStorage.getItem('username') : null
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth(state, action: PayloadAction<{ token: string; username: string }>) {
      state.token = action.payload.token
      state.username = action.payload.username
      try {
        localStorage.setItem('token', action.payload.token)
        localStorage.setItem('username', action.payload.username)
      } catch {}
    },
    clearAuth(state) {
      state.token = null
      state.username = null
      try {
        localStorage.removeItem('token')
        localStorage.removeItem('username')
      } catch {}
    }
  }
})

export const { setAuth, clearAuth } = authSlice.actions
export default authSlice.reducer
