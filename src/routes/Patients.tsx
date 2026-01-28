import React, { useState, useRef, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../store'
import { useGetClinicianPatientsQuery, useGetAllPatientsQuery, useAssignPatientMutation, useUnassignPatientMutation, useGetPatientSummaryQuery } from '../store/api/patientsApi'
import { useGetGoalsByPatientQuery, useUpdateGoalsByPatientMutation } from '../store/api/goalsApi'
import { useGetLogsByPatientQuery, useDeleteLogMutation } from '../store/api/logsApi'
import { MdPersonAdd, MdPersonRemove, MdEdit, MdDelete } from 'react-icons/md'

export default function Patients() {
  const auth = useSelector((s: RootState) => s.auth)
  const [tab, setTab] = useState<'all' | 'mine'>('mine')
  const { data: allPatients, isLoading: loadingAll, isError: errorAll } = useGetAllPatientsQuery(undefined, { skip: auth?.role !== 'clinician' })
  const { data: myPatientsResp, isLoading: loadingMy, isError: errorMy } = useGetClinicianPatientsQuery(undefined, { skip: auth?.role !== 'clinician' })

  const patients = tab === 'all' ? (allPatients || []) : (myPatientsResp || [])
  const isLoading = tab === 'all' ? loadingAll : loadingMy
  const isError = tab === 'all' ? errorAll : errorMy
  const [assignPatient] = useAssignPatientMutation()
  const [unassignPatient] = useUnassignPatientMutation()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null)

  const selectedId = selectedPatient ? String(selectedPatient.id) : ''
  const { data: goals, error: goalsError, isError: goalsIsError, isLoading: goalsLoading, refetch: refetchGoals } = useGetGoalsByPatientQuery(selectedId, { skip: !selectedId })
  const [updateGoals] = useUpdateGoalsByPatientMutation()
  const { data: summary, isLoading: summaryLoading, isError: summaryError, refetch: refetchSummary } = useGetPatientSummaryQuery(selectedId, { skip: !selectedId || tab !== 'mine' })
  const isGoalsNotFound = Boolean(
    goalsIsError && (
      (goalsError as any)?.status === 404 ||
      (goalsError as any)?.originalStatus === 404 ||
      (goalsError as any)?.data?.status === 404
    )
  )
  const today = new Date()
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, '0')
  const d = String(today.getDate()).padStart(2, '0')
  const dateStr = `${y}-${m}-${d}`
  const { data: todaysLogs, isLoading: logsLoading } = useGetLogsByPatientQuery({ patientId: selectedId, startDate: dateStr, endDate: dateStr }, { skip: !selectedId || tab === 'mine' })
  const [deleteLog] = useDeleteLogMutation()

  const clinicianId = auth?.clinicianId ?? null
  const myPatients = myPatientsResp || []
  const [expandedDate, setExpandedDate] = useState<string | null>(null)
  const [editingMacro, setEditingMacro] = useState<'protein' | 'carbs' | 'fiber' | null>(null)
  const [editValue, setEditValue] = useState<number | ''>('')
  const editInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!editingMacro) return
    // focus input after popover opens
    setTimeout(() => {
      editInputRef.current?.focus?.()
    }, 0)
  }, [editingMacro])

  const formatMacro = (v: any) => {
    if (v == null || v === '—') return '—'
    const n = Number(v)
    if (Number.isNaN(n)) return '—'
    return String(Math.round(n))
  }

  const bubbleStyle = (type: 'protein' | 'carbs' | 'fiber') => {
    const base: any = {
      width: 28,
      height: 28,
      minWidth: 28,
      borderRadius: '50%',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 700,
      color: '#fff',
      fontSize: 12,
    }
    if (type === 'protein') return { ...base, background: '#ff7b7b' }
    if (type === 'carbs') return { ...base, background: '#7bbcff' }
    return { ...base, background: '#6fcf97' }
  }

  return (
    <div className="patients-page">
      <div style={{ marginTop: 8, marginBottom: 12, display: 'flex', gap: 8 }}>
        <button
          onClick={() => setTab('mine')}
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            border: '1px solid transparent',
            background: tab === 'mine' ? '#5b4fc6' : '#f3f4f6',
            color: tab === 'mine' ? '#ffffff' : '#6b7280',
            textAlign: 'center',
            cursor: 'pointer',
            fontWeight: 600,
            minWidth: 120,
            transition: 'background 140ms ease, color 140ms ease',
          }}
        >
          My patients
        </button>
        <button
          onClick={() => setTab('all')}
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            border: '1px solid transparent',
            background: tab === 'all' ? '#5b4fc6' : '#f3f4f6',
            color: tab === 'all' ? '#ffffff' : '#6b7280',
            textAlign: 'center',
            cursor: 'pointer',
            fontWeight: 600,
            minWidth: 120,
            transition: 'background 140ms ease, color 140ms ease',
          }}
        >
          All patients
        </button>
      </div>

      <div className="patients-list">
        {isLoading && <div>Loading patients...</div>}
        {isError && <div>Unable to load patients.</div>}

        {!isLoading && tab === 'all' && (
          <ul>
            {(patients || []).map((p: any) => {
              const isAssigned = (myPatientsResp || []).some((mp: any) => String(mp.id) === String(p.id))
              return (
                <li key={p.id}>
                  <div style={{ display: 'flex', minWidth: 0, gap: 12, alignItems: 'center' }}>
                    <div className="patient-name">{p.name}</div>
                    <div className="patient-meta">{p.email} · {p.age}y · {p.weight}kg · {p.height}cm</div>
                  </div>
                  <div>
                    {isAssigned ? (
                      <button className="icon-button" title="Unassign patient" disabled={pendingId === String(p.id)} onClick={async (e) => {
                        e.stopPropagation()
                        try { setPendingId(String(p.id)); await unassignPatient(String(p.id)).unwrap() } catch {} finally { setPendingId(null) }
                      }}>
                        <MdPersonRemove size={18} color="#ff6b6b" />
                      </button>
                    ) : (
                      <button className="icon-button" title="Assign patient" disabled={pendingId === String(p.id)} onClick={async (e) => {
                        e.stopPropagation()
                        try { setPendingId(String(p.id)); await assignPatient(String(p.id)).unwrap() } catch {} finally { setPendingId(null) }
                      }}>
                        <MdPersonAdd size={18} color="#2563eb" />
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
            {(!patients || patients.length === 0) && <li>No patients found.</li>}
          </ul>
        )}

        {!isLoading && tab === 'mine' && (
          (myPatients && myPatients.length === 0) ? (
            <div className="patients-empty">No patients assigned to you.</div>
          ) : (
            <ul>
              {(myPatients || []).map((p: any) => (
                <li key={p.id} className="clickable" onClick={() => setSelectedPatient(p)}>
                  <div style={{ display: 'flex', minWidth: 0, gap: 12, alignItems: 'center' }}>
                    <div className="patient-name">{p.name}</div>
                    <div className="patient-meta">{p.email} · {p.age}y · {p.weight}kg · {p.height}cm</div>
                  </div>
                  <div>
                    <button className="icon-button" title="Unassign patient" disabled={pendingId === String(p.id)} onClick={async (e) => {
                      e.stopPropagation()
                      try { setPendingId(String(p.id)); await unassignPatient(String(p.id)).unwrap() } catch {} finally { setPendingId(null) }
                    }}>
                      <MdPersonRemove size={18} color="#ff6b6b" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )
        )}
      </div>
      {selectedPatient && (
        <div className="log-modal-backdrop" onClick={() => setSelectedPatient(null)}>
          <div className="log-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close" onClick={() => setSelectedPatient(null)} aria-label="Close">✕</button>
            <h4>{selectedPatient.name}</h4>
            {/* goals and today's logs for selected patient */}
            <>
              {(() => {
                // Show loading state when fetching summary/goals/logs
                if (tab === 'mine') {
                  if (summaryLoading) return (
                    <div className="log-modal modal-loading"><div className="loading-circle" /></div>
                  )
                  if (summaryError) return <div style={{ padding: '12px 6px', color: '#666', fontSize: 14 }}>No summary available for this patient.</div>
                  if (summary) {
                    const latestLogs = summary.latestLogs || []
                    const clamp = (v: number) => Math.max(0, Math.min(1, Number(v) || 0))

                    // group latestLogs by date
                    const logsByDate: Record<string, any[]> = {}
                    latestLogs.forEach((l: any) => {
                      const dt = new Date(l.logTime || l.timestamp || Date.now())
                      const yy = dt.getFullYear()
                      const mm = String(dt.getMonth() + 1).padStart(2, '0')
                      const dd = String(dt.getDate()).padStart(2, '0')
                      const key = `${yy}-${mm}-${dd}`
                      ;(logsByDate[key] = logsByDate[key] || []).push(l)
                    })

                    const dates = Object.keys(logsByDate).sort((a, b) => (a < b ? 1 : -1))

                    return (
                      <>
                        {dates.length === 0 && <div style={{ padding: '12px 6px', color: '#666', fontSize: 14 }}>No goals yet</div>}
                        {dates.map((dateKey) => {
                          const items = logsByDate[dateKey]
                          const visibleItems = (items || []).filter((log: any) => {
                            let p = 0, c = 0, f = 0
                            try {
                              const details = typeof log.details === 'string' ? JSON.parse(log.details) : (log.details || {})
                              p = Number(log.proteinGrams ?? details.proteinGrams ?? details.protein ?? details.protein_g ?? 0) || 0
                              c = Number(log.carbGrams ?? details.carbGrams ?? details.carbs ?? details.carbs_g ?? details.carb ?? 0) || 0
                              f = Number(log.fiberGrams ?? details.fiberGrams ?? details.fiber ?? details.fiber_g ?? 0) || 0
                            } catch (e) {
                              // ignore parse errors
                            }
                            return p > 0 || c > 0 || f > 0
                          })
                          const proteinCurrent = items.reduce((sum: number, l: any) => sum + (Number(l.proteinGrams ?? 0) || 0), 0)
                          const carbsCurrent = items.reduce((sum: number, l: any) => sum + (Number(l.carbGrams ?? 0) || 0), 0)
                          const fiberCurrent = items.reduce((sum: number, l: any) => sum + (Number(l.fiberGrams ?? 0) || 0), 0)

                          const proteinTarget = goals?.dailyProteinMax ?? null
                          const carbsTarget = goals?.dailyCarbsMax ?? null
                          const fiberTarget = goals?.dailyFiberMax ?? null

                          const proteinPct = proteinTarget ? clamp(proteinCurrent / proteinTarget) : 0
                          const carbsPct = carbsTarget ? clamp(carbsCurrent / carbsTarget) : 0
                          const fiberPct = fiberTarget ? clamp(fiberCurrent / fiberTarget) : 0

                          const friendlyDate = new Date(dateKey).toLocaleDateString()

                          return (
                            <div key={dateKey} className="summary-line" onClick={() => setExpandedDate(expandedDate === dateKey ? null : dateKey)} style={{ cursor: 'pointer' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ fontWeight: 700 }}>{friendlyDate}</div>
                                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                  <div className="macro protein" style={{ width: 84, position: 'relative' }}>
                                    <div className="ring" style={{ ['--pct' as any]: proteinPct, ['--size' as any]: '72px' }} onClick={(e) => e.stopPropagation()}>
                                      <div className="ring-inner">
                                        <div className="value" style={{ fontSize: 13 }}>{proteinTarget ? `${proteinCurrent}/${proteinTarget}` : `${proteinCurrent}g`}</div>
                                      </div>
                                      <div className="edit-icon" onClick={(e) => { e.stopPropagation(); setEditingMacro('protein'); setEditValue(proteinTarget ?? ''); }}>
                                        <MdEdit size={16} color="#6b7280" />
                                      </div>
                                    </div>
                                    {editingMacro === 'protein' && (
                                      <div className="edit-popover" onClick={(e) => e.stopPropagation()}>
                                        <input ref={editInputRef} type="number" value={editValue} onChange={(e) => setEditValue(e.target.value === '' ? '' : Number(e.target.value))} />
                                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                                          <button onClick={() => { setEditingMacro(null); setEditValue('') }}>Cancel</button>
                                          <button onClick={async () => {
                                            const pid = selectedId || String(selectedPatient?.id || '')
                                            const current = goals || { patientId: Number(pid || 0), dailyCarbsMin: 0, dailyCarbsMax: 0, dailyProteinMin: 0, dailyProteinMax: 0, dailyFiberMin: 0, dailyFiberMax: 0, additionalNotes: '' }
                                            const body = { ...current, patientId: Number(pid || 0) }
                                            const v = Number(editValue || 0)
                                            // mapping: when editing Protein, update protein targets
                                            body.dailyProteinMin = v
                                            body.dailyProteinMax = v
                                            try { await updateGoals({ patientId: pid, body }).unwrap(); setEditingMacro(null); setEditValue(''); try { refetchGoals(); if (typeof refetchSummary === 'function') { refetchSummary() } } catch (e) {} } catch (e) {}
                                          }}>Save</button>
                                        </div>
                                      </div>
                                    )}
                                    <div style={{ textAlign: 'center', marginTop: 6, color: '#666', fontSize: 12 }}>Protein</div>
                                  </div>

                                  <div className="macro carbs" style={{ width: 84, position: 'relative' }}>
                                    <div className="ring" style={{ ['--pct' as any]: carbsPct, ['--size' as any]: '72px' }} onClick={(e) => e.stopPropagation()}>
                                      <div className="ring-inner">
                                        <div className="value" style={{ fontSize: 13 }}>{carbsTarget ? `${carbsCurrent}/${carbsTarget}` : `${carbsCurrent}g`}</div>
                                      </div>
                                      <div className="edit-icon" onClick={(e) => { e.stopPropagation(); setEditingMacro('carbs'); setEditValue(carbsTarget ?? ''); }}>
                                        <MdEdit size={16} color="#6b7280" />
                                      </div>
                                    </div>
                                    {editingMacro === 'carbs' && (
                                      <div className="edit-popover" onClick={(e) => e.stopPropagation()}>
                                        <input ref={editInputRef} type="number" value={editValue} onChange={(e) => setEditValue(e.target.value === '' ? '' : Number(e.target.value))} />
                                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                                          <button onClick={() => { setEditingMacro(null); setEditValue('') }}>Cancel</button>
                                          <button onClick={async () => {
                                            const pid = selectedId || String(selectedPatient?.id || '')
                                            const current = goals || { patientId: Number(pid || 0), dailyCarbsMin: 0, dailyCarbsMax: 0, dailyProteinMin: 0, dailyProteinMax: 0, dailyFiberMin: 0, dailyFiberMax: 0, additionalNotes: '' }
                                            const body = { ...current, patientId: Number(pid || 0) }
                                            const v = Number(editValue || 0)
                                            // mapping per spec (carbs -> dailyCarbsMin/Max)
                                            body.dailyCarbsMin = v
                                            body.dailyCarbsMax = v
                                            try { await updateGoals({ patientId: pid, body }).unwrap(); setEditingMacro(null); setEditValue(''); try { refetchGoals(); if (typeof refetchSummary === 'function') { refetchSummary() } } catch (e) {} } catch (e) {}
                                          }}>Save</button>
                                        </div>
                                      </div>
                                    )}
                                    <div style={{ textAlign: 'center', marginTop: 6, color: '#666', fontSize: 12 }}>Carbs</div>
                                  </div>

                                  <div className="macro fiber" style={{ width: 84, position: 'relative' }}>
                                    <div className="ring" style={{ ['--pct' as any]: fiberPct, ['--size' as any]: '72px' }} onClick={(e) => e.stopPropagation()}>
                                      <div className="ring-inner">
                                        <div className="value" style={{ fontSize: 13 }}>{fiberTarget ? `${fiberCurrent}/${fiberTarget}` : `${fiberCurrent}g`}</div>
                                      </div>
                                      <div className="edit-icon" onClick={(e) => { e.stopPropagation(); setEditingMacro('fiber'); setEditValue(fiberTarget ?? ''); }}>
                                        <MdEdit size={16} color="#6b7280" />
                                      </div>
                                    </div>
                                    {editingMacro === 'fiber' && (
                                      <div className="edit-popover" onClick={(e) => e.stopPropagation()}>
                                        <input ref={editInputRef} type="number" value={editValue} onChange={(e) => setEditValue(e.target.value === '' ? '' : Number(e.target.value))} />
                                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                                          <button onClick={() => { setEditingMacro(null); setEditValue('') }}>Cancel</button>
                                          <button onClick={async () => {
                                            const pid = selectedId || String(selectedPatient?.id || '')
                                            const current = goals || { patientId: Number(pid || 0), dailyCarbsMin: 0, dailyCarbsMax: 0, dailyProteinMin: 0, dailyProteinMax: 0, dailyFiberMin: 0, dailyFiberMax: 0, additionalNotes: '' }
                                            const body = { ...current, patientId: Number(pid || 0) }
                                            const v = Number(editValue || 0)
                                            // mapping per spec (fiber -> dailyFiberMin/Max)
                                            body.dailyFiberMin = v
                                            body.dailyFiberMax = v
                                            try { await updateGoals({ patientId: pid, body }).unwrap(); setEditingMacro(null); setEditValue(''); try { refetchGoals(); if (typeof refetchSummary === 'function') { refetchSummary() } } catch (e) {} } catch (e) {}
                                          }}>Save</button>
                                        </div>
                                      </div>
                                    )}
                                    <div style={{ textAlign: 'center', marginTop: 6, color: '#666', fontSize: 12 }}>Fiber</div>
                                  </div>
                                </div>
                              </div>

                              {expandedDate === dateKey && (
                                <div className="log-list-plain">
                                  {(visibleItems || []).map((log: any) => {
                                    let parsed: any = {}
                                    try {
                                      parsed = typeof log.details === 'string' ? JSON.parse(log.details) : (log.details || {})
                                    } catch (e) {
                                      parsed = log.details || {}
                                    }
                                    const normalized = {
                                      ...parsed,
                                      proteinGrams: parsed?.proteinGrams ?? log.proteinGrams ?? parsed?.protein ?? parsed?.protein_g ?? null,
                                      carbGrams: parsed?.carbGrams ?? log.carbGrams ?? parsed?.carbs ?? parsed?.carbs_g ?? parsed?.carb ?? null,
                                      fiberGrams: parsed?.fiberGrams ?? log.fiberGrams ?? parsed?.fiber ?? parsed?.fiber_g ?? null,
                                    }
                                    const protein = normalized.proteinGrams ?? '—'
                                    const carbs = normalized.carbGrams ?? '—'
                                    const fiber = normalized.fiberGrams ?? '—'
                                    return (
                                      <div key={log.id} className="log-card" onClick={(e) => e.stopPropagation()} style={{ width: '100%', padding: '8px 12px', textAlign: 'left', marginTop: 8 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, width: '100%' }}>
                                          <div style={{ minWidth: 0 }}>
                                            <div className="log-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.description || 'Log'}</div>
                                            <div className="log-ts" style={{ fontSize: 12, color: '#666' }}>{new Date(log.logTime || log.timestamp || Date.now()).toLocaleTimeString()}</div>
                                          </div>
                                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                            <span title={String(protein)} style={bubbleStyle('protein')}>{formatMacro(protein)}</span>
                                            <span title={String(carbs)} style={bubbleStyle('carbs')}>{formatMacro(carbs)}</span>
                                            <span title={String(fiber)} style={bubbleStyle('fiber')}>{formatMacro(fiber)}</span>
                                            <button className="icon-button delete-log" title="Delete log" onClick={async (e) => {
                                              e.stopPropagation()
                                              try {
                                                await deleteLog(String(log.id)).unwrap()
                                                if (typeof refetchSummary === 'function') {
                                                  refetchSummary()
                                                }
                                              } catch (e) {
                                                // swallow errors for now
                                              }
                                            }}>
                                              <MdDelete size={16} color="#ef4444" />
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          )
                        })}

                        
                      </>
                    )
                  }
                }

                // Fallback for non-My-patients modal: existing goals + todaysLogs logic
                if (isGoalsNotFound) {
                  return (
                    <div style={{ padding: '12px 6px', color: '#666', fontSize: 14 }}>
                      No goals found for this patient.
                    </div>
                  )
                }

                if (goalsLoading || logsLoading) {
                  return (
                    <div className="log-modal modal-loading"><div className="loading-circle" /></div>
                  )
                }

                const sourceForTotals = (todaysLogs || []).filter((l: any) => l && l.summary === false)
                const proteinCurrent = sourceForTotals.reduce((sum: number, l: any) => sum + (Number(l.proteinGrams ?? 0) || 0), 0)
                const carbsCurrent = sourceForTotals.reduce((sum: number, l: any) => sum + (Number(l.carbGrams ?? 0) || 0), 0)
                const fiberCurrent = sourceForTotals.reduce((sum: number, l: any) => sum + (Number(l.fiberGrams ?? 0) || 0), 0)

                const proteinTarget = goals?.dailyProteinMax
                const carbsTarget = goals?.dailyCarbsMax
                const fiberTarget = goals?.dailyFiberMax
                const clamp = (v: number) => Math.max(0, Math.min(1, Number(v) || 0))
                const proteinPct = proteinTarget ? clamp(proteinCurrent / proteinTarget) : 0
                const carbsPct = carbsTarget ? clamp(carbsCurrent / carbsTarget) : 0
                const fiberPct = fiberTarget ? clamp(fiberCurrent / fiberTarget) : 0

                return (
                  <>
                    <div className="summary-line">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                        <div style={{ fontWeight: 700 }}>{new Date().toLocaleDateString()}</div>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                          <div className="macro protein" style={{ width: 84 }}>
                            <div className="ring" style={{ ['--pct' as any]: proteinPct, ['--size' as any]: '72px' }}>
                              <div className="ring-inner">
                                <div className="value" style={{ fontSize: 13 }}>{proteinTarget ? `${proteinCurrent}/${proteinTarget}` : `${proteinCurrent}g`}</div>
                              </div>
                            </div>
                            <div style={{ textAlign: 'center', marginTop: 6, color: '#666', fontSize: 12 }}>Protein</div>
                          </div>

                          <div className="macro carbs" style={{ width: 84 }}>
                            <div className="ring" style={{ ['--pct' as any]: carbsPct, ['--size' as any]: '72px' }}>
                              <div className="ring-inner">
                                <div className="value" style={{ fontSize: 13 }}>{carbsTarget ? `${carbsCurrent}/${carbsTarget}` : `${carbsCurrent}g`}</div>
                              </div>
                            </div>
                            <div style={{ textAlign: 'center', marginTop: 6, color: '#666', fontSize: 12 }}>Carbs</div>
                          </div>

                          <div className="macro fiber" style={{ width: 84 }}>
                            <div className="ring" style={{ ['--pct' as any]: fiberPct, ['--size' as any]: '72px' }}>
                              <div className="ring-inner">
                                <div className="value" style={{ fontSize: 13 }}>{fiberTarget ? `${fiberCurrent}/${fiberTarget}` : `${fiberCurrent}g`}</div>
                              </div>
                            </div>
                            <div style={{ textAlign: 'center', marginTop: 6, color: '#666', fontSize: 12 }}>Fiber</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                  </>
                )
              })()}
            </>
          </div>
        </div>
      )}
    </div>
  )
}
