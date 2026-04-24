import { CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { HeroSection } from '@/components/landing/HeroSection';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { StatsSection } from '@/components/landing/StatsSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';

function DashboardMockup({ professor = false }: { professor?: boolean }) {
  return (
    <div className="app-card overflow-hidden border-border shadow-soft">
      <div className="grid min-h-[340px] grid-cols-[88px_1fr]">
        <div className="bg-primary p-4">
          <div className="space-y-3">
            <div className="h-3 rounded-full bg-white/30" />
            <div className="h-3 rounded-full bg-white/20" />
            <div className="h-3 rounded-full bg-white/20" />
            <div className="h-3 rounded-full bg-white/20" />
          </div>
        </div>
        <div className="bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="h-4 w-40 rounded-full bg-border" />
            <div className="h-10 w-10 rounded-full bg-border" />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="rounded-xl border border-border bg-surface p-4">
                <div className="h-3 w-16 rounded-full bg-border" />
                <div className="mt-4 h-6 w-12 rounded-full bg-primary-light/20" />
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-xl border border-border">
            <div className="grid grid-cols-4 gap-3 border-b border-border bg-surface px-4 py-3">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="h-3 rounded-full bg-border" />
              ))}
            </div>
            <div className="space-y-3 px-4 py-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="grid grid-cols-4 gap-3">
                  {[1, 2, 3, 4].map((cell) => (
                    <div
                      key={`${item}-${cell}`}
                      className={`h-3 rounded-full ${professor && cell === 4 ? 'bg-accent/60' : 'bg-border'}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LandingPage() {
  const studentBullets = [
    'See all deadlines at a glance',
    'Submit assignments with one click',
    'Track grades and feedback in real time',
    'Find announcements and course materials quickly',
  ];
  const professorBullets = [
    'Create and publish assignments in seconds',
    'Review and grade submissions in one place',
    'Upload course materials and keep resources organized',
    'Announcements reach the right students automatically',
  ];

  return (
    <div className="bg-surface">
      <LandingNavbar />
      <HeroSection />
      <StatsSection />
      <FeaturesSection />

      <section id="for-students" className="bg-white py-20">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 lg:grid-cols-2 lg:items-center md:px-8">
          <div>
            <h2>Students get everything in one view</h2>
            <div className="mt-6 space-y-4">
              {studentBullets.map((bullet) => (
                <div key={bullet} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-success" />
                  <span className="text-text-secondary">{bullet}</span>
                </div>
              ))}
            </div>
          </div>
          <DashboardMockup />
        </div>
      </section>

      <section id="for-professors" className="bg-surface py-20">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 lg:grid-cols-2 lg:items-center md:px-8">
          <DashboardMockup professor />
          <div>
            <h2>Professors spend less time on admin</h2>
            <div className="mt-6 space-y-4">
              {professorBullets.map((bullet) => (
                <div key={bullet} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-success" />
                  <span className="text-text-secondary">{bullet}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <TestimonialsSection />

      <section className="bg-accent py-16">
        <div className="mx-auto max-w-4xl px-4 text-center md:px-8">
          <h2 className="text-white">Ready to transform your academic workflow?</h2>
          <div className="mt-8">
            <Link to="/register" className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-base font-semibold text-white">
              Create Student Account
            </Link>
          </div>
          <div className="mt-4 text-sm text-surface/90">
            Already have an account? <Link to="/login" className="font-semibold underline">Sign In</Link>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
