import { KnowledgeDocument } from '../../../lib/types/database'

type DocumentListProps = {
  documents: KnowledgeDocument[];
  isLoading: boolean;
  fetchDocuments: () => void;
  handleDelete: (id: string, name: string) => void;
};

export default function DocumentList({
  documents,
  isLoading,
  fetchDocuments,
  handleDelete
}: DocumentListProps) {

  const getTypeIcon = (type: string) => {
    switch (type) {
      case '.pdf': return '📄'
      case '.txt': return '📝'
      case '.md': case '.markdown': return '📋'
      case 'url': return '🌐'
      default: return '📁'
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="glass-card h-full flex flex-col">
      <div className="card-header pb-4 border-b border-border/50 flex justify-between items-center bg-surface/50 sticky top-0 z-10 rounded-t-xl px-6 pt-6 -mx-6 -mt-6">
        <div className="flex items-center gap-3">
          <div className="icon-wrapper bg-text-primary/5 text-text-primary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <div>
            <h2 className="card-title font-heading text-lg">Active Documents</h2>
            <p className="card-subtitle text-xs text-text-muted">
              {documents.length} item{documents.length !== 1 ? 's' : ''} powering the AI
            </p>
          </div>
        </div>
        
        <button 
          onClick={fetchDocuments} 
          className="refresh-trigger group p-2 hover:bg-black/5 rounded-full transition-colors" 
          title="Refresh List"
        >
          <svg className="group-hover:rotate-180 transition-transform duration-500 ease-out text-text-muted group-hover:text-primary" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
          </svg>
        </button>
      </div>

      <div className="doc-list-container flex-1 overflow-y-auto mt-4 pr-2 custom-scrollbar">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-muted gap-4">
            <div className="w-8 h-8 border-3 border-border border-t-primary rounded-full animate-spin" />
            <p className="font-medium animate-pulse">Loading documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <h3 className="font-heading text-lg text-text-primary mb-1">Knowledge base is empty</h3>
            <p className="text-sm text-text-muted max-w-[250px] mx-auto">
              Upload files or ingest URLs from the left to start teaching your AI assistant.
            </p>
          </div>
        ) : (
          <ul className="doc-list space-y-3">
            {documents.map((doc, idx) => (
              <li 
                key={doc.id} 
                className="doc-item group"
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <div className={`doc-icon-badge ${
                  doc.doc_type === 'url' ? 'bg-secondary/10 text-secondary' : 
                  doc.doc_type === '.pdf' ? 'bg-red-500/10 text-red-500' : 
                  'bg-primary/10 text-primary'
                }`}>
                  {getTypeIcon(doc.doc_type)}
                </div>
                
                <div className="doc-info flex-1 min-w-0 pr-4">
                  <h4 className="doc-name font-semibold text-sm text-text-primary truncate" title={doc.name}>
                    {doc.name}
                  </h4>
                  <div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
                    <span className="flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <rect x="7" y="7" width="3" height="9"/>
                        <rect x="14" y="7" width="3" height="5"/>
                      </svg>
                      {doc.chunk_count} chunks
                    </span>
                    <span className="w-1 h-1 rounded-full bg-border" />
                    <span className="flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                      {formatDate(doc.ingested_at)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="doc-format-tag text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-black/5 text-text-muted group-hover:bg-transparent transition-colors">
                    {doc.doc_type.replace(/^[./]/, '')}
                  </span>
                  <button
                    className="delete-btn hover:bg-red-50 text-red-400 hover:text-red-600 p-2 rounded-lg transition-all duration-200"
                    onClick={() => handleDelete(doc.id, doc.name)}
                    title="Remove Document"
                    aria-label={`Delete ${doc.name}`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
