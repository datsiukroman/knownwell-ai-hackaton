import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type Message = {
  id: string
  from: 'user' | 'bot'
  text?: string
  timestamp: number
  meta?: any
}

type ChatState = {
  messages: Message[]
}

const initialState: ChatState = {
  messages: []
}

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage(state, action: PayloadAction<Message>) {
      state.messages.push(action.payload)
    },
    setMessages(state, action: PayloadAction<Message[]>) {
      state.messages = action.payload
    }
    ,
    updateMessage(state, action: PayloadAction<{ id: string; changes: Partial<Message> }>) {
      const idx = state.messages.findIndex(m => m.id === action.payload.id)
      if (idx !== -1) {
        state.messages[idx] = { ...state.messages[idx], ...action.payload.changes }
      }
    }
  }
})

export const { addMessage, setMessages, updateMessage } = chatSlice.actions
export default chatSlice.reducer
