import React, { useEffect, useState, useRef } from 'react'
import logoUrl from '../assets/logo-short.svg'
import { MdPhotoCamera, MdSend, MdPerson } from 'react-icons/md'
import { useDispatch, useSelector } from 'react-redux'
import { v4 as uuid } from 'uuid'
import { RootState } from '../store'
import { addMessage, setMessages, updateMessage, Message } from '../store/slices/chatSlice'
import { setItems, addItemAndPersist } from '../store/slices/trackSlice'
import mockApi from '../api/mockApi'
import { usePostChatMutation, useGetHistoryQuery } from '../store/api/chatApi'
import { useCreateLogMutation } from '../store/api/logsApi'

export default function Chat() {
  const dispatch = useDispatch()
  const messages = useSelector((s: RootState) => s.chat.messages)
  const [text, setText] = useState('')
  const listRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const welcomeRef = useRef<any | null>(null)
  const [postChat, { isLoading }] = usePostChatMutation()
  const [createLog] = useCreateLogMutation()
  const auth = useSelector((s: RootState) => s.auth)
  const { data: historyItems, isLoading: historyLoading } = useGetHistoryQuery(auth?.patientId || '', { skip: !auth?.patientId })

  // quick replies removed
  const quickReplies: string[] = []

  useEffect(() => {
    mockApi.loadInitialData().then((res) => {
      // remember initial welcome message (first message) so we can keep it at top
      if (res.chat && res.chat.length > 0) welcomeRef.current = res.chat[0]
      // seed track as well
      const storeTrack = res.track
      dispatch(setItems(storeTrack))
    })
  }, [dispatch])

  useEffect(() => {
    document.body.classList.add('chat-page')
    return () => document.body.classList.remove('chat-page')
  }, [])

  async function handleSend() {
    if (!text.trim()) return
    const msg: Message = { id: uuid(), from: 'user', text: text.trim(), timestamp: Date.now() }
    dispatch(addMessage(msg))
    setText('')

    // show typing indicator (message without text)
    const typingId = uuid()
    dispatch(addMessage({ id: typingId, from: 'bot', timestamp: Date.now() }))

    // send to server
    try {
      const res: any = await postChat({ message: msg.text }).unwrap()
      const norm = normalizeMeta(res?.meta)
      const botText = res?.response ?? 'No response from server'
      dispatch(updateMessage({ id: typingId, changes: { text: botText, meta: norm } }))
      const updated = [...messages, msg, { id: typingId, from: 'bot', text: botText, timestamp: Date.now(), meta: norm }]
      mockApi.persistChat(updated)
      if (norm) {
        dispatch(addItemAndPersist({ id: uuid(), type: 'milestone', title: 'Analysis from chat', details: JSON.stringify(norm), timestamp: Date.now() } as any))
        if (auth?.patientId) {
          createLog({
            patientId: auth.patientId,
            description: 'Analysis from chat',
            details: JSON.stringify(norm),
            proteinGrams: norm.proteinGrams ?? null,
            carbGrams: norm.carbGrams ?? null,
            fiberGrams: norm.fiberGrams ?? null,
            logTime: new Date().toISOString(),
            summary: false,
          }).catch(() => {})
        }
      }
    } catch (err) {
      // fallback to local mock behavior when API fails
      const errMsg = 'Unable to reach server'
      dispatch(updateMessage({ id: typingId, changes: { text: errMsg, meta: undefined } }))
      const updated = [...messages, msg, { id: typingId, from: 'bot', text: errMsg, timestamp: Date.now() }]
      mockApi.persistChat(updated)
    }
    // scroll
    setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }), 50)
  }

  async function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    // convert file to dataURL for preview and for upload
    const toBase64 = (f: File) => new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = reject
      reader.readAsDataURL(f)
    })

    const dataUrl = await toBase64(file)

    // add a user message showing only the preview (hide the prompt text in chat)
    const userMsg: Message = { id: uuid(), from: 'user', text: '', timestamp: Date.now(), meta: { imagePreview: dataUrl } as any }
    dispatch(addMessage(userMsg))

    // placeholder typing indicator for bot
    const typingId = uuid()
    dispatch(addMessage({ id: typingId, from: 'bot', timestamp: Date.now() }))

    

    try {
      // dataUrl is like "data:<mime>;base64,<data>" — strip prefix
      const parts = dataUrl.split(',')
      const base64 = parts[1]
      const mime = parts[0].split(':')[1].split(';')[0]
      const res: any = await postChat({ message: 'Analyze my meal and adjust goals', imageData: base64, imageMimeType: mime }).unwrap()
      const norm = normalizeMeta(res?.meta)
      const botText = res?.response ?? `I analyzed the photo.`

      // replace typing placeholder with actual response and normalized meta
      dispatch(updateMessage({ id: typingId, changes: { text: botText, meta: norm } }))

      // add to track as milestone if server provided analysis and create server log
      if (norm) {
        dispatch(addItemAndPersist({ id: uuid(), type: 'milestone', title: 'Meal logged via photo', details: JSON.stringify(norm), timestamp: Date.now() } as any))
        if (auth?.patientId) {
          createLog({
            patientId: auth.patientId,
            description: 'Meal logged via photo',
            details: JSON.stringify(norm),
            proteinGrams: norm.proteinGrams ?? null,
            carbGrams: norm.carbGrams ?? null,
            fiberGrams: norm.fiberGrams ?? null,
            logTime: new Date().toISOString(),
            summary: false,
          }).catch(() => {})
        }
      }

      mockApi.persistChat([...messages, userMsg, { id: typingId, from: 'bot', text: botText, timestamp: Date.now(), meta: norm }])
      setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }), 50)
    } catch (err) {
      // fallback to mock analysis
      const analysis = await mockApi.analyzeImage(file)
      const norm = normalizeMeta(analysis)
      const botText = `I analyzed the photo: ~${norm.calories} kcal, ${norm.proteinGrams}g protein, ${norm.carbGrams}g carbs. ${norm.summary}`

      // replace typing placeholder with mock response (normalized)
      dispatch(updateMessage({ id: typingId, changes: { text: botText, meta: norm } }))

      dispatch(addItemAndPersist({ id: uuid(), type: 'milestone', title: 'Meal logged via photo', details: JSON.stringify(norm), timestamp: Date.now() } as any))
      if (auth?.patientId) {
        createLog({
          patientId: auth.patientId,
          description: 'Meal logged via photo',
          details: JSON.stringify(norm),
          proteinGrams: norm.proteinGrams ?? null,
          carbGrams: norm.carbGrams ?? null,
          fiberGrams: norm.fiberGrams ?? null,
          logTime: new Date().toISOString(),
          summary: false,
        }).catch(() => {})
      }
      mockApi.persistChat([...messages, userMsg, { id: typingId, from: 'bot', text: botText, timestamp: Date.now(), meta: norm }])
      setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }), 50)
    }
  }

  function handleInputKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }
  const normalizeMeta = (m: any) => {
    if (!m) return m
    return {
      calories: m.calories ?? m.calorie ?? null,
      proteinGrams: m.proteinGrams ?? m.protein_g ?? m.protein ?? null,
      carbGrams: m.carbGrams ?? m.carbs_g ?? m.carb ?? null,
      fiberGrams: m.fiberGrams ?? m.fiber_g ?? m.fiber ?? null,
      summary: m.summary ?? null,
      ...m,
    }
  }
  useEffect(() => {
    if (!historyItems || historyItems.length === 0) {
      // if no history but we have a welcome message from mocks, show it
      if (welcomeRef.current) {
        dispatch(setMessages([welcomeRef.current]))
        setTimeout(() => inputRef.current?.focus(), 50)
      }
      return
    }
    const mapped = historyItems
      .map((entry: any) => {
        const from = String(entry.role || '').toLowerCase() === 'patient' || String(entry.role || '').toLowerCase() === 'user' ? 'user' : 'bot'
        // if API provides imageData in history, construct a preview data URL
        let meta: any = entry.meta ?? undefined
        if (entry.imageData) {
          const raw = String(entry.imageData || '')
          let dataUrl = raw
          if (!raw.startsWith('data:')) {
            const mime = entry.imageMimeType || entry.imageMime || 'image/jpeg'
            dataUrl = `data:${mime};base64,${raw}`
          }
          meta = { ...(entry.meta || {}), imagePreview: dataUrl }
        }

        return {
          id: String(entry.id ?? uuid()),
          from,
          text: entry.content ?? entry.message ?? '',
          timestamp: entry.timestamp ? new Date(entry.timestamp).getTime() : Date.now(),
          meta,
        }
      })
      .sort((a: any, b: any) => a.timestamp - b.timestamp)
    // keep welcome message at top if we have one
    const combined = welcomeRef.current ? [welcomeRef.current, ...mapped.filter((m: any) => m.id !== String(welcomeRef.current.id))] : mapped
    dispatch(setMessages(combined))
    // focus input and scroll to last message
    setTimeout(() => {
      inputRef.current?.focus()
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
    }, 50)
  }, [historyItems, dispatch])

  return (
    <div className="chat-root">
      <div className="messages" ref={listRef}>
        {messages.map((m) => (
          <div key={m.id} className={`message ${m.from} ${m.from === 'user' && m.meta && m.meta.imagePreview ? 'image-only' : ''}`}>
            <div className="avatar" aria-hidden>
              {m.from === 'bot' ? <img src={logoUrl} alt="logo" className="logo-img" /> : <MdPerson className="user-icon" />}
            </div>
            <div className="bubble-wrap">
              {m.from === 'user' && m.meta && m.meta.imagePreview ? (
                <div className="image-preview">
                  <img src={m.meta.imagePreview} alt="preview" />
                  <div className="bubble-ts">{m.timestamp ? new Date(m.timestamp).toLocaleString() : ''}</div>
                </div>
              ) : (
                <div className="bubble">
                  {m.text == null ? (
                    <span className="typing-dots" aria-hidden>
                      <span></span>
                      <span></span>
                      <span></span>
                    </span>
                  ) : (
                    m.text
                  )}
                  <div className="bubble-ts">{m.timestamp ? new Date(m.timestamp).toLocaleString() : ''}</div>
                </div>
              )}

              {m.meta && typeof m.meta === 'object' && m.meta.summary && (
                <div className="meta">{m.meta.summary}</div>
              )}
            </div>
          </div>
        ))}

        {/* Quick replies removed */}
      </div>

      <div className="composer">
        <input ref={inputRef} className="composer-input" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={handleInputKey} placeholder={isLoading ? 'Waiting for reply...' : 'Type a message'} disabled={isLoading} />
        <label className="icon-button" title="Attach photo">
          <input type="file" accept="image/*" onChange={handleImage} style={{ display: 'none' }} />
          <MdPhotoCamera size={22} color="#5b4fc6" />
        </label>
        <button className="send" onClick={handleSend} aria-label="Send" disabled={isLoading}>
          <MdSend size={22} color="#5b4fc6" />
        </button>
      </div>
    </div>
  )
}
