import { configureStore } from '@reduxjs/toolkit'
import chatReducer from './slices/chatSlice'
import trackReducer from './slices/trackSlice'
import authReducer from './slices/authSlice'
import { authApi } from './api/authApi'
import { patientsApi } from './api/patientsApi'
import { chatApi } from './api/chatApi'
import { goalsApi } from './api/goalsApi'
import { logsApi } from './api/logsApi'

export const store = configureStore({
  reducer: {
    chat: chatReducer,
    track: trackReducer,
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
      [patientsApi.reducerPath]: patientsApi.reducer,
      [chatApi.reducerPath]: chatApi.reducer,
      [goalsApi.reducerPath]: goalsApi.reducer
      ,
      [logsApi.reducerPath]: logsApi.reducer
  }
  ,
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(authApi.middleware, patientsApi.middleware, chatApi.middleware, goalsApi.middleware, logsApi.middleware)
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
