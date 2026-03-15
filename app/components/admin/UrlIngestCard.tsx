import { useState } from 'react'
import { z } from 'zod'

const urlSchema = z.string().url('Please enter a valid URL starting with https://')

type UrlIngestCardProps = {
  urlInput: string;
  setUrlInput: (url: string) => void;
  isIngesting: boolean;
  handleURLIngest: (e: React.FormEvent) => void;
};

export default function UrlIngestCard({
  urlInput,
  setUrlInput,
  isIngesting,
  handleURLIngest
}: UrlIngestCardProps) {
  const [urlError, setUrlError] = useState('')
  const [urlTouched, setUrlTouched] = useState(false)

  const validateUrl = (value: string) => {
    if (!value.trim()) return ''
    const result = urlSchema.safeParse(value)
    return result.success ? '' : result.error.issues[0].message
  }

  const handleChange = (value: string) => {
    setUrlInput(value)
    if (urlTouched) setUrlError(validateUrl(value))
  }

  const handleBlur = () => {
    setUrlTouched(true)
    if (urlInput.trim()) setUrlError(validateUrl(urlInput))
  }

  const handleSubmit = (e: React.FormEvent) => {
    setUrlTouched(true)
    const err = validateUrl(urlInput)
    setUrlError(err)
    if (err) {
      e.preventDefault()
      return
    }
    handleURLIngest(e)
  }

  return (
    <div className="glass-card url-card">
      <div className="card-header">
        <div className="icon-wrapper bg-secondary/10 text-secondary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        </div>
        <div>
          <h2 className="card-title font-heading text-lg">Web Scraper API</h2>
          <p className="card-subtitle text-xs">Instantly ingest any article URL</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="url-form">
        <div className="input-with-icon">
          <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          <input
            type="url"
            placeholder="https://example.com/guide..."
            value={urlInput}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            className={`smart-input ${urlError ? 'smart-input-error' : ''}`}
            disabled={isIngesting}
            required
          />
        </div>
        {urlError && <p className="url-error">{urlError}</p>}
        
        <button
          type="submit"
          className="btn smart-submit-btn"
          disabled={isIngesting || !urlInput.trim()}
        >
          {isIngesting ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Ingesting...
            </span>
          ) : (
            'Index URL'
          )}
        </button>
      </form>

      <style jsx>{`
        .smart-input-error {
          border-color: var(--error) !important;
        }
        .smart-input-error:focus {
          box-shadow: 0 0 0 4px rgba(212, 114, 114, 0.1) !important;
        }
        .url-error {
          font-size: 13px;
          color: var(--error);
          margin-top: -8px;
        }
      `}</style>
    </div>
  );
}
