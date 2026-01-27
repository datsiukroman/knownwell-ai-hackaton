import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { RootState } from '../index'

const baseUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8080'

export const logsApi = createApi({
  reducerPath: 'logsApi',
  tagTypes: ['Logs'],
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth?.token
      if (token) headers.set('Authorization', `Bearer ${token}`)
      return headers
    },
  }),
  endpoints: (build) => ({
    getLogsByPatient: build.query<any[], { patientId: string; startDate?: string; endDate?: string }>({
      query: ({ patientId, startDate, endDate }) => ({
        url: `/api/logs/patient/${patientId}`,
        params: startDate || endDate ? { startDate, endDate } : undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map((r: any) => ({ type: 'Logs' as const, id: r.id })),
              { type: 'Logs', id: 'LIST' },
            ]
          : [{ type: 'Logs', id: 'LIST' }],
    }),
    createLog: build.mutation<any, any>({
      query: (body) => ({
        url: '/api/logs',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Logs', id: 'LIST' }],
    }),
  }),
})

export const { useGetLogsByPatientQuery, useCreateLogMutation } = logsApi
