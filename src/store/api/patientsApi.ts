import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { RootState } from '../index'

const baseUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8080'

export const patientsApi = createApi({
  reducerPath: 'patientsApi',
  tagTypes: ['Patients'],
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth?.token
      if (token) headers.set('Authorization', `Bearer ${token}`)
      return headers
    },
  }),
  endpoints: (build) => ({
    getPatient: build.query<any, string>({
      query: (id) => `/api/patients/${id}`,
    }),
    getAllPatients: build.query<any[], void>({
      query: () => `/api/patients`,
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Patients' as const, id })), { type: 'Patients', id: 'LIST' }]
          : [{ type: 'Patients', id: 'LIST' }],
    }),
    getClinicianPatients: build.query<any[], void>({
      query: () => `/api/clinician/patients`,
      // don't cache forever; keep default caching
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Patients' as const, id })), { type: 'Patients', id: 'LIST' }]
          : [{ type: 'Patients', id: 'LIST' }],
    }),
    assignPatient: build.mutation<void, string>({
      query: (id) => ({ url: `/api/clinician/patients/${id}/assign`, method: 'POST' }),
      invalidatesTags: [{ type: 'Patients', id: 'LIST' }],
    }),
    unassignPatient: build.mutation<void, string>({
      query: (id) => ({ url: `/api/clinician/patients/${id}/unassign`, method: 'POST' }),
      invalidatesTags: [{ type: 'Patients', id: 'LIST' }],
    }),
    getPatientSummary: build.query<any, string>({
      query: (id) => `/api/clinician/patients/${id}/summary`,
    }),
  }),
})

export const {
  useGetPatientQuery,
  useGetAllPatientsQuery,
  useGetClinicianPatientsQuery,
  useAssignPatientMutation,
  useUnassignPatientMutation,
  useGetPatientSummaryQuery,
} = patientsApi
