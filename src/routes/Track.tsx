import React, { useEffect, useMemo, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../store'
import mockApi from '../api/mockApi'
import { setItems } from '../store/slices/trackSlice'

export default function Track() {
  const items = useSelector((s: RootState) => s.track.items)
  const dispatch = useDispatch()
  const [selectedLog, setSelectedLog] = useState<any | null>(null)
  const [macroModal, setMacroModal] = useState<string | null>(null)

  useEffect(() => {
    mockApi.loadInitialData().then((res) => {
      dispatch(setItems(res.track))
    })
  }, [dispatch])

  const parseDetails = (it: any) => {
    try {
      return typeof it.details === 'string' ? JSON.parse(it.details) : it.details
    } catch (e) {
      return null
    }
  }

  const weeklyItems = useMemo(() => items.filter((it) => it.type === 'weekly').map((it) => ({ ...it, parsed: parseDetails(it) })), [items])

  const isSameDay = (tsA: number | string | Date, tsB: Date) => {
    const a = new Date(tsA)
    return a.getFullYear() === tsB.getFullYear() && a.getMonth() === tsB.getMonth() && a.getDate() === tsB.getDate()
  }

  const macroKeyFor = (macro: string) => {
    switch (macro) {
      case 'protein':
        return 'protein_g'
      case 'carbs':
        return 'carbs_g'
      case 'fats':
        return 'fat_g'
      case 'fiber':
        return 'fiber_g'
      default:
        return null
    }
  }

  const today = useMemo(() => new Date(), [])

  const isSelectedWeekly = (sel: any | null) => sel && sel.type === 'weekly'

  const filteredForMacro = (macro: string) => {
    const key = macroKeyFor(macro)
    return items
      .filter((it) => it.type === 'milestone')
      .filter((it) => isSameDay(it.timestamp, today))
      .map((it) => ({ ...it, parsed: parseDetails(it) }))
      .filter((it) => {
        if (!it.parsed || !key) return false
        // support alternate fat field name
        if (key === 'fat_g' && (it.parsed.fat_g === undefined && it.parsed.fats_g !== undefined)) {
          return it.parsed.fats_g > 0
        }
        return (it.parsed[key] ?? 0) > 0
      })
  }

  return (
    <div className="track-root">

      <section className="today-goals">
        <h3>Today's nutrition goals</h3>
        <div className="macros-row">
          <div className="macro protein" onClick={() => setMacroModal('protein')} role="button" tabIndex={0}>
            <div className="ring" style={{ ['--pct' as any]: 1 }}>
              <div className="ring-inner">
                <div className="value">140g</div>
              </div>
            </div>
            <div className="sub">of 140g</div>
            <div className="label">Protein</div>
          </div>

          <div className="macro carbs" onClick={() => setMacroModal('carbs')} role="button" tabIndex={0}>
            <div className="ring" style={{ ['--pct' as any]: 0.7 }}>
              <div className="ring-inner">
                <div className="value">140g</div>
              </div>
            </div>
            <div className="sub">of 200g</div>
            <div className="label">Carbohydrates</div>
          </div>

          <div className="macro fats" onClick={() => setMacroModal('fats')} role="button" tabIndex={0}>
            <div className="ring" style={{ ['--pct' as any]: 0.75 }}>
              <div className="ring-inner">
                <div className="value">30g</div>
              </div>
            </div>
            <div className="sub">of 40g</div>
            <div className="label">Fats</div>
          </div>
          <div className="macro fiber" onClick={() => setMacroModal('fiber')} role="button" tabIndex={0}>
            <div className="ring" style={{ ['--pct' as any]: 0.6 }}>
              <div className="ring-inner">
                <div className="value">18g</div>
              </div>
            </div>
            <div className="sub">of 30g</div>
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
                const cal = parsed?.calories ?? '—'
                const protein = parsed?.protein_g ?? parsed?.protein ?? '—'
                const carbs = parsed?.carbs_g ?? parsed?.carbs ?? '—'
                const fats = parsed?.fat_g ?? parsed?.fats_g ?? parsed?.fats ?? '—'
                const fiber = parsed?.fiber_g ?? parsed?.fiber ?? '—'
                return (
                  <>
                    <div className="meta-item calories">Calories: {cal}</div>
                    <div className="meta-item protein">Protein: {protein === '—' ? '—' : protein + ' g'}</div>
                    <div className="meta-item carbs">Carbs: {carbs === '—' ? '—' : carbs + ' g'}</div>
                    <div className="meta-item fats">Fats: {fats === '—' ? '—' : fats + ' g'}</div>
                    <div className="meta-item fiber">Fiber: {fiber === '—' ? '—' : fiber + ' g'}</div>
                  </>
                )
              })()}
            </div>
            {/* log-summary removed per UI update */}
          </div>
        </div>
      )}

      {macroModal && (
        <div className="log-modal-backdrop" onClick={() => setMacroModal(null)}>
          <div className={`log-modal ${'macro-' + macroModal}`} onClick={(e) => e.stopPropagation()}>
            <button className="close" onClick={() => setMacroModal(null)} aria-label="Close">✕</button>
            <h4>Logs — {macroModal}</h4>
            <div className={`log-list ${macroModal ? 'macro-' + macroModal : ''}`}>
              {(() => {
                const rows = filteredForMacro(macroModal)
                if (!rows || rows.length === 0) return <div className="empty">No logs for today</div>

                const macrosAsList = ['protein', 'carbs', 'fats', 'fiber']
                if (macrosAsList.includes(macroModal)) {
                  const displayLabel = macroModal.charAt(0).toUpperCase() + macroModal.slice(1)
                  const key = macroKeyFor(macroModal)
                  return (
                    <ul className={`log-list-plain ${'macro-' + macroModal}`}>
                      {rows.map((r: any) => {
                        const val = r.parsed ? (key === 'fat_g' ? (r.parsed.fat_g ?? r.parsed.fats_g ?? '—') : (r.parsed[key] ?? '—')) : '—'
                        return (
                          <li key={r.id} className="log-list-item">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div className="log-title">{r.title}</div>
                              <div className="log-ts">{new Date(r.timestamp).toLocaleTimeString()}</div>
                            </div>
                            <div className="log-expanded">
                              <div className="log-sub">{displayLabel}: {val}{typeof val === 'number' ? ' g' : ''}</div>
                              <div className="log-sub">Calories: {r.parsed ? (r.parsed.calories ?? '—') : '—'}</div>
                              <div className="log-sub">Carbs: {r.parsed ? (r.parsed.carbs_g ?? '—') : '—'} g</div>
                              {r.parsed && r.parsed.fiber_g !== undefined && <div className="log-sub">Fiber: {r.parsed.fiber_g} g</div>}
                            </div>
                            {/* per-item summary removed */}
                          </li>
                        )
                      })}
                    </ul>
                  )
                }

                return rows.map((r: any) => (
                  <div key={r.id} className="log-card">
                    <div className="log-title">{r.title}</div>
                    <div className="log-ts">{new Date(r.timestamp).toLocaleTimeString()}</div>
                    <div className="log-sub">{r.parsed ? (r.parsed[macroKeyFor(macroModal)] ?? r.parsed.fats_g ?? '') : ''}</div>
                  </div>
                ))
              })()}
            </div>
          </div>
        </div>
      )}

      <section className="daily-logs">
        <h3>Today's logs</h3>
        <div className="logs-row">
          {items.filter((it) => it.type === 'milestone').length === 0 && <div className="empty">No logs yet</div>}
          {items
            .filter((it) => it.type === 'milestone')
            .map((it) => (
              <button key={it.id} className="log-card" onClick={() => setSelectedLog(it)}>
                  <div className="log-title">{it.title}</div>
                  <div className="log-ts">{new Date(it.timestamp).toLocaleTimeString()}</div>
                </button>
            ))}
        </div>
      </section>

      <section className="weekly-logs">
        <h3>Weekly logs</h3>
        <div className="logs-row">
          {weeklyItems.length === 0 && <div className="empty">No weekly logs</div>}
          {weeklyItems.map((it: any) => (
            <button key={it.id} className="log-card" onClick={() => setSelectedLog(it)}>
              <div className="log-title">{it.title}</div>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

