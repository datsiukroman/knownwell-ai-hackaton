import { configureStore } from '@reduxjs/toolkit'
import chatReducer from './slices/chatSlice'
import trackReducer from './slices/trackSlice'

export const store = configureStore({
  reducer: {
    chat: chatReducer,
    track: trackReducer
  }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
