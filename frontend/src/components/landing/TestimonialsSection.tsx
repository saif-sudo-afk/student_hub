const testimonials = [
  {
    quote: 'Student Hub completely changed how I manage my courses.',
    author: 'Dr. A. Benali',
    role: 'Professor of Computer Science',
    institution: 'National Institute of Technology',
  },
  {
    quote: 'My students now know exactly what is due and where to find it.',
    author: 'M. Rahmani',
    role: 'Program Coordinator',
    institution: 'Faculty of Engineering',
  },
  {
    quote: 'The AI assistant saves time for both revision and class preparation.',
    author: 'S. Karim',
    role: 'Senior Lecturer',
    institution: 'School of Information Systems',
  },
];

export function TestimonialsSection() {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2>Trusted by educators</h2>
          <p className="mt-4 text-text-secondary">
            Teams use Student Hub to keep coursework, communication, and grading aligned.
          </p>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <div key={testimonial.author} className="app-card p-6">
              <div className="text-accent">★★★★★</div>
              <p className="mt-4 italic text-text-primary">&ldquo;{testimonial.quote}&rdquo;</p>
              <div className="mt-6">
                <div className="font-semibold">{testimonial.author}</div>
                <div className="text-sm text-text-secondary">
                  {testimonial.role}, {testimonial.institution}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
