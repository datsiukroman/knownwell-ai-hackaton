import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../store'
import { useGetClinicianPatientsQuery, useGetAllPatientsQuery, useAssignPatientMutation, useUnassignPatientMutation } from '../store/api/patientsApi'
import { MdPersonAdd, MdPersonRemove } from 'react-icons/md'

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

  const clinicianId = auth?.clinicianId ?? null
  const myPatients = myPatientsResp || []

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
                      <button className="icon-button" title="Unassign patient" disabled={pendingId === String(p.id)} onClick={async () => {
                        try { setPendingId(String(p.id)); await unassignPatient(String(p.id)).unwrap() } catch {} finally { setPendingId(null) }
                      }}>
                        <MdPersonRemove size={18} color="#ff6b6b" />
                      </button>
                    ) : (
                      <button className="icon-button" title="Assign patient" disabled={pendingId === String(p.id)} onClick={async () => {
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
                <li key={p.id}>
                  <div style={{ display: 'flex', minWidth: 0, gap: 12, alignItems: 'center' }}>
                    <div className="patient-name">{p.name}</div>
                    <div className="patient-meta">{p.email} · {p.age}y · {p.weight}kg · {p.height}cm</div>
                  </div>
                  <div>
                    <button className="icon-button" title="Unassign patient" disabled={pendingId === String(p.id)} onClick={async () => {
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
    </div>
  )
}
