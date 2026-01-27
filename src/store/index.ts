import { configureStore } from '@reduxjs/toolkit'
import chatReducer from './slices/chatSlice'
import trackReducer from './slices/trackSlice'
import authReducer from './slices/authSlice'
import { authApi } from './api/authApi'
import { patientsApi } from './api/patientsApi'

export const store = configureStore({
  reducer: {
    chat: chatReducer,
    track: trackReducer,
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
    [patientsApi.reducerPath]: patientsApi.reducer
  }
  ,
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(authApi.middleware, patientsApi.middleware)
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
