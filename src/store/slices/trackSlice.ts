import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import mockApi from '../../api/mockApi'

export type TrackItem = {
  id: string
  type: 'goal' | 'milestone' | 'summary'
  title: string
  details?: string
  timestamp: number
}

type TrackState = {
  items: TrackItem[]
}

const initialState: TrackState = { items: [] }

const trackSlice = createSlice({
  name: 'track',
  initialState,
  reducers: {
    setItems(state, action: PayloadAction<TrackItem[]>) {
      state.items = action.payload
    },
    addItem(state, action: PayloadAction<TrackItem>) {
      state.items.unshift(action.payload)
    }
  }
})

export const { setItems, addItem } = trackSlice.actions
export default trackSlice.reducer

// Thunk: add item and persist full track to mock storage
export const addItemAndPersist = (item: TrackItem) => async (dispatch: any, getState: any) => {
  dispatch(addItem(item))
  const items = getState().track.items as TrackItem[]
  await mockApi.persistTrack(items)
}
