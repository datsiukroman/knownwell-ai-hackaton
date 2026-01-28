import React, { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../store'
import { useGetGoalsByPatientQuery } from '../store/api/goalsApi'
import { useGetLogsByPatientQuery } from '../store/api/logsApi'

export default function Track() {
  const [selectedLog, setSelectedLog] = useState<any | null>(null)
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly'>('daily')

 

  const today = useMemo(() => new Date(), [])

  const isSelectedWeekly = (sel: any | null) => sel && sel.type === 'weekly'
  

  const auth = useSelector((s: RootState) => s.auth)
  const { data: goals } = useGetGoalsByPatientQuery(String(auth?.patientId || ''), { skip: !auth?.patientId })
  const proteinTarget = goals?.dailyProteinMax
  const carbsTarget = goals?.dailyCarbsMax
  const fiberTarget = goals?.dailyFiberMax

  // compute start/end of today for logs query in YYYY-MM-DD format
  const todayDateString = useMemo(() => {
    const d = new Date(today)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }, [today])

  const { data: todaysLogs } = useGetLogsByPatientQuery(
    { patientId: String(auth?.patientId || ''), startDate: todayDateString, endDate: todayDateString },
    { skip: !auth?.patientId, refetchOnMountOrArgChange: true }
  )

  // compute start/end of current week (Monday..Sunday) and format as YYYY-MM-DD
  const weekRange = useMemo(() => {
    const d = new Date(today)
    const day = d.getDay()
    const diffToMonday = (day + 6) % 7 // 0 -> Monday offset
    const monday = new Date(d)
    monday.setDate(d.getDate() - diffToMonday)
    monday.setHours(0, 0, 0, 0)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    sunday.setHours(23, 59, 59, 999)
    const fmt = (dt: Date) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
    return { start: fmt(monday), end: fmt(sunday) }
  }, [today])

  const { data: weeklyLogs } = useGetLogsByPatientQuery({ patientId: String(auth?.patientId || ''), startDate: weekRange.start, endDate: weekRange.end }, { skip: !auth?.patientId })

  // compute today's nutrition totals — use logs where summary === false
  const todaysSourceLogs = (todaysLogs || []).filter(Boolean)
  const sourceForTotals = todaysSourceLogs.filter((l: any) => l.summary === false)
  const proteinCurrent = sourceForTotals.reduce((sum: number, l: any) => sum + (Number(l.proteinGrams ?? 0) || 0), 0)
  const carbsCurrent = sourceForTotals.reduce((sum: number, l: any) => sum + (Number(l.carbGrams ?? 0) || 0), 0)
  const fiberCurrent = sourceForTotals.reduce((sum: number, l: any) => sum + (Number(l.fiberGrams ?? 0) || 0), 0)

  const clamp = (v: number) => Math.max(0, Math.min(1, Number(v) || 0))
  const proteinPct = proteinTarget ? clamp(proteinCurrent / proteinTarget) : 0
  const carbsPct = carbsTarget ? clamp(carbsCurrent / carbsTarget) : 0
  const fiberPct = fiberTarget ? clamp(fiberCurrent / fiberTarget) : 0

  const bubbleStyle = (type: 'protein' | 'carbs' | 'fiber') => {
    const base: any = {
      width: 36,
      height: 36,
      minWidth: 36,
      borderRadius: '50%',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 600,
      color: '#fff',
      fontSize: 12,
    }
    if (type === 'protein') return { ...base, background: '#ff7b7b' }
    if (type === 'carbs') return { ...base, background: '#7bbcff' }
    return { ...base, background: '#6fcf97' }
  }

  const formatMacro = (v: any) => {
    if (v == null || v === '—') return '—'
    const n = Number(v)
    if (Number.isNaN(n)) return '—'
    return String(Math.round(n))
  }

  return (
    <div className="track-root">

      <section className="today-goals">
        <h3>Today's nutrition goals</h3>
        <div className="macros-row">
          <div className="macro protein">
            <div className="ring" style={{ ['--pct' as any]: proteinPct }}>
              <div className="ring-inner">
                <div className="value">{proteinTarget ? `${proteinCurrent} / ${proteinTarget} g` : (proteinCurrent ? `${proteinCurrent}g` : '—')}</div>
              </div>
            </div>
            <div className="label">Protein</div>
          </div>

          <div className="macro carbs">
            <div className="ring" style={{ ['--pct' as any]: carbsPct }}>
              <div className="ring-inner">
                <div className="value">{carbsTarget ? `${carbsCurrent} / ${carbsTarget} g` : (carbsCurrent ? `${carbsCurrent}g` : '—')}</div>
              </div>
            </div>
            <div className="label">Carbohydrates</div>
          </div>
          
          <div className="macro fiber">
            <div className="ring" style={{ ['--pct' as any]: fiberPct }}>
              <div className="ring-inner">
                <div className="value">{fiberTarget ? `${fiberCurrent} / ${fiberTarget} g` : (fiberCurrent ? `${fiberCurrent}g` : '—')}</div>
              </div>
            </div>
            <div className="label">Fiber</div>
          </div>
        </div>
      </section>
      {selectedLog && (
        <div className="log-modal-backdrop" onClick={() => setSelectedLog(null)}>
          <div className="log-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close" onClick={() => setSelectedLog(null)} aria-label="Close">✕</button>
            <h4>{selectedLog.title}</h4>
            {!isSelectedWeekly(selectedLog) && (
              <div className="log-ts">{new Date(selectedLog.timestamp).toLocaleString()}</div>
            )}
            <div className="log-meta">
              {(() => {
                let parsed: any = null
                try {
                  parsed = typeof selectedLog.details === 'string' ? JSON.parse(selectedLog.details) : selectedLog.details
                } catch (e) {
                  parsed = null
                }
                const protein = parsed?.proteinGrams ?? parsed?.protein ?? '—'
                const carbs = parsed?.carbGrams ?? parsed?.carbs ?? '—'
                const fiber = parsed?.fiberGrams ?? parsed?.fiber ?? '—'
                return (
                  <>
                    <div className="meta-item protein">Protein: {protein === '—' ? '—' : protein + ' g'}</div>
                    <div className="meta-item carbs">Carbs: {carbs === '—' ? '—' : carbs + ' g'}</div>
                    <div className="meta-item fiber">Fiber: {fiber === '—' ? '—' : fiber + ' g'}</div>
                  </>
                )
              })()}
            </div>
            {/* log-summary removed per UI update */}
          </div>
        </div>
      )}

      

      <div style={{ marginTop: 18, marginBottom: 12, display: 'flex', gap: 8 }}>
        <button
          onClick={() => setActiveTab('daily')}
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            border: '1px solid transparent',
            background: activeTab === 'daily' ? '#5b4fc6' : '#f3f4f6',
            color: activeTab === 'daily' ? '#ffffff' : '#6b7280',
            textAlign: 'center',
            cursor: 'pointer',
            fontWeight: 600,
            minWidth: 120,
            transition: 'background 140ms ease, color 140ms ease',
          }}
        >
          Today's logs
        </button>
        <button
          onClick={() => setActiveTab('weekly')}
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            border: '1px solid transparent',
            background: activeTab === 'weekly' ? '#5b4fc6' : '#f3f4f6',
            color: activeTab === 'weekly' ? '#ffffff' : '#6b7280',
            textAlign: 'center',
            cursor: 'pointer',
            fontWeight: 600,
            minWidth: 120,
            transition: 'background 140ms ease, color 140ms ease',
          }}
        >
          Weekly logs
        </button>
      </div>

      {activeTab === 'daily' && (
        <section className="daily-logs">
        <div className="logs-row">
          {!todaysLogs || todaysLogs.length === 0 ? (
            <div className="empty">No logs yet</div>
          ) : (
            todaysLogs
              .filter((log: any) => {
                if (!log || log.summary) return false
                const topProtein = log.proteinGrams
                const topCarb = log.carbGrams
                const topFiber = log.fiberGrams
                if (Number(topProtein || 0) > 0 || Number(topCarb || 0) > 0 || Number(topFiber || 0) > 0) return true
                try {
                  const details = typeof log.details === 'string' ? JSON.parse(log.details) : (log.details || {})
                  const p = details?.proteinGrams ?? details?.protein ?? details?.protein_g
                  const c = details?.carbGrams ?? details?.carbs ?? details?.carbs_g ?? details?.carb
                  const f = details?.fiberGrams ?? details?.fiber ?? details?.fiber_g
                  return Number(p || 0) > 0 || Number(c || 0) > 0 || Number(f || 0) > 0
                } catch (e) {
                  return false
                }
              })
              .map((log: any) => {
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
                const item = {
                  id: log.id,
                  title: log.description || 'Log',
                  timestamp: log.logTime || Date.now(),
                  details: JSON.stringify(normalized),
                }
                return (
                  <button
                    key={log.id}
                    className="log-card clickable"
                    onClick={() => setSelectedLog(item)}
                    style={{ width: '100%', padding: '8px 12px', textAlign: 'left' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, width: '100%' }}>
                      <div style={{ minWidth: 0 }}>
                        <div className="log-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                        <div className="log-ts" style={{ fontSize: 12, color: '#666' }}>{new Date(item.timestamp).toLocaleTimeString()}</div>
                      </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span title={String(protein)} style={bubbleStyle('protein')}>{formatMacro(protein)}</span>
                        <span title={String(carbs)} style={bubbleStyle('carbs')}>{formatMacro(carbs)}</span>
                        <span title={String(fiber)} style={bubbleStyle('fiber')}>{formatMacro(fiber)}</span>
                      </div>
                    </div>
                  </button>
                )
              })
          )}
        </div>
        </section>
      )}

      {activeTab === 'weekly' && (
        <section className="weekly-logs">
        <div className="logs-row">
          {!weeklyLogs || weeklyLogs.filter((l: any) => l.summary === false).length === 0 ? (
            <div className="empty">No weekly logs</div>
          ) : (
            weeklyLogs
              .filter((log: any) => {
                if (!log || log.summary) return false
                const topProtein = log.proteinGrams
                const topCarb = log.carbGrams
                const topFiber = log.fiberGrams
                if (Number(topProtein || 0) > 0 || Number(topCarb || 0) > 0 || Number(topFiber || 0) > 0) return true
                try {
                  const details = typeof log.details === 'string' ? JSON.parse(log.details) : (log.details || {})
                  const p = details?.proteinGrams ?? details?.protein ?? details?.protein_g
                  const c = details?.carbGrams ?? details?.carbs ?? details?.carbs_g ?? details?.carb
                  const f = details?.fiberGrams ?? details?.fiber ?? details?.fiber_g
                  return Number(p || 0) > 0 || Number(c || 0) > 0 || Number(f || 0) > 0
                } catch (e) {
                  return false
                }
              })
              .map((log: any) => {
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
                const item = {
                  id: log.id,
                  title: log.description || 'Log',
                  timestamp: log.logTime || Date.now(),
                  details: JSON.stringify(normalized),
                  type: 'weekly',
                }
                return (
                  <button
                    key={log.id}
                    className="log-card clickable"
                    onClick={() => setSelectedLog(item)}
                    style={{ width: '100%', padding: '8px 12px', textAlign: 'left' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, width: '100%' }}>
                      <div style={{ minWidth: 0 }}>
                        <div className="log-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                        <div className="log-ts" style={{ fontSize: 12, color: '#666' }}>{new Date(item.timestamp).toLocaleString()}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span title={String(protein)} style={bubbleStyle('protein')}>{formatMacro(protein)}</span>
                        <span title={String(carbs)} style={bubbleStyle('carbs')}>{formatMacro(carbs)}</span>
                        <span title={String(fiber)} style={bubbleStyle('fiber')}>{formatMacro(fiber)}</span>
                      </div>
                    </div>
                  </button>
                )
              })
          )}
        </div>
        </section>
      )}
    </div>
  )
}

