import React from 'react'
import { Routes, Route, NavLink, Navigate } from 'react-router-dom'
import Chat from './routes/Chat'
import Track from './routes/Track'
import Achievements from './routes/Achievements'
import CreateAccount from './routes/CreateAccount'
import Login from './routes/Login'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { RiLogoutCircleRLine } from 'react-icons/ri'
import { RootState } from './store'
import { useGetPatientQuery } from './store/api/patientsApi'
import { clearAuth } from './store/slices/authSlice'

export default function App() {
  const auth = useSelector((s: RootState) => s.auth)

  return (
    <div className="app-root">
      <header className="app-header">
        <h1>Nutrition Coach</h1>
        <nav>
          {auth?.token && (
            <>
              <NavLink to="/chat" className={({ isActive }) => (isActive ? 'active' : '')}>Chat</NavLink>
              <NavLink to="/track" className={({ isActive }) => (isActive ? 'active' : '')}>Track</NavLink>
              <NavLink to="/achievements" className={({ isActive }) => (isActive ? 'active' : '')}>Achievements</NavLink>
            </>
          )}
          {/** show create-account / sign-in when not authenticated; AuthNav handles that */}
          <AuthNav />
        </nav>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Navigate to="/chat" replace />} />
          <Route path="/chat" element={auth?.token ? <Chat /> : <Navigate to="/sign-in" replace />} />
          <Route path="/track" element={auth?.token ? <Track /> : <Navigate to="/sign-in" replace />} />
          <Route path="/achievements" element={auth?.token ? <Achievements /> : <Navigate to="/sign-in" replace />} />
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
  const { data: patient, isFetching } = useGetPatientQuery(auth?.patientId || '', { skip: !auth?.patientId })

  if (auth?.token) {
    const handleLogout = () => {
      dispatch(clearAuth())
      navigate('/sign-in')
    }

    return (
      <>
        <span className="nav-username">{patient?.name ?? (isFetching ? 'Loading...' : 'Loading...')}</span>
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
