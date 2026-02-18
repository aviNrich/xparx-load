import { Link } from 'react-router-dom';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumbs?: Breadcrumb[];
}

export function PageHeader({ title, description, actions, breadcrumbs }: PageHeaderProps) {
  return (
    <div className="mb-6">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1 text-sm text-neutral-500 mb-2">
          {breadcrumbs.map((crumb, index) => (
            <span key={index} className="flex items-center gap-1">
              {index > 0 && <span>&gt;</span>}
              {crumb.href ? (
                <Link to={crumb.href} className="hover:text-neutral-700">
                  {crumb.label}
                </Link>
              ) : index === breadcrumbs.length - 1 ? (
                <span className="text-primary-600">{crumb.label}</span>
              ) : (
                <span>{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">{title}</h1>
        {actions && <div>{actions}</div>}
      </div>
      {description && (
        <p className="text-sm text-neutral-500 mt-1">{description}</p>
      )}
    </div>
  );
}
