export function LandingFooter() {
  return (
    <footer id="about" className="bg-primary text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:grid-cols-4 md:px-8">
        <div>
          <div className="text-xl font-semibold">Student Hub</div>
          <p className="mt-4 text-sm leading-7 text-white/70">
            The academic platform that brings courses, assignments, resources, and communication together.
          </p>
        </div>
        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.05em] text-white/60">Platform</div>
          <div className="mt-4 space-y-3 text-sm text-white/80">
            <a href="#features">Features</a>
            <a href="#for-students">For Students</a>
            <a href="#for-professors">For Professors</a>
          </div>
        </div>
        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.05em] text-white/60">Support</div>
          <div className="mt-4 space-y-3 text-sm text-white/80">
            <span>FAQ</span>
            <span>Contact</span>
            <span>Documentation</span>
          </div>
        </div>
        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.05em] text-white/60">Legal</div>
          <div className="mt-4 space-y-3 text-sm text-white/80">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-sm text-white/60 md:px-8">
        &copy; 2025 Student Hub. All rights reserved.
      </div>
    </footer>
  );
}
