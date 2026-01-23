import React from 'react'
import { Routes, Route, NavLink, Navigate } from 'react-router-dom'
import Chat from './routes/Chat'
import Track from './routes/Track'
import Achievements from './routes/Achievements'

export default function App() {
  return (
    <div className="app-root">
      <header className="app-header">
        <h1>Nutrition Coach</h1>
        <nav>
          <NavLink to="/chat" className={({ isActive }) => (isActive ? 'active' : '')}>Chat</NavLink>
          <NavLink to="/track" className={({ isActive }) => (isActive ? 'active' : '')}>Track</NavLink>
          <NavLink to="/achievements" className={({ isActive }) => (isActive ? 'active' : '')}>Achievements</NavLink>
        </nav>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Navigate to="/chat" replace />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/track" element={<Track />} />
          <Route path="/achievements" element={<Achievements />} />
        </Routes>
      </main>
    </div>
  )
}
