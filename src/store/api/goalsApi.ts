import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { RootState } from '../index'

const baseUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8080'

export const goalsApi = createApi({
  reducerPath: 'goalsApi',
  tagTypes: ['Goals'],
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth?.token
      if (token) headers.set('Authorization', `Bearer ${token}`)
      return headers
    },
  }),
  endpoints: (build) => ({
    getGoalsByPatient: build.query<any, string>({
      query: (patientId) => `/api/goals/patient/${patientId}`,
      providesTags: (result, error, id) =>
        result
          ? [
              { type: 'Goals' as const, id },
              { type: 'Goals' as const, id: 'LIST' },
            ]
          : [{ type: 'Goals' as const, id: 'LIST' }],
    }),
    updateGoalsByPatient: build.mutation<any, { patientId: string; body: any }>({
      query: ({ patientId, body }) => ({
        url: `/api/goals/patient/${patientId}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { patientId }) => [{ type: 'Goals' as const, id: String(patientId) }, { type: 'Goals' as const, id: 'LIST' }],
    }),
  }),
})

export const { useGetGoalsByPatientQuery, useUpdateGoalsByPatientMutation } = goalsApi
