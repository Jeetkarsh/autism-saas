'use client'

import { useState } from 'react'

const testimonials = [
  {
    quote: "AutismConnect has been a game-changer for our family. Being able to track my son's progress daily has helped us identify patterns we never noticed before.",
    author: "Priya Sharma",
    role: "Mother of Arjun, 7",
    avatar: "PS",
  },
  {
    quote: "The community support is incredible. Finally, I have a space where people truly understand what I'm going through. We're not alone in this journey.",
    author: "Rahul Mehta",
    role: "Father of Riya, 5",
    avatar: "RM",
  },
  {
    quote: "The resources section alone is worth it. Curated articles that actually help, without having to wade through endless Google results.",
    author: "Anjali Patel",
    role: "Mother of Dev, 9",
    avatar: "AP",
  },
  {
    quote: "The streak feature keeps us motivated. Every day we log our activities, it reminds us that progress is made one step at a time.",
    author: "Vikram Singh",
    role: "Father of Aarav, 6",
    avatar: "VS",
  },
]

const stats = [
  { number: '500+', label: 'Families Tracking' },
  { number: '10,000+', label: 'Sessions Logged' },
  { number: '200+', label: 'Resources Available' },
  { number: '98%', label: 'Parent Satisfaction' },
]

export default function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0)

  const nextTestimonial = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length)
  }

  const prevTestimonial = () => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  return (
    <section className="testimonials">
      <div className="container">
        {/* Stats Bar */}
        <div className="stats-bar">
          {stats.map((stat, index) => (
            <div key={index} className="stat-item">
              <span className="stat-number">{stat.number}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Testimonials Carousel */}
        <div className="testimonials-content">
          <div className="testimonials-header">
            <span className="section-label">Testimonials</span>
            <h2 className="section-title">
              Loved by <span className="text-gradient">Parents Like You</span>
            </h2>
          </div>

          <div className="testimonial-carousel">
            <button
              className="carousel-btn prev"
              onClick={prevTestimonial}
              aria-label="Previous testimonial"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>

            <div className="testimonial-card">
              <div className="quote-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/>
                </svg>
              </div>
              <blockquote className="testimonial-quote">
                {testimonials[activeIndex].quote}
              </blockquote>
              <div className="testimonial-author">
                <div className="author-avatar">{testimonials[activeIndex].avatar}</div>
                <div className="author-info">
                  <span className="author-name">{testimonials[activeIndex].author}</span>
                  <span className="author-role">{testimonials[activeIndex].role}</span>
                </div>
              </div>
            </div>

            <button
              className="carousel-btn next"
              onClick={nextTestimonial}
              aria-label="Next testimonial"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>

          <div className="carousel-dots">
            {testimonials.map((_, index) => (
              <button
                key={index}
                className={`dot ${index === activeIndex ? 'active' : ''}`}
                onClick={() => setActiveIndex(index)}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .testimonials {
          padding: 80px 0;
          background-color: var(--background);
        }

        .stats-bar {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
          padding: 48px;
          border-radius: 24px;
          margin-bottom: 80px;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .stat-number {
          font-size: 36px;
          font-weight: 800;
          color: white;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.8);
        }

        .testimonials-content {
          max-width: 800px;
          margin: 0 auto;
          text-align: center;
        }

        .testimonials-header {
          margin-bottom: 48px;
        }

        .section-label {
          display: inline-block;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--primary);
          margin-bottom: 16px;
        }

        .section-title {
          font-size: 40px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .testimonial-carousel {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .carousel-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border: 2px solid var(--border);
          background-color: white;
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .carousel-btn:hover {
          border-color: var(--primary);
          color: var(--primary);
          transform: scale(1.1);
        }

        .testimonial-card {
          flex: 1;
          background-color: white;
          padding: 48px;
          border-radius: 24px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06);
          position: relative;
        }

        .quote-icon {
          position: absolute;
          top: 24px;
          left: 32px;
          color: var(--primary);
          opacity: 0.15;
        }

        .testimonial-quote {
          font-size: 20px;
          line-height: 1.7;
          color: var(--text-primary);
          margin-bottom: 32px;
          font-style: italic;
        }

        .testimonial-author {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .author-avatar {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: 700;
        }

        .author-info {
          display: flex;
          flex-direction: column;
          text-align: left;
        }

        .author-name {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .author-role {
          font-size: 14px;
          color: var(--text-muted);
        }

        .carousel-dots {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-top: 32px;
        }

        .dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: none;
          background-color: var(--border);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .dot.active {
          background-color: var(--primary);
          transform: scale(1.2);
        }

        .dot:hover:not(.active) {
          background-color: var(--text-muted);
        }

        @media (max-width: 1024px) {
          .stats-bar {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .testimonials {
            padding: 64px 0;
          }

          .stats-bar {
            grid-template-columns: repeat(2, 1fr);
            padding: 32px;
            margin-bottom: 48px;
          }

          .stat-number {
            font-size: 28px;
          }

          .section-title {
            font-size: 32px;
          }

          .testimonial-carousel {
            flex-direction: column;
          }

          .carousel-btn {
            display: none;
          }

          .testimonial-card {
            padding: 32px;
          }

          .testimonial-quote {
            font-size: 16px;
          }
        }

        @media (max-width: 480px) {
          .stats-bar {
            grid-template-columns: 1fr 1fr;
            gap: 24px 16px;
          }

          .stat-item {
            padding: 8px 0;
          }
        }
      `}</style>
    </section>
  )
}