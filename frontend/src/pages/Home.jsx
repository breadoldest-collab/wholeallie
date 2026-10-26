export default function Home() {
  return (
    <div className="min-h-screen bg-[#0d1117] text-white">
      {/* Navbar */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-8 py-8">
        <span className="text-2xl font-bold tracking-tight">Allié</span>
        <nav className="flex items-center gap-6">
          <button
            type="button"
            className="text-base font-medium text-white/80 hover:text-white"
          >
            Login
          </button>
          <button
            type="button"
            className="rounded-lg bg-[#3b82f6] px-6 py-3 text-base font-semibold text-white hover:bg-[#2563eb]"
          >
            Get Started
          </button>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-8 pb-32 pt-24 text-center">
        <h1 className="mx-auto max-w-4xl text-5xl font-bold leading-tight tracking-tight md:text-6xl lg:text-7xl">
          AI-powered customer support that never sleeps
        </h1>
        <p className="mx-auto mt-8 max-w-2xl text-xl leading-relaxed text-white/70 md:text-2xl">
          Resolve tickets faster, delight customers, and scale your support team
          with intelligent automation.
        </p>
        <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <button
            type="button"
            className="rounded-lg bg-[#3b82f6] px-8 py-4 text-lg font-semibold text-white hover:bg-[#2563eb]"
          >
            Start Free Trial
          </button>
          <button
            type="button"
            className="rounded-lg border border-white/20 px-8 py-4 text-lg font-semibold text-white hover:border-white/40"
          >
            See How It Works
          </button>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-8 pb-32">
        <h2 className="mb-16 text-center text-3xl font-bold md:text-4xl">
          Everything you need to support customers at scale
        </h2>
        <div className="grid gap-8 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-10">
            <h3 className="text-xl font-semibold md:text-2xl">24/7 AI Responses</h3>
            <p className="mt-4 text-base leading-relaxed text-white/70 md:text-lg">
              Instantly answer common questions with AI that learns from your
              knowledge base and past conversations.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-10">
            <h3 className="text-xl font-semibold md:text-2xl">Smart Ticket Routing</h3>
            <p className="mt-4 text-base leading-relaxed text-white/70 md:text-lg">
              Automatically prioritize and assign tickets to the right agent
              based on urgency, topic, and availability.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-10">
            <h3 className="text-xl font-semibold md:text-2xl">Analytics & Insights</h3>
            <p className="mt-4 text-base leading-relaxed text-white/70 md:text-lg">
              Track response times, satisfaction scores, and team performance
              with real-time dashboards.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-8 px-8 py-12 md:flex-row">
          <span className="text-lg font-bold">Allié</span>
          <div className="flex flex-wrap items-center justify-center gap-8 text-base text-white/60">
            <a href="#" className="hover:text-white">
              Product
            </a>
            <a href="#" className="hover:text-white">
              Pricing
            </a>
            <a href="#" className="hover:text-white">
              Documentation
            </a>
            <a href="#" className="hover:text-white">
              Privacy
            </a>
            <a href="#" className="hover:text-white">
              Terms
            </a>
          </div>
          <p className="text-sm text-white/40">
            &copy; {new Date().getFullYear()} Allié. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
