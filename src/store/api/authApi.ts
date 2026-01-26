import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

// For now use a fake baseQuery to mock server response
const fakeBaseQuery = async ({ url, method, body }: { url: string; method: string; body?: any }) => {
  // simulate network latency
  await new Promise(r => setTimeout(r, 300))

  if (url === '/sign-in' && method === 'POST') {
    const { email, password } = body || {}
    if (!email || !password) {
      return { error: { status: 400, data: { message: 'Missing credentials' } } }
    }

    // simple mock: accept any credentials, return a fake JWT and username
    const username = email.split('@')[0]
    const fakeToken = btoa(JSON.stringify({ sub: username, iat: Date.now() }))
    return { data: { token: fakeToken, username } }
  }

  return { error: { status: 404, data: { message: 'Not found' } } }
}

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fakeBaseQuery as any,
  endpoints: (build) => ({
    signIn: build.mutation<{ token: string; username: string }, { email: string; password: string }>({
      query: (credentials) => ({ url: '/sign-in', method: 'POST', body: credentials })
    })
  })
})

export const { useSignInMutation } = authApi
