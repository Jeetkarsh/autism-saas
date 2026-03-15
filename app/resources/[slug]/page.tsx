'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { getPostBySlug, getRelatedPosts } from '@/lib/data'

export default function BlogPost() {
  const params = useParams()
  const [isClient, setIsClient] = useState(false)
  const [post, setPost] = useState(null)
  const [relatedPosts, setRelatedPosts] = useState([])
  const [showShareMenu, setShowShareMenu] = useState(false)

  useEffect(() => {
    setIsClient(true)
    if (params.slug) {
      const foundPost = getPostBySlug(params.slug)
      setPost(foundPost)
      if (foundPost) {
        setRelatedPosts(getRelatedPosts(params.slug, 3))
      }
    }
  }, [params.slug])

  const handleShare = (platform) => {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    const title = post?.title || ''

    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      copy: url
    }

    if (platform === 'copy') {
      navigator.clipboard.writeText(url)
      setShowShareMenu(false)
    } else if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400')
      setShowShareMenu(false)
    }
  }

  const getCategoryLabel = (category) => {
    const labels = {
      articles: 'Article',
      videos: 'Video',
      worksheets: 'Worksheet'
    }
    return labels[category] || 'Resource'
  }

  const renderContent = (content) => {
    if (!content) return null

    // Simple markdown-like rendering
    const lines = content.split('\n')
    const elements = []
    let currentList = []
    let listType = null

    const flushList = () => {
      if (currentList.length > 0) {
        if (listType === 'ul') {
          elements.push(<ul key={elements.length}>{currentList}</ul>)
        } else if (listType === 'ol') {
          elements.push(<ol key={elements.length}>{currentList}</ol>)
        }
        currentList = []
        listType = null
      }
    }

    lines.forEach((line, index) => {
      const trimmed = line.trim()

      if (trimmed.startsWith('# ')) {
        flushList()
        elements.push(<h1 key={index}>{trimmed.slice(2)}</h1>)
      } else if (trimmed.startsWith('## ')) {
        flushList()
        elements.push(<h2 key={index}>{trimmed.slice(3)}</h2>)
      } else if (trimmed.startsWith('### ')) {
        flushList()
        elements.push(<h3 key={index}>{trimmed.slice(4)}</h3>)
      } else if (trimmed.startsWith('- ')) {
        if (listType !== 'ul') {
          flushList()
          listType = 'ul'
        }
        currentList.push(<li key={index}>{trimmed.slice(2)}</li>)
      } else if (/^\d+\.\s/.test(trimmed)) {
        if (listType !== 'ol') {
          flushList()
          listType = 'ol'
        }
        currentList.push(<li key={index}>{trimmed.replace(/^\d+\.\s/, '')}</li>)
      } else if (trimmed === '') {
        flushList()
      } else {
        flushList()
        // Handle bold text
        const withBold = trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        elements.push(<p key={index} dangerouslySetInnerHTML={{ __html: withBold }} />)
      }
    })

    flushList()
    return elements
  }

  if (!isClient) {
    return (
      <main className="min-h-screen bg-background">
        <div className="post-loading">
          <div className="loading-spinner"></div>
        </div>
      </main>
    )
  }

  if (!post) {
    return (
      <main className="min-h-screen bg-background">
        <div className="post-container">
          <div className="not-found">
            <span className="not-found-icon">🔍</span>
            <h1 className="not-found-title">Resource Not Found</h1>
            <p className="not-found-text">
              The resource you&apos;re looking for doesn&apos;t exist or has been moved.
            </p>
            <Link href="/resources" className="btn btn-primary">
              Browse All Resources
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="post-container">
        {/* Back Button */}
        <Link href="/resources" className="back-link">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5"/>
            <path d="M12 19l-7-7 7-7"/>
          </svg>
          Back to Resources
        </Link>

        {/* Article Header */}
        <header className="article-header">
          <div className="article-meta-top">
            <span className="article-category">{getCategoryLabel(post.category)}</span>
            <span className="article-read-time">⏱️ {post.readTime} read</span>
          </div>
          <h1 className="article-title">{post.title}</h1>
          <p className="article-excerpt">{post.excerpt}</p>
          <div className="article-meta">
            <span className="article-date">📅 {post.date}</span>
            {post.featured && <span className="article-featured-badge">⭐ Featured</span>}
          </div>
        </header>

        {/* Share Buttons */}
        <div className="share-container">
          <span className="share-label">Share this resource:</span>
          <div className="share-buttons">
            <button className="share-btn twitter" onClick={() => handleShare('twitter')} aria-label="Share on Twitter">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </button>
            <button className="share-btn facebook" onClick={() => handleShare('facebook')} aria-label="Share on Facebook">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </button>
            <button className="share-btn linkedin" onClick={() => handleShare('linkedin')} aria-label="Share on LinkedIn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </button>
            <button className="share-btn copy" onClick={() => handleShare('copy')} aria-label="Copy link">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Article Content */}
        <article className="article-content">
          <div className="content-body">
            {renderContent(post.content)}
          </div>
        </article>

        {/* Related Articles */}
        {relatedPosts.length > 0 && (
          <section className="related-section">
            <h2 className="related-title">
              <span className="related-icon">📚</span>
              Related Resources
            </h2>
            <div className="related-grid">
              {relatedPosts.map((relatedPost) => (
                <Link key={relatedPost.id} href={`/resources/${relatedPost.slug}`} className="related-card">
                  <div className="related-thumbnail">
                    <span className="related-emoji">{relatedPost.thumbnail}</span>
                  </div>
                  <div className="related-content">
                    <span className="related-category">{getCategoryLabel(relatedPost.category)}</span>
                    <h3 className="related-card-title">{relatedPost.title}</h3>
                    <span className="related-read-time">⏱️ {relatedPost.readTime} read</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Bottom CTA */}
        <div className="bottom-cta">
          <h3 className="cta-title">Found this helpful?</h3>
          <p className="cta-text">Explore more resources or start tracking your child&apos;s progress.</p>
          <div className="cta-buttons">
            <Link href="/resources" className="btn btn-primary">
              Browse More Resources
            </Link>
            <Link href="/dashboard" className="btn btn-secondary">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        .post-container {
          padding: 100px 16px 64px;
          max-width: 800px;
          margin: 0 auto;
        }

        .post-loading {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--border);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Back Link */
        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--text-muted);
          font-size: 14px;
          margin-bottom: 32px;
          transition: color 0.2s;
        }

        .back-link:hover {
          color: var(--primary);
        }

        /* Article Header */
        .article-header {
          margin-bottom: 32px;
        }

        .article-meta-top {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 16px;
        }

        .article-category {
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--primary);
          background: rgba(107, 143, 113, 0.1);
          padding: 6px 12px;
          border-radius: 16px;
        }

        .article-read-time {
          font-size: 13px;
          color: var(--text-muted);
        }

        .article-title {
          font-size: 36px;
          color: var(--text-primary);
          line-height: 1.3;
          margin-bottom: 16px;
        }

        .article-excerpt {
          font-size: 18px;
          color: var(--text-muted);
          line-height: 1.6;
          margin-bottom: 20px;
        }

        .article-meta {
          display: flex;
          align-items: center;
          gap: 16px;
          font-size: 14px;
          color: var(--text-muted);
        }

        .article-featured-badge {
          font-size: 12px;
          background: linear-gradient(135deg, var(--secondary) 0%, var(--accent) 100%);
          color: white;
          padding: 4px 12px;
          border-radius: 12px;
          font-weight: 600;
        }

        /* Share Container */
        .share-container {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
          background: var(--surface);
          border-radius: 12px;
          margin-bottom: 32px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .share-label {
          font-size: 14px;
          color: var(--text-muted);
          font-weight: 500;
        }

        .share-buttons {
          display: flex;
          gap: 8px;
        }

        .share-btn {
          width: 40px;
          height: 40px;
          border: none;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .share-btn.twitter {
          background: #000;
          color: white;
        }

        .share-btn.twitter:hover {
          background: #333;
        }

        .share-btn.facebook {
          background: #1877F2;
          color: white;
        }

        .share-btn.facebook:hover {
          background: #0d65d9;
        }

        .share-btn.linkedin {
          background: #0A66C2;
          color: white;
        }

        .share-btn.linkedin:hover {
          background: #004182;
        }

        .share-btn.copy {
          background: var(--border);
          color: var(--text-primary);
        }

        .share-btn.copy:hover {
          background: var(--primary);
          color: white;
        }

        /* Article Content */
        .article-content {
          background: var(--surface);
          border-radius: 16px;
          padding: 40px;
          margin-bottom: 48px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
        }

        .content-body h1 {
          font-size: 28px;
          color: var(--text-primary);
          margin: 32px 0 16px;
        }

        .content-body h2 {
          font-size: 22px;
          color: var(--text-primary);
          margin: 28px 0 14px;
          padding-bottom: 8px;
          border-bottom: 2px solid var(--border);
        }

        .content-body h3 {
          font-size: 18px;
          color: var(--text-primary);
          margin: 24px 0 12px;
        }

        .content-body p {
          font-size: 16px;
          line-height: 1.8;
          color: var(--text-primary);
          margin-bottom: 16px;
        }

        .content-body ul,
        .content-body ol {
          margin: 16px 0;
          padding-left: 24px;
        }

        .content-body li {
          font-size: 16px;
          line-height: 1.8;
          color: var(--text-primary);
          margin-bottom: 8px;
        }

        .content-body ul li::marker {
          color: var(--primary);
        }

        .content-body ol li::marker {
          color: var(--primary);
          font-weight: 600;
        }

        /* Related Section */
        .related-section {
          margin-bottom: 48px;
        }

        .related-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 24px;
          color: var(--text-primary);
          margin-bottom: 20px;
        }

        .related-icon {
          font-size: 24px;
        }

        .related-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
        }

        .related-card {
          background: var(--surface);
          border-radius: 12px;
          overflow: hidden;
          text-decoration: none;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          transition: all 0.2s;
        }

        .related-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
        }

        .related-thumbnail {
          height: 80px;
          background: linear-gradient(135deg, rgba(107, 143, 113, 0.1) 0%, rgba(244, 162, 97, 0.1) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .related-emoji {
          font-size: 36px;
        }

        .related-content {
          padding: 16px;
        }

        .related-category {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--primary);
        }

        .related-card-title {
          font-size: 15px;
          color: var(--text-primary);
          margin: 6px 0 8px;
          line-height: 1.4;
        }

        .related-read-time {
          font-size: 12px;
          color: var(--text-muted);
        }

        /* Bottom CTA */
        .bottom-cta {
          background: linear-gradient(135deg, var(--primary) 0%, #5a7d60 100%);
          border-radius: 16px;
          padding: 40px;
          text-align: center;
          color: white;
        }

        .cta-title {
          font-size: 24px;
          margin-bottom: 8px;
        }

        .cta-text {
          opacity: 0.9;
          margin-bottom: 24px;
        }

        .cta-buttons {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
        }

        .btn-primary {
          background: white;
          color: var(--primary);
          border: none;
        }

        .btn-primary:hover {
          background: rgba(255, 255, 255, 0.9);
          transform: translateY(-2px);
        }

        .btn-secondary {
          background: transparent;
          color: white;
          border: 2px solid white;
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        /* Not Found */
        .not-found {
          text-align: center;
          padding: 64px 24px;
        }

        .not-found-icon {
          font-size: 64px;
          display: block;
          margin-bottom: 24px;
        }

        .not-found-title {
          font-size: 28px;
          color: var(--text-primary);
          margin-bottom: 12px;
        }

        .not-found-text {
          color: var(--text-muted);
          margin-bottom: 32px;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .post-container {
            padding: 80px 16px 48px;
          }

          .article-title {
            font-size: 28px;
          }

          .article-excerpt {
            font-size: 16px;
          }

          .article-content {
            padding: 24px;
          }

          .content-body h1 {
            font-size: 24px;
          }

          .content-body h2 {
            font-size: 20px;
          }

          .share-container {
            flex-direction: column;
            align-items: flex-start;
          }

          .bottom-cta {
            padding: 32px 24px;
          }

          .cta-buttons {
            flex-direction: column;
          }
        }
      `}</style>
    </main>
  )
}