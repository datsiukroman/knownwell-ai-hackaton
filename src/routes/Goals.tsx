import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { v4 as uuid } from 'uuid'
import { addItemAndPersist } from '../store/slices/trackSlice'

export default function Goals() {
  const dispatch = useDispatch()
  const [title, setTitle] = useState('')
  const [details, setDetails] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setError('Please enter a goal title')
      return
    }
    const item = {
      id: uuid(),
      type: 'goal' as const,
      title: title.trim(),
      details: details.trim(),
      timestamp: Date.now()
    }
    // dispatch thunk which persists
    ;(dispatch as any)(addItemAndPersist(item))
    setTitle('')
    setDetails('')
    setError('')
  }
  return (
    <div className="goals-root">
      <h2>Goals</h2>

      {/* Today's goals moved to Track page */}

      {/* Add-goal form removed per request */}

      <div className="goal-card">
        <h3>Example: Daily Macros</h3>
        <ul>
          <li>Carbs: under 100-120 g/day</li>
          <li>Protein: 70-120 g/day (20-30 g per meal)</li>
          <li>Fiber: 25-30 g/day</li>
        </ul>
      </div>
    </div>
  )
}
