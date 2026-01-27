import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { RootState } from '../index'

const baseUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8080'

export const chatApi = createApi({
  reducerPath: 'chatApi',
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth?.token
      if (token) headers.set('Authorization', `Bearer ${token}`)
      return headers
    },
  }),
  endpoints: (build) => ({
    postChat: build.mutation<any, { message: string; imageData?: string; imageMimeType?: string }>({
      query: (body) => ({ url: '/api/chat', method: 'POST', body }),
    }),
    getHistory: build.query<any[], string>({
      query: (patientId) => `/api/chat/history/${patientId}`,
    }),
  }),
})

export const { usePostChatMutation, useGetHistoryQuery } = chatApi
