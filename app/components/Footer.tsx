'use client'

import Link from 'next/link'

const footerLinks = {
  product: [
    { href: '/', label: 'Home' },
    { href: '/#features', label: 'Features' },
    { href: '/resources', label: 'Resources' },
    { href: '/join', label: 'Join Waitlist' },
  ],
  company: [
    { href: '#', label: 'About Us' },
    { href: '#', label: 'Contact' },
    { href: '#', label: 'Privacy Policy' },
    { href: '#', label: 'Terms of Service' },
  ],
  resources: [
    { href: '/resources', label: 'Blog' },
    { href: '/resources', label: 'Articles' },
    { href: '/resources', label: 'Videos' },
    { href: '/resources', label: 'Worksheets' },
  ],
}

const socialLinks = [
  {
    href: '#',
    label: 'Facebook',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
  },
  {
    href: '#',
    label: 'Twitter',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
      </svg>
    ),
  },
  {
    href: '#',
    label: 'Instagram',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    ),
  },
  {
    href: '#',
    label: 'LinkedIn',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect x="2" y="9" width="4" height="12" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    ),
  },
]

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand Section */}
          <div className="footer-brand">
            <Link href="/" className="footer-logo">
              <span className="logo-icon">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="16" cy="16" r="14" fill="#6B8F71"/>
                  <path d="M16 8C12.686 8 10 10.686 10 14C10 17.314 12.686 20 16 20C19.314 20 22 17.314 22 14C22 10.686 19.314 8 16 8Z" fill="white" fillOpacity="0.9"/>
                  <circle cx="13" cy="13" r="2" fill="#6B8F71"/>
                  <circle cx="19" cy="13" r="2" fill="#6B8F71"/>
                  <path d="M12 18C13 19 15 20 16 20C17 20 19 19 20 18" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </span>
              <span className="logo-text">AutismConnect</span>
            </Link>
            <p className="footer-tagline">
              Empowering parents to track progress, access resources, and build a supportive community for their children.
            </p>
            <div className="social-links">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="social-link"
                  aria-label={social.label}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Product Links */}
          <div className="footer-section">
            <h4 className="footer-heading">Product</h4>
            <ul className="footer-list">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="footer-link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div className="footer-section">
            <h4 className="footer-heading">Resources</h4>
            <ul className="footer-list">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="footer-link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div className="footer-section">
            <h4 className="footer-heading">Company</h4>
            <ul className="footer-list">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="footer-link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <p className="copyright">
            &copy; {currentYear} AutismConnect. All rights reserved.
          </p>
          <p className="disclaimer">
            Made with care for families everywhere
          </p>
        </div>
      </div>

      <style jsx>{`
        .footer {
          background-color: var(--text-primary);
          color: white;
          padding: 64px 0 24px;
          margin-top: auto;
        }

        .footer-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 48px;
        }

        .footer-brand {
          max-width: 280px;
        }

        .footer-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: var(--font-heading), 'Nunito', sans-serif;
          font-weight: 700;
          font-size: 20px;
          color: white;
          margin-bottom: 16px;
        }

        .logo-icon {
          display: flex;
          align-items: center;
        }

        .footer-tagline {
          color: rgba(255, 255, 255, 0.7);
          font-size: 14px;
          line-height: 1.6;
          margin-bottom: 24px;
        }

        .social-links {
          display: flex;
          gap: 12px;
        }

        .social-link {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 8px;
          background-color: rgba(255, 255, 255, 0.1);
          color: white;
          transition: background-color 0.2s ease, transform 0.2s ease;
        }

        .social-link:hover {
          background-color: var(--primary);
          transform: translateY(-2px);
        }

        .footer-section {
          display: flex;
          flex-direction: column;
        }

        .footer-heading {
          font-family: var(--font-heading), 'Nunito', sans-serif;
          font-weight: 600;
          font-size: 16px;
          margin-bottom: 20px;
          color: white;
        }

        .footer-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .footer-link {
          color: rgba(255, 255, 255, 0.7);
          font-size: 14px;
          transition: color 0.2s ease;
        }

        .footer-link:hover {
          color: white;
        }

        .footer-bottom {
          margin-top: 48px;
          padding-top: 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }

        .copyright {
          color: rgba(255, 255, 255, 0.5);
          font-size: 14px;
        }

        .disclaimer {
          color: rgba(255, 255, 255, 0.5);
          font-size: 14px;
        }

        @media (max-width: 1024px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr;
            gap: 32px;
          }

          .footer-brand {
            grid-column: 1 / -1;
            max-width: 100%;
          }
        }

        @media (max-width: 768px) {
          .footer {
            padding: 48px 0 24px;
          }

          .footer-grid {
            grid-template-columns: 1fr 1fr;
            gap: 32px;
          }

          .footer-bottom {
            flex-direction: column;
            text-align: center;
          }
        }

        @media (max-width: 480px) {
          .footer-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </footer>
  )
}