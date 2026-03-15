import Link from 'next/link'

type BreadcrumbItem = {
  label: string
  href?: string
}

type BreadcrumbsProps = {
  items: BreadcrumbItem[]
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="breadcrumbs">
      <ol className="breadcrumb-list">
        {items.map((item, i) => (
          <li key={i} className="breadcrumb-item">
            {i > 0 && <span className="breadcrumb-sep" aria-hidden="true">›</span>}
            {item.href && i < items.length - 1 ? (
              <Link href={item.href} className="breadcrumb-link">
                {item.label}
              </Link>
            ) : (
              <span className="breadcrumb-current" aria-current={i === items.length - 1 ? 'page' : undefined}>
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>

      <style jsx>{`
        .breadcrumbs {
          margin-bottom: 16px;
        }
        .breadcrumb-list {
          display: flex;
          align-items: center;
          gap: 0;
          list-style: none;
          padding: 0;
          margin: 0;
          font-size: 14px;
        }
        .breadcrumb-item {
          display: flex;
          align-items: center;
        }
        .breadcrumb-sep {
          margin: 0 8px;
          color: var(--text-muted);
          opacity: 0.5;
          font-size: 16px;
        }
        .breadcrumb-link {
          color: var(--text-muted);
          text-decoration: none;
          transition: color 0.15s;
        }
        .breadcrumb-link:hover {
          color: var(--primary);
        }
        .breadcrumb-current {
          color: var(--text-primary);
          font-weight: 600;
        }
      `}</style>
    </nav>
  )
}
