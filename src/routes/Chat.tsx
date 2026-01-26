import React, { useEffect, useState, useRef } from 'react'
import logoUrl from '../assets/logo-short.svg'
import { MdPhotoCamera, MdSend, MdPerson } from 'react-icons/md'
import { useDispatch, useSelector } from 'react-redux'
import { v4 as uuid } from 'uuid'
import { RootState } from '../store'
import { addMessage, setMessages, Message } from '../store/slices/chatSlice'
import { setItems, addItemAndPersist } from '../store/slices/trackSlice'
import mockApi from '../api/mockApi'

export default function Chat() {
  const dispatch = useDispatch()
  const messages = useSelector((s: RootState) => s.chat.messages)
  const [text, setText] = useState('')
  const listRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  // quick reply examples shown like the design
  const quickReplies = [
    'Check the protein in my meal',
    'I have ingredients, help me plan a meal'
  ]

  useEffect(() => {
    mockApi.loadInitialData().then((res) => {
      dispatch(setMessages(res.chat))
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

    // bot reply (simple, safe, empathetic)
    const bot: Message = {
      id: uuid(),
      from: 'bot',
      text: `Thanks — I logged that. To hit your protein goal, aim for 20–30g protein per meal. Want tips?`,
      timestamp: Date.now()
    }
    dispatch(addMessage(bot))

    // persist to mock
    const updated = [...messages, msg, bot]
    mockApi.persistChat(updated)
    // scroll
    setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }), 50)
    // no-op for track here (we persist when items are added)
  }

  async function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const analysis = await mockApi.analyzeImage(file)
    const bot: Message = {
      id: uuid(),
      from: 'bot',
      text: `I analyzed the photo: ~${analysis.calories} kcal, ${analysis.protein_g}g protein, ${analysis.carbs_g}g carbs. ${analysis.summary}`,
      timestamp: Date.now(),
      meta: analysis
    }
    dispatch(addMessage(bot))
    // add to track as milestone and persist
    dispatch(
      // use thunk to persist after adding
      addItemAndPersist({
        id: uuid(),
        type: 'milestone',
        title: 'Meal logged via photo',
        details: JSON.stringify(analysis),
        timestamp: Date.now()
      } as any)
    )
    mockApi.persistChat([...messages, bot])
    setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }), 50)
  }

  function handleInputKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="chat-root">
      <div className="messages" ref={listRef}>
        {messages.map((m) => (
          <div key={m.id} className={`message ${m.from}`}>
            <div className="avatar" aria-hidden>
              {m.from === 'bot' ? <img src={logoUrl} alt="logo" className="logo-img" /> : <MdPerson className="user-icon" />}
            </div>
            <div className="bubble-wrap">
              <div className="bubble">{m.text}</div>
              {m.meta && typeof m.meta === 'object' && m.meta.summary && (
                <div className="image-preview">
                  {/* If we had a real image, we'd show it; for analysis, show nothing */}
                </div>
              )}
              {m.meta && <div className="meta">{typeof m.meta === 'string' ? m.meta : JSON.stringify(m.meta)}</div>}
            </div>
          </div>
        ))}

        {/* Quick replies placed after messages (approx) */}
        <div className="quick-chips">
          {quickReplies.map((q) => (
            <button
              key={q}
              className="chip"
              onClick={() => {
                setText(q)
                setTimeout(() => {
                  inputRef.current?.focus()
                  const len = q.length
                  try {
                    inputRef.current?.setSelectionRange(len, len)
                  } catch (e) {}
                }, 0)
              }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <div className="composer">
        <input ref={inputRef} className="composer-input" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={handleInputKey} placeholder="Type a message" />
        <label className="icon-button" title="Attach photo">
          <input type="file" accept="image/*" onChange={handleImage} style={{ display: 'none' }} />
          <MdPhotoCamera size={22} color="#5b4fc6" />
        </label>
        <button className="send" onClick={handleSend} aria-label="Send">
          <MdSend size={22} color="#5b4fc6" />
        </button>
      </div>
    </div>
  )
}
