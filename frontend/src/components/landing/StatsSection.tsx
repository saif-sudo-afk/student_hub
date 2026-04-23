import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { getPublicStats } from '@/api/public';

function useAnimatedCount(target: number, visible: boolean) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!visible) {
      return;
    }
    let start = 0;
    const step = Math.max(Math.ceil(target / 30), 1);
    const timer = window.setInterval(() => {
      start += step;
      if (start >= target) {
        setValue(target);
        window.clearInterval(timer);
      } else {
        setValue(start);
      }
    }, 25);
    return () => window.clearInterval(timer);
  }, [target, visible]);

  return value;
}

interface AnimatedStatCardProps {
  label: string;
  value: number;
  visible: boolean;
}

function AnimatedStatCard({ label, value, visible }: AnimatedStatCardProps) {
  const animatedValue = useAnimatedCount(value, visible);

  return (
    <div className="text-center">
      <div className="text-3xl font-bold text-white">{animatedValue}</div>
      <div className="mt-2 text-sm font-medium uppercase tracking-[0.05em] text-surface/80">{label}</div>
    </div>
  );
}

export function StatsSection() {
  const { data } = useQuery({
    queryKey: ['public-stats'],
    queryFn: getPublicStats,
  });
  const [visible, setVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const stats = useMemo(
    () => [
      { label: 'Students Enrolled', value: data?.students_count ?? 0 },
      { label: 'Courses Available', value: data?.courses_count ?? 0 },
      { label: 'Professors', value: data?.professors_count ?? 0 },
    ],
    [data],
  );

  return (
    <section ref={containerRef} className="bg-primary py-6">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 md:grid-cols-3 md:px-8">
        {stats.map((stat) => (
          <AnimatedStatCard key={stat.label} label={stat.label} value={stat.value} visible={visible} />
        ))}
      </div>
    </section>
  );
}
