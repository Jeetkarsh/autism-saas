'use client'

import { useRef } from 'react'
import FileUploadCard from '../../components/admin/FileUploadCard'
import UrlIngestCard from '../../components/admin/UrlIngestCard'
import DocumentList from '../../components/admin/DocumentList'
import DeleteConfirmModal from '../../components/admin/DeleteConfirmModal'
import Breadcrumbs from '../../components/Breadcrumbs'
import { useIngestion } from './hooks/useIngestion'
import { useDragAndDrop } from './hooks/useDragAndDrop'
import './admin.css'

export default function KnowledgeAdmin() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const {
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
  } = useIngestion()

  const { dragActive, handleDrag, handleDrop } = useDragAndDrop(handleFileUpload)

  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-primary/10 to-transparent -z-10 pointer-events-none" />
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-secondary/20 rounded-full blur-3xl -z-10 pointer-events-none" />
      
      <div className="ka-container relative z-10">
        {/* Breadcrumbs */}
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Knowledge Admin' }]} />

        {/* Delete Confirmation Modal */}
        {deleteTarget && (
          <DeleteConfirmModal
            docName={deleteTarget.name}
            onConfirm={handleDeleteConfirm}
            onCancel={() => setDeleteTarget(null)}
          />
        )}

        {/* Toast */}
        {toast && (
          <div className={`ka-toast ${toast.type === 'error' ? 'bg-red-500' : 'bg-success'}`}>
            <span className="toast-icon">
              {toast.type === 'error' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              )}
            </span>
            {toast.message.replace(/^[✅❌]\s*/, '')}
          </div>
        )}

        {/* Page Header */}
        <div className="ka-header-wrapper">
          <div className="ka-header-text">
            <h1 className="ka-title font-heading">
              <span className="text-gradient">Knowledge Base</span> Admin
            </h1>
            <p className="ka-subtitle">Supercharge your AI assistant with custom contextual data.</p>
          </div>
          
          <div className={`status-pill ${serviceStatus === 'online' ? 'status-online' : 'status-offline'}`}>
            <div className="status-indicator">
              <div className="status-core" />
              {serviceStatus === 'online' && <div className="status-ping" />}
            </div>
            <span className="font-medium text-sm">
              {serviceStatus === 'online' ? 'Engine Online' : serviceStatus === 'offline' ? 'Engine Offline' : 'Connecting...'}
            </span>
          </div>
        </div>

        <div className="grid-layout">
          {/* LEFT COLUMN: Input Actions */}
          <div className="action-column">
            <FileUploadCard 
              dragActive={dragActive}
              isUploading={isUploading}
              fileInputRef={fileInputRef}
              handleDrag={handleDrag}
              handleDrop={handleDrop}
              handleFileUpload={handleFileUpload}
            />
            <UrlIngestCard
              urlInput={urlInput}
              setUrlInput={setUrlInput}
              isIngesting={isIngesting}
              handleURLIngest={handleURLIngest}
            />
          </div>

          {/* RIGHT COLUMN: Documents List */}
          <div className="list-column">
            <DocumentList
              documents={documents}
              isLoading={isLoading}
              fetchDocuments={fetchDocuments}
              handleDelete={handleDeleteRequest}
            />
          </div>
        </div>
      </div>
    </main>
  )
}
