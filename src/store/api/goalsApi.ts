import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { RootState } from '../index'

const baseUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8080'

export const goalsApi = createApi({
  reducerPath: 'goalsApi',
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
    }),
  }),
})

export const { useGetGoalsByPatientQuery } = goalsApi
