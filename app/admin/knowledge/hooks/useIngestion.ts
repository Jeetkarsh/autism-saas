import { useState, useEffect } from 'react'
import type { KnowledgeDocument } from '../../../../lib/types/database'

export function useIngestion() {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [isIngesting, setIsIngesting] = useState<boolean>(false)
  const [urlInput, setUrlInput] = useState<string>('')
  const [toast, setToast] = useState<{message: string, type: string} | null>(null)
  const [serviceStatus, setServiceStatus] = useState<'online'|'offline'|null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{id: string, name: string} | null>(null)

  const showToast = (message: string, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const checkHealth = async () => {
    try {
      const res = await fetch('/api/kb/health')
      const data = await res.json()
      setServiceStatus(data.status === 'ok' ? 'online' : 'offline')
    } catch {
      setServiceStatus('offline')
    }
  }

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/kb/documents')
      const data = await res.json()
      setDocuments(data.documents || [])
    } catch {
      // Service might be offline
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkHealth()
    fetchDocuments()
  }, [])

  const handleFileUpload = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return
    setIsUploading(true)

    const fileArray = Array.from(files)
    for (const file of fileArray) {
      try {
        const formData = new FormData()
        formData.append('file', file)

        const res = await fetch('/api/kb/ingest/file', {
          method: 'POST',
          body: formData,
        })

        const data = await res.json()

        if (res.ok) {
          showToast(`✅ ${data.message}`)
        } else {
          showToast(`❌ ${data.error || 'Upload failed'}`, 'error')
        }
      } catch {
        showToast(`❌ Failed to upload ${file.name}`, 'error')
      }
    }

    setIsUploading(false)
    fetchDocuments()
  }

  const handleURLIngest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!urlInput.trim()) return
    setIsIngesting(true)

    try {
      const res = await fetch('/api/kb/ingest/url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput }),
      })

      const data = await res.json()

      if (res.ok) {
        showToast(`✅ ${data.message}`)
        setUrlInput('')
        fetchDocuments()
      } else {
        showToast(`❌ ${data.error || 'URL ingestion failed'}`, 'error')
      }
    } catch {
      showToast('❌ Failed to connect to knowledge service', 'error')
    } finally {
      setIsIngesting(false)
    }
  }

  const handleDeleteRequest = (docId: string, docName: string) => {
    setDeleteTarget({ id: docId, name: docName })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    const { id: docId, name: docName } = deleteTarget
    setDeleteTarget(null)

    try {
      const res = await fetch(`/api/kb/documents?id=${docId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        showToast(`🗑️ Deleted "${docName}"`)
        fetchDocuments()
      } else {
        showToast('❌ Failed to delete document', 'error')
      }
    } catch {
      showToast('❌ Failed to connect to knowledge service', 'error')
    }
  }

  return {
    documents,
    isLoading,
    isUploading,
    isIngesting,
    urlInput,
    setUrlInput,
    toast,
    serviceStatus,
    deleteTarget,
    setDeleteTarget,
    handleFileUpload,
    handleURLIngest,
    handleDeleteRequest,
    handleDeleteConfirm,
    fetchDocuments,
  }
}
