import {
  BarChart2,
  Bell,
  BookOpen,
  ClipboardList,
  LayoutDashboard,
} from 'lucide-react';

const features = [
  { icon: LayoutDashboard, title: 'Role-Based Dashboards', description: 'Dedicated student, professor, and administrator workspaces.' },
  { icon: ClipboardList, title: 'Assignment Management', description: 'Create, review, submit, and track assignments without friction.' },
  { icon: BookOpen, title: 'Course Materials', description: 'Keep every file, handout, and learning resource in one place.' },
  { icon: BarChart2, title: 'Grade Tracking', description: 'See performance trends, feedback, and averages in real time.' },
  { icon: Bell, title: 'Smart Announcements', description: 'Publish messages to the right audience with the right priority.' },
];

export function FeaturesSection() {
  return (
    <section id="features" className="bg-surface py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2>Everything you need, nothing you don&apos;t</h2>
          <p className="mt-4 text-text-secondary">
            Student Hub keeps academic workflows dense, clear, and fast for every role.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="app-card p-6 transition hover:-translate-y-1 hover:shadow-soft">
              <feature.icon className="h-8 w-8 text-primary-light" />
              <h3 className="mt-5">{feature.title}</h3>
              <p className="mt-3 text-sm leading-7 text-text-secondary">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
