import React from 'react'
import { Routes, Route, NavLink, Navigate } from 'react-router-dom'
import Chat from './routes/Chat'
import Track from './routes/Track'
import Achievements from './routes/Achievements'
import Patients from './routes/Patients'
import CreateAccount from './routes/CreateAccount'
import Login from './routes/Login'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { RiLogoutCircleRLine } from 'react-icons/ri'
import { RootState } from './store'
import { useGetPatientQuery } from './store/api/patientsApi'
import { clearAuth } from './store/slices/authSlice'
import { setMessages } from './store/slices/chatSlice'
import { setItems } from './store/slices/trackSlice'
import { authApi } from './store/api/authApi'
import { patientsApi } from './store/api/patientsApi'
import { chatApi } from './store/api/chatApi'
import { goalsApi } from './store/api/goalsApi'
import { logsApi } from './store/api/logsApi'

export default function App() {
  const auth = useSelector((s: RootState) => s.auth)

  return (
    <div className="app-root">
      <header className="app-header">
        <h1>Nutrition Coach</h1>
        <nav>
          {auth?.token && auth?.role !== 'clinician' && (
            <>
              <NavLink to="/chat" className={({ isActive }) => (isActive ? 'active' : '')}>Chat</NavLink>
              <NavLink to="/track" className={({ isActive }) => (isActive ? 'active' : '')}>Track</NavLink>
            </>
          )}
          {auth?.token && auth?.role === 'clinician' && (
            <>
              <NavLink to="/patients" className={({ isActive }) => (isActive ? 'active' : '')}>Patients</NavLink>
            </>
          )}
          {/** show create-account / sign-in when not authenticated; AuthNav handles that */}
          <AuthNav />
        </nav>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Navigate to={auth?.role === 'clinician' ? '/patients' : '/chat'} replace />} />
          <Route
            path="/chat"
            element={
              auth?.token
                ? auth?.role === 'clinician'
                  ? <Navigate to="/track" replace />
                  : <Chat />
                : <Navigate to="/sign-in" replace />
            }
          />

          <Route
            path="/track"
            element={
              auth?.token
                ? auth?.role === 'clinician'
                  ? <Navigate to="/patients" replace />
                  : <Track />
                : <Navigate to="/sign-in" replace />
            }
          />
          <Route
            path="/achievements"
            element={
              auth?.token
                ? auth?.role === 'clinician'
                  ? <Navigate to="/track" replace />
                  : <Achievements />
                : <Navigate to="/sign-in" replace />
            }
          />
          <Route path="/patients" element={auth?.token && auth?.role === 'clinician' ? <Patients /> : <Navigate to="/sign-in" replace />} />
          <Route path="/create-account" element={<CreateAccount />} />
          <Route path="/sign-in" element={<Login />} />
        </Routes>
      </main>
    </div>
  )
}

function AuthNav() {
  const auth = useSelector((s: RootState) => s.auth)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { data: patient, isFetching } = useGetPatientQuery(auth?.patientId || '', { skip: !auth?.token || !auth?.patientId })

  if (auth?.token) {
    const handleLogout = () => {
      // clear auth + localStorage
      dispatch(clearAuth())
      // clear UI slices
      dispatch(setMessages([]))
      dispatch(setItems([]))
      // reset RTK Query caches/state for all APIs
      try {
        dispatch(authApi.util.resetApiState())
        dispatch(patientsApi.util.resetApiState())
        dispatch(chatApi.util.resetApiState())
        dispatch(goalsApi.util.resetApiState())
        dispatch(logsApi.util.resetApiState())
      } catch (e) {}
      navigate('/sign-in')
    }

    const roleLabel = (() => {
      // prefer explicit role from auth state (clinician), otherwise derive from patient data
      const a: any = (window as any)._reduxState?.auth || undefined
      // try to read from store via selector fallback
      // but we already have auth in component scope; use it
      // (we'll read auth from useSelector earlier)
      // if auth.role exists, map clinician -> Clinician
      // otherwise fall back to patient data
      // NOTE: using the auth selector is simpler; access below
      return auth?.role === 'clinician' ? 'Clinician' : (() => {
        const p: any = patient
        if (!p) return 'Patient'
        const roles = p.roles || (p.role ? [p.role] : null)
        if (Array.isArray(roles)) {
          return roles.map((r: string) => String(r).toLowerCase()).includes('clinician') ? 'Clinician' : 'Patient'
        }
        return (String(p.role || '').toLowerCase() === 'clinician') ? 'Clinician' : 'Patient'
      })()
    })()

    return (
      <>
        <span className="nav-username">{auth?.username ?? patient?.name ?? (isFetching ? 'Loading...' : 'Loading...')}
          <span className="nav-role">{roleLabel}</span>
        </span>
        <button
          title="Logout"
          onClick={handleLogout}
          className="nav-logout"
          style={{ marginLeft: 8, color: 'rgba(255,255,255,0.95)' }}
        >
          <RiLogoutCircleRLine size={18} />
        </button>
      </>
    )
  }

  return (
    <>
      <NavLink to="/create-account" className={({ isActive }) => (isActive ? 'active' : '')}>Create Account</NavLink>
      <NavLink to="/sign-in" className={({ isActive }) => (isActive ? 'active' : '')} style={{ marginLeft: 8 }}>Sign in</NavLink>
    </>
  )
}
