'use client'

import { useState, useRef, useEffect } from 'react'
import type { FormEvent } from 'react'

const SUGGESTED_PROMPTS = [
  'What therapies help with speech delays?',
  'How to handle sensory overload?',
  'Tips for IEP meetings',
  'Daily routine ideas for my child',
]

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi! 👋 I\'m the AutismConnect assistant. Ask me anything about autism support, therapy approaches, or resources. I\'ll answer based on our knowledge base.',
      sources: [],
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const sendMessage = async (e: FormEvent | null, promptText?: string | null) => {
    if (e) e.preventDefault()
    const messageText = promptText || input.trim()
    if (!messageText || isLoading) return

    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: messageText, sources: [] }])
    setIsLoading(true)

    try {
      const res = await fetch('/api/kb/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: messageText }),
      })

      const data = await res.json()

      if (res.ok) {
        const sources = data.sources && data.sources.length > 0
          ? data.sources.map(s => s.doc_name)
          : []

        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.answer,
          sources,
        }])
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'I\'m sorry, I couldn\'t process your question right now. The knowledge service may be temporarily unavailable — please try again in a moment.',
          sources: [],
        }])
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I\'m having trouble connecting to the knowledge service. Please check that it\'s running and try again.',
        sources: [],
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handlePromptClick = (prompt) => {
    sendMessage(null, prompt)
  }

  const showSuggestions = messages.length === 1 && !isLoading

  return (
    <>
      {/* Chat Panel */}
      <div className={`cb-panel ${isOpen ? 'cb-panel-open' : ''}`}>
        {/* Header */}
        <div className="cb-header">
          <div className="cb-header-info">
            <div className="cb-avatar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div>
              <span className="cb-header-title">Knowledge Assistant</span>
              <span className="cb-header-sub">Powered by AI</span>
            </div>
          </div>
          <button className="cb-close" onClick={() => setIsOpen(false)} aria-label="Close chat">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="cb-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`cb-msg ${msg.role === 'user' ? 'cb-msg-user' : 'cb-msg-assistant'}`}>
              <div className="cb-msg-bubble">
                {msg.content.split('\n').map((line, j) => (
                  <span key={j}>
                    {line}
                    {j < msg.content.split('\n').length - 1 && <br />}
                  </span>
                ))}
                {/* Source citation badges */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="cb-sources">
                    <span className="cb-sources-label">📚 Based on:</span>
                    {msg.sources.map((src, k) => (
                      <span key={k} className="cb-source-badge">{src}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Suggested prompts */}
          {showSuggestions && (
            <div className="cb-suggestions">
              <span className="cb-suggestions-label">Try asking:</span>
              {SUGGESTED_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  className="cb-suggestion-chip"
                  onClick={() => handlePromptClick(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Thinking indicator */}
          {isLoading && (
            <div className="cb-msg cb-msg-assistant">
              <div className="cb-msg-bubble cb-typing">
                <span className="cb-dot"></span>
                <span className="cb-dot"></span>
                <span className="cb-dot"></span>
                <span className="cb-thinking-text">Searching knowledge base…</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="cb-input-area">
          <input
            ref={inputRef}
            type="text"
            placeholder="Ask a question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="cb-input"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="cb-send"
            disabled={!input.trim() || isLoading}
            aria-label="Send message"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </form>
      </div>

      {/* Floating Bubble */}
      <button
        className={`cb-bubble ${isOpen ? 'cb-bubble-hidden' : ''}`}
        onClick={() => setIsOpen(true)}
        aria-label="Open chat assistant"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <span className="cb-bubble-badge">?</span>
      </button>

      <style jsx>{`
        /* Bubble */
        .cb-bubble {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary) 0%, #5a7d60 100%);
          color: white;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px rgba(107, 143, 113, 0.4);
          transition: all 0.3s ease;
          z-index: 1000;
        }

        .cb-bubble:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 28px rgba(107, 143, 113, 0.5);
        }

        .cb-bubble-hidden {
          transform: scale(0);
          opacity: 0;
          pointer-events: none;
        }

        .cb-bubble-badge {
          position: absolute;
          top: -2px;
          right: -2px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--secondary);
          color: white;
          font-size: 11px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Panel */
        .cb-panel {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 380px;
          max-height: 560px;
          border-radius: 16px;
          background: var(--surface);
          box-shadow: 0 8px 40px rgba(0, 0, 0, 0.15);
          display: flex;
          flex-direction: column;
          z-index: 1001;
          transform: scale(0.8) translateY(20px);
          opacity: 0;
          pointer-events: none;
          transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
          transform-origin: bottom right;
          overflow: hidden;
        }

        .cb-panel-open {
          transform: scale(1) translateY(0);
          opacity: 1;
          pointer-events: auto;
        }

        /* Header */
        .cb-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background: linear-gradient(135deg, var(--primary) 0%, #5a7d60 100%);
          color: white;
        }

        .cb-header-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .cb-avatar {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .cb-header-title {
          display: block;
          font-weight: 700;
          font-size: 15px;
        }

        .cb-header-sub {
          display: block;
          font-size: 11px;
          opacity: 0.8;
        }

        .cb-close {
          background: rgba(255, 255, 255, 0.15);
          border: none;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s;
        }

        .cb-close:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        /* Messages */
        .cb-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 380px;
          min-height: 200px;
        }

        .cb-msg {
          display: flex;
        }

        .cb-msg-user {
          justify-content: flex-end;
        }

        .cb-msg-bubble {
          max-width: 85%;
          padding: 10px 14px;
          border-radius: 14px;
          font-size: 16px;
          line-height: 1.5;
          word-wrap: break-word;
        }

        .cb-msg-assistant .cb-msg-bubble {
          background: var(--background);
          color: var(--text-primary);
          border-bottom-left-radius: 4px;
        }

        .cb-msg-user .cb-msg-bubble {
          background: var(--primary);
          color: white;
          border-bottom-right-radius: 4px;
        }

        /* Source citation badges */
        .cb-sources {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid var(--border);
          align-items: center;
        }

        .cb-sources-label {
          font-size: 12px;
          color: var(--text-muted);
          font-weight: 600;
          margin-right: 2px;
        }

        .cb-source-badge {
          display: inline-flex;
          align-items: center;
          font-size: 11px;
          font-weight: 600;
          padding: 3px 10px;
          border-radius: 12px;
          background: rgba(107, 143, 113, 0.12);
          color: var(--primary-dark);
          white-space: nowrap;
          max-width: 180px;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Suggested prompts */
        .cb-suggestions {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 4px 0;
        }

        .cb-suggestions-label {
          font-size: 13px;
          color: var(--text-muted);
          font-weight: 600;
        }

        .cb-suggestion-chip {
          display: block;
          width: 100%;
          text-align: left;
          padding: 10px 14px;
          border: 1.5px solid var(--border);
          border-radius: 10px;
          background: var(--surface);
          color: var(--text-primary);
          font-size: 14px;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
        }

        .cb-suggestion-chip:hover {
          border-color: var(--primary);
          background: rgba(107, 143, 113, 0.06);
        }

        /* Typing indicator */
        .cb-typing {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 14px 18px;
        }

        .cb-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--text-muted);
          animation: typingBounce 1.4s infinite ease-in-out;
        }

        .cb-dot:nth-child(1) { animation-delay: 0s; }
        .cb-dot:nth-child(2) { animation-delay: 0.2s; }
        .cb-dot:nth-child(3) { animation-delay: 0.4s; }

        .cb-thinking-text {
          font-size: 13px;
          color: var(--text-muted);
          margin-left: 8px;
          font-style: italic;
        }

        @keyframes typingBounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }

        /* Input */
        .cb-input-area {
          display: flex;
          gap: 8px;
          padding: 12px 16px;
          border-top: 1px solid var(--border);
          background: var(--surface);
        }

        .cb-input {
          flex: 1;
          padding: 10px 14px;
          font-size: 16px;
          border: 2px solid var(--border);
          border-radius: 10px;
          background: var(--background);
          color: var(--text-primary);
          transition: border-color 0.15s;
        }

        .cb-input:focus {
          outline: none;
          border-color: var(--primary);
        }

        .cb-send {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          background: var(--primary);
          color: white;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
          flex-shrink: 0;
        }

        .cb-send:hover:not(:disabled) {
          background: var(--primary-dark);
        }

        .cb-send:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        /* Mobile */
        @media (max-width: 480px) {
          .cb-panel {
            bottom: 0;
            right: 0;
            width: 100%;
            max-height: 100vh;
            border-radius: 16px 16px 0 0;
            transform-origin: bottom center;
          }

          .cb-bubble {
            bottom: 16px;
            right: 16px;
          }
        }
      `}</style>
    </>
  )
}
