'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getPostsByCategory, getFeaturedPosts, searchPosts, getCategories } from '@/lib/data'

export default function Resources() {
  const [isClient, setIsClient] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [posts, setPosts] = useState([])
  const [featuredPosts, setFeaturedPosts] = useState([])
  const [categories, setCategories] = useState([])
  const [isSearchFocused, setIsSearchFocused] = useState(false)

  useEffect(() => {
    setIsClient(true)
    setFeaturedPosts(getFeaturedPosts())
    setCategories(getCategories())
    setPosts(getPostsByCategory('all'))
  }, [])

  const handleCategoryChange = (category) => {
    setSelectedCategory(category)
    if (searchQuery.trim()) {
      const searchResults = searchPosts(searchQuery)
      if (category === 'all') {
        setPosts(searchResults)
      } else {
        setPosts(searchResults.filter(post => post.category === category))
      }
    } else {
      setPosts(getPostsByCategory(category))
    }
  }

  const handleSearch = (e) => {
    const query = e.target.value
    setSearchQuery(query)
    if (query.trim()) {
      const results = searchPosts(query)
      if (selectedCategory === 'all') {
        setPosts(results)
      } else {
        setPosts(results.filter(post => post.category === selectedCategory))
      }
    } else {
      setPosts(getPostsByCategory(selectedCategory))
    }
  }

  const getCategoryLabel = (category) => {
    const labels = {
      all: 'All Resources',
      articles: 'Articles',
      videos: 'Videos',
      worksheets: 'Worksheets'
    }
    return labels[category] || category
  }

  const getCategoryIcon = (category) => {
    const icons = {
      all: '📚',
      articles: '📄',
      videos: '🎬',
      worksheets: '📝'
    }
    return icons[category] || '📚'
  }

  if (!isClient) {
    return (
      <main className="min-h-screen bg-background">
        <div className="resources-loading">
          <div className="loading-spinner"></div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="resources-container">
        {/* Header */}
        <div className="resources-header">
          <h1 className="resources-title">Resources</h1>
          <p className="resources-subtitle">
            Articles, videos, and worksheets to support your journey
          </p>
        </div>

        {/* Search Bar */}
        <div className={`search-container ${isSearchFocused ? 'focused' : ''}`}>
          <div className="search-wrapper">
            <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Search resources..."
              value={searchQuery}
              onChange={handleSearch}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
            />
            {searchQuery && (
              <button className="search-clear" onClick={() => setSearchQuery('')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Category Filters */}
        <div className="categories-container">
          <div className="categories-grid">
            {categories.map((category) => (
              <button
                key={category}
                className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => handleCategoryChange(category)}
              >
                <span className="category-icon">{getCategoryIcon(category)}</span>
                <span className="category-label">{getCategoryLabel(category)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Featured Section */}
        {selectedCategory === 'all' && !searchQuery && featuredPosts.length > 0 && (
          <div className="featured-section">
            <h2 className="section-title">
              <span className="title-icon">⭐</span>
              Featured Resources
            </h2>
            <div className="featured-grid">
              {featuredPosts.map((post) => (
                <Link key={post.id} href={`/resources/${post.slug}`} className="featured-card">
                  <div className="featured-thumbnail">
                    <span className="thumbnail-emoji">{post.thumbnail}</span>
                  </div>
                  <div className="featured-content">
                    <span className="featured-category">{getCategoryLabel(post.category)}</span>
                    <h3 className="featured-title">{post.title}</h3>
                    <p className="featured-excerpt">{post.excerpt}</p>
                    <div className="featured-meta">
                      <span className="read-time">⏱️ {post.readTime} read</span>
                      <span className="featured-badge">Featured</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Results Count */}
        <div className="results-info">
          <span className="results-count">
            {posts.length} {posts.length === 1 ? 'resource' : 'resources'} found
          </span>
        </div>

        {/* Resources Grid */}
        {posts.length > 0 ? (
          <div className="resources-grid">
            {posts.map((post) => (
              <Link key={post.id} href={`/resources/${post.slug}`} className="resource-card">
                <div className="card-thumbnail">
                  <span className="card-emoji">{post.thumbnail}</span>
                  {post.featured && <span className="card-featured-badge">Featured</span>}
                </div>
                <div className="card-content">
                  <div className="card-category">
                    {getCategoryIcon(post.category)} {getCategoryLabel(post.category)}
                  </div>
                  <h3 className="card-title">{post.title}</h3>
                  <p className="card-excerpt">{post.excerpt}</p>
                  <div className="card-meta">
                    <span className="card-read-time">⏱️ {post.readTime} read</span>
                    <span className="card-date">{post.date}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="no-results">
            <span className="no-results-icon">🔍</span>
            <h3 className="no-results-title">No resources found</h3>
            <p className="no-results-text">
              Try adjusting your search or filter to find what you&apos;re looking for.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('all')
                setPosts(getPostsByCategory('all'))
              }}
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .resources-container {
          padding: 100px 16px 64px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .resources-loading {
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

        /* Header */
        .resources-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .resources-title {
          font-size: 40px;
          color: var(--primary);
          margin-bottom: 8px;
        }

        .resources-subtitle {
          font-size: 18px;
          color: var(--text-muted);
        }

        /* Search */
        .search-container {
          margin-bottom: 24px;
        }

        .search-wrapper {
          position: relative;
          max-width: 600px;
          margin: 0 auto;
        }

        .search-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          transition: color 0.2s;
        }

        .search-container.focused .search-icon {
          color: var(--primary);
        }

        .search-input {
          width: 100%;
          padding: 16px 48px;
          font-size: 16px;
          border: 2px solid var(--border);
          border-radius: 12px;
          background: var(--surface);
          color: var(--text-primary);
          transition: all 0.2s;
        }

        .search-input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 4px 20px rgba(107, 143, 113, 0.15);
        }

        .search-input::placeholder {
          color: var(--text-muted);
        }

        .search-clear {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-muted);
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .search-clear:hover {
          color: var(--text-primary);
        }

        /* Categories */
        .categories-container {
          margin-bottom: 32px;
        }

        .categories-grid {
          display: flex;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .category-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          border: 2px solid var(--border);
          border-radius: 24px;
          background: var(--surface);
          color: var(--text-muted);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .category-btn:hover {
          border-color: var(--primary);
          color: var(--primary);
        }

        .category-btn.active {
          background: var(--primary);
          border-color: var(--primary);
          color: white;
        }

        .category-icon {
          font-size: 18px;
        }

        /* Featured Section */
        .featured-section {
          margin-bottom: 40px;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 24px;
          color: var(--text-primary);
          margin-bottom: 20px;
        }

        .title-icon {
          font-size: 24px;
        }

        .featured-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 24px;
        }

        .featured-card {
          display: flex;
          gap: 20px;
          background: var(--surface);
          border-radius: 16px;
          padding: 24px;
          text-decoration: none;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
          transition: all 0.2s;
        }

        .featured-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
        }

        .featured-thumbnail {
          width: 80px;
          height: 80px;
          min-width: 80px;
          background: linear-gradient(135deg, rgba(107, 143, 113, 0.1) 0%, rgba(244, 162, 97, 0.1) 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .thumbnail-emoji {
          font-size: 36px;
        }

        .featured-content {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .featured-category {
          font-size: 12px;
          color: var(--primary);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }

        .featured-title {
          font-size: 18px;
          color: var(--text-primary);
          margin-bottom: 8px;
          line-height: 1.4;
        }

        .featured-excerpt {
          font-size: 14px;
          color: var(--text-muted);
          line-height: 1.5;
          margin-bottom: 12px;
          flex: 1;
        }

        .featured-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .read-time {
          font-size: 13px;
          color: var(--text-muted);
        }

        .featured-badge {
          font-size: 11px;
          background: linear-gradient(135deg, var(--secondary) 0%, var(--accent) 100%);
          color: white;
          padding: 4px 10px;
          border-radius: 12px;
          font-weight: 600;
        }

        /* Results Info */
        .results-info {
          margin-bottom: 20px;
        }

        .results-count {
          font-size: 14px;
          color: var(--text-muted);
        }

        /* Resources Grid */
        .resources-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 24px;
        }

        .resource-card {
          background: var(--surface);
          border-radius: 16px;
          overflow: hidden;
          text-decoration: none;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
          transition: all 0.2s;
        }

        .resource-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
        }

        .card-thumbnail {
          height: 120px;
          background: linear-gradient(135deg, rgba(107, 143, 113, 0.1) 0%, rgba(244, 162, 97, 0.1) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .card-emoji {
          font-size: 48px;
        }

        .card-featured-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          font-size: 10px;
          background: var(--secondary);
          color: white;
          padding: 4px 10px;
          border-radius: 12px;
          font-weight: 600;
        }

        .card-content {
          padding: 20px;
        }

        .card-category {
          font-size: 12px;
          color: var(--primary);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }

        .card-title {
          font-size: 18px;
          color: var(--text-primary);
          margin-bottom: 8px;
          line-height: 1.4;
        }

        .card-excerpt {
          font-size: 14px;
          color: var(--text-muted);
          line-height: 1.5;
          margin-bottom: 16px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .card-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 13px;
          color: var(--text-muted);
        }

        .card-read-time {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .card-date {
          opacity: 0.7;
        }

        /* No Results */
        .no-results {
          text-align: center;
          padding: 64px 24px;
          background: var(--surface);
          border-radius: 16px;
        }

        .no-results-icon {
          font-size: 48px;
          display: block;
          margin-bottom: 16px;
        }

        .no-results-title {
          font-size: 20px;
          color: var(--text-primary);
          margin-bottom: 8px;
        }

        .no-results-text {
          color: var(--text-muted);
          margin-bottom: 24px;
        }

        /* Button styles */
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
          border: none;
        }

        .btn-primary {
          background: var(--primary);
          color: white;
        }

        .btn-primary:hover {
          background: var(--primary-dark);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .resources-container {
            padding: 80px 16px 48px;
          }

          .resources-title {
            font-size: 32px;
          }

          .resources-subtitle {
            font-size: 16px;
          }

          .category-btn {
            padding: 10px 16px;
            font-size: 13px;
          }

          .featured-grid {
            grid-template-columns: 1fr;
          }

          .featured-card {
            flex-direction: column;
          }

          .featured-thumbnail {
            width: 100%;
            height: 100px;
          }

          .resources-grid {
            grid-template-columns: 1fr;
          }

          .section-title {
            font-size: 20px;
          }
        }
      `}</style>
    </main>
  )
}