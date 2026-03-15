type FileUploadCardProps = {
  dragActive: boolean;
  isUploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleDrag: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  handleFileUpload: (files: FileList | File[]) => void;
};

export default function FileUploadCard({
  dragActive,
  isUploading,
  fileInputRef,
  handleDrag,
  handleDrop,
  handleFileUpload
}: FileUploadCardProps) {
  return (
    <div className="glass-card upload-card group">
      <div className="card-header">
        <div className="icon-wrapper bg-primary/10 text-primary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        </div>
        <div>
          <h2 className="card-title font-heading text-lg">Upload Files</h2>
          <p className="card-subtitle text-xs">PDF, TXT, or MD securely</p>
        </div>
      </div>

      <div
        className={`dropzone ${dragActive ? 'dropzone-active' : ''} ${isUploading ? 'dropzone-uploading' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.txt,.md,.markdown"
          onChange={(e) => {
            if (e.target.files) handleFileUpload(e.target.files);
          }}
          className="hidden"
        />
        
        {isUploading ? (
          <div className="flex flex-col items-center justify-center p-8">
            <div className="loader-ring"></div>
            <p className="mt-4 font-medium text-primary">Processing securely...</p>
          </div>
        ) : (
          <div className="dropzone-content group-hover:bg-primary/5 transition-colors duration-300">
            <div className="upload-icon-pulse mb-4 text-primary opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="12" y2="12" />
                <line x1="15" y1="15" x2="12" y2="12" />
              </svg>
            </div>
            <p className="font-semibold text-text-primary mb-1">
              {dragActive ? 'Drop files to upload!' : 'Click or Drag files here'}
            </p>
            <p className="text-xs text-text-muted">Maximum file size 50MB</p>
          </div>
        )}
      </div>
    </div>
  );
}
