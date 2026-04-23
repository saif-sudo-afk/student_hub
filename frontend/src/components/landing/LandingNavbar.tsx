import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

export function LandingNavbar() {
  const [open, setOpen] = useState(false);

  const links = [
    { label: 'Features', href: '#features' },
    { label: 'For Students', href: '#for-students' },
    { label: 'For Professors', href: '#for-professors' },
    { label: 'About', href: '#about' },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8">
        <a href="#top" className="text-xl font-semibold text-primary">
          Student Hub
        </a>
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <a key={link.label} href={link.href} className="text-sm font-medium text-text-secondary transition hover:text-primary-light">
              {link.label}
            </a>
          ))}
          <Link to="/login" className="btn-secondary">
            Sign In
          </Link>
        </nav>
        <button type="button" className="rounded-lg border border-border p-2 md:hidden" onClick={() => setOpen((value) => !value)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open ? (
        <div className="border-t border-border bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {links.map((link) => (
              <a key={link.label} href={link.href} className="text-sm font-medium text-text-secondary" onClick={() => setOpen(false)}>
                {link.label}
              </a>
            ))}
            <Link to="/login" className="btn-secondary justify-center" onClick={() => setOpen(false)}>
              Sign In
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
