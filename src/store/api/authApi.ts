import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

const baseUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8080'

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({ baseUrl }),
  endpoints: (build) => ({
    signIn: build.mutation<{ token: string; username?: string; id?: string }, { username: string; password: string }>({
      query: (credentials) => ({ url: '/api/auth/signin', method: 'POST', body: credentials })
    }),
    signup: build.mutation<any, { email: string; name: string; username?: string; age?: number; weight?: number; height?: number; password: string; roles?: string[] }>({
      query: (payload) => ({ url: '/api/auth/signup', method: 'POST', body: payload })
    })
  })
})

export const { useSignInMutation, useSignupMutation } = authApi
