import { ArrowDown } from 'lucide-react';
import { Link } from 'react-router-dom';

export function HeroSection() {
  return (
    <section
      id="top"
      className="relative flex min-h-screen items-center overflow-hidden bg-primary"
      style={{
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(255,255,255,0.10),transparent_35%)]" />
      <div className="relative mx-auto flex w-full max-w-7xl flex-col items-start px-4 py-20 md:px-8">
        <div className="max-w-3xl">
          <h1 className="text-[42px] font-extrabold leading-tight text-white md:text-[56px]">
            The Academic Platform Built for Modern Education
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-surface/90 md:text-xl">
            Manage courses, assignments, and AI-powered learning, all in one place.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link to="/register" className="btn-accent px-6 py-3 text-base">
              Create Student Account
            </Link>
            <a
              href="#features"
              className="btn-secondary border-white/25 bg-transparent px-6 py-3 text-base text-white hover:bg-white/10"
            >
              See How It Works
            </a>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            {['AI-Powered', 'Role-Based Access', 'Cloud Storage'].map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white"
              >
                {item}
              </span>
            ))}
          </div>
          <p className="mt-6 text-sm text-surface/80">
            Student accounts can be created here. Professor accounts are created by administrators only.
          </p>
        </div>
        <div className="mt-16 animate-bounce text-white/80">
          <ArrowDown className="h-6 w-6" />
        </div>
      </div>
    </section>
  );
}
