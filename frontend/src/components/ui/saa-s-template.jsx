import { Link } from 'react-router-dom';
import BrandLogo from '../BrandLogo';
import {
  ArrowRight,
  BarChart3,
  Bot,
  Check,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Star,
} from 'lucide-react';

const navItems = [
  { label: 'Platform', href: '#platform' },
  { label: 'Workflow', href: '#workflow' },
  { label: 'Insights', href: '#insights' },
  { label: 'Pricing', href: '#pricing' },
];

const features = [
  {
    tag: '01',
    title: 'Smart answers',
    body: 'Resolve common questions with a friendly AI layer that understands brand voice, product detail, and customer intent.',
    accent: 'bg-[#f1ebff]',
  },
  {
    tag: '02',
    title: 'Clear handoff',
    body: 'Escalate only when human attention is needed, with context and priority already attached to the conversation.',
    accent: 'bg-[#ffe7f4]',
  },
  {
    tag: '03',
    title: 'Live insight',
    body: 'See what customers ask, where they drop off, and where your team should improve the support experience next.',
    accent: 'bg-[#e9fff5]',
  },
];

const steps = [
  'Capture the request',
  'Match the best answer',
  'Route or resolve fast',
  'Summarize the outcome',
];

const factCards = [
  { value: '80%', label: 'faster replies' },
  { value: '24/7', label: 'coverage' },
  { value: '3x', label: 'qualified leads' },
  { value: '11 min', label: 'avg. resolution' },
];

const tickets = [
  {
    title: 'Live support',
    text: 'Real-time customer conversations with built-in routing, context, and enough clarity for the entire team.',
  },
  {
    title: 'AI answers',
    text: 'Helpful responses tuned to your FAQs, product details, and customer history so the experience feels natural.',
  },
  {
    title: 'Executive summary',
    text: 'Weekly summaries that connect support activity to operations, product, and sales without extra reporting work.',
  },
];

function LandingButton({ children, to, variant = 'primary' }) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-full border-[3px] border-[#252b3a] px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.18em] transition-all duration-180 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6434df]';
  const variants = {
    primary: 'bg-[#6434df] text-white shadow-[6px_6px_0_0_#252b3a] hover:-translate-y-0.5 hover:shadow-[8px_8px_0_0_#252b3a]',
    secondary: 'bg-[#fffdf5] text-[#253044] shadow-[6px_6px_0_0_#252b3a] hover:-translate-y-0.5 hover:shadow-[8px_8px_0_0_#252b3a]',
    soft: 'bg-[#e9fff5] text-[#253044] shadow-[5px_5px_0_0_#252b3a] hover:-translate-y-0.5 hover:shadow-[7px_7px_0_0_#252b3a]',
  };

  return (
    <Link to={to} className={`${base} ${variants[variant]}`}>
      {children}
    </Link>
  );
}

function scrollToDemo(event) {
  const target = document.getElementById('demo-preview');
  if (!target) return;

  event.preventDefault();
  target.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

export default function SaaSLandingTemplate() {
  return (
    <main className="playful-root min-h-screen bg-[#fffdf5] text-[#253044] antialiased">
      <div className="mx-auto max-w-[1600px] px-5 pb-8 pt-5 md:px-8 lg:px-10">
        <header className="mb-7 rounded-[28px] border-[3px] border-[#252b3a] bg-[#fffdf5] px-4 py-4 shadow-[8px_8px_0_0_#252b3a] md:px-6">
          <nav className="flex items-center justify-between gap-4">
            <BrandLogo compact showSubtitle={false} />

            <div className="hidden items-center gap-6 md:flex">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#253044] transition-colors hover:text-[#6434df] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6434df]"
                >
                  {item.label}
                </a>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="hidden rounded-full border-[3px] border-[#252b3a] bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#253044] shadow-[5px_5px_0_0_#252b3a] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6434df] md:inline-flex"
              >
                Sign in
              </Link>
              <LandingButton to="/register" variant="primary">Start free</LandingButton>
            </div>
          </nav>
        </header>

        <section className="relative overflow-hidden rounded-[32px] border-[3px] border-[#252b3a] bg-[#fffdf5] p-5 shadow-[12px_12px_0_0_#252b3a] md:p-8 lg:p-10">
          <div className="absolute right-6 top-4 h-16 w-16 rounded-full border-[3px] border-[#252b3a] bg-[#ff78c5] opacity-90 shadow-[8px_8px_0_0_#252b3a]" />
          <div className="absolute left-10 top-12 h-8 w-8 rotate-12 rounded-[10px] border-[3px] border-[#252b3a] bg-[#ffd05b] shadow-[5px_5px_0_0_#252b3a]" />
          <div className="absolute bottom-10 right-24 h-12 w-12 rounded-full border-[3px] border-[#252b3a] bg-[#9bf1cd] shadow-[5px_5px_0_0_#252b3a]" />

          <div className="relative grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="relative z-10 max-w-[720px]">
              <div className="mb-5 inline-flex items-center gap-3 rounded-full border-[3px] border-[#252b3a] bg-[#f1ebff] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#253044] shadow-[4px_4px_0_0_#252b3a]">
                <Sparkles className="h-4 w-4 text-[#6434df]" />
                Powered by Allié
              </div>

              <h1 className="max-w-[620px] text-[40px] font-black uppercase leading-[0.9] tracking-[-0.04em] text-[#252b3a] md:text-[56px] lg:text-[78px]">
                Friendly help
                <span className="mt-1 block text-[#6434df]">for every customer.</span>
              </h1>

              <p className="mt-6 max-w-[470px] text-[15px] leading-[1.6] text-[#253044]/75 md:text-[17px]">
                Allié gives growing businesses a better way to answer questions, route problems, and keep a calm support experience across every conversation.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <LandingButton to="/register" variant="primary">Book a demo</LandingButton>
                <a
                  href="#demo-preview"
                  onClick={scrollToDemo}
                  className="inline-flex items-center justify-center gap-2 rounded-full border-[3px] border-[#252b3a] bg-[#fffdf5] px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#253044] shadow-[6px_6px_0_0_#252b3a] transition-all duration-180 ease-out hover:-translate-y-0.5 hover:shadow-[8px_8px_0_0_#252b3a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6434df]"
                >
                  See demo
                </a>
              </div>
            </div>

            <div className="relative z-10 flex justify-center lg:justify-end">
              <div className="relative w-full max-w-[500px]">
                <div className="absolute -left-4 top-4 h-24 w-24 rounded-full border-[3px] border-[#252b3a] bg-[#9bf1cd] shadow-[8px_8px_0_0_#252b3a]" />
                <div className="absolute -right-8 top-12 h-16 w-16 rotate-12 rounded-[18px] border-[3px] border-[#252b3a] bg-[#ffd05b] shadow-[8px_8px_0_0_#252b3a]" />
                <div className="absolute bottom-4 left-6 h-14 w-14 rounded-full border-[3px] border-[#252b3a] bg-[#ff78c5] shadow-[8px_8px_0_0_#252b3a]" />

                <div id="demo-preview" className="relative overflow-hidden rounded-[28px] border-[3px] border-[#252b3a] bg-[linear-gradient(135deg,#f1ebff_0%,#ff78c5_32%,#ffd05b_100%)] p-4 shadow-[12px_12px_0_0_#252b3a]">
                  <div className="rounded-[22px] border-[3px] border-[#252b3a] bg-white/60 p-4 backdrop-blur-sm">
                    <div className="mb-4 flex items-center justify-between border-b-[2px] border-[#252b3a] pb-3">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full border-[2px] border-[#252b3a] bg-[#9bf1cd]" />
                        <span className="h-3 w-3 rounded-full border-[2px] border-[#252b3a] bg-[#ffd05b]" />
                        <span className="h-3 w-3 rounded-full border-[2px] border-[#252b3a] bg-[#ff78c5]" />
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#253044]">live</span>
                    </div>

                    <div className="rounded-[20px] border-[3px] border-[#252b3a] bg-[#f9f7f1] p-3">
                      <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-[#252b3a] bg-[#e9fff5] text-[#253044]">
                          <Bot className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#253044]/60">Allié</div>
                          <div className="text-[12px] font-semibold text-[#253044]">replying now</div>
                        </div>
                      </div>

                      <div className="rounded-[16px] border-[3px] border-[#252b3a] bg-[#fffdf5] p-3 text-[13px] leading-[1.7] text-[#253044]">
                        Hi there — I can help with delivery timing, returns, and product availability. Want me to check the order status for you?
                      </div>

                      <div className="mt-3 flex justify-end">
                        <div className="rounded-[16px] border-[3px] border-[#252b3a] bg-[#6434df] p-3 text-[12px] font-medium text-white">
                          Resolved in 2m 15s
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="platform" className="mt-8 rounded-[32px] border-[3px] border-[#252b3a] bg-[#fffdf5] p-5 shadow-[12px_12px_0_0_#252b3a] md:p-8">
          <div className="mb-6 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#253044]/65">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#6434df]" />
            Platform
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {features.map((feature) => (
              <article key={feature.tag} className={`pop-card rounded-[26px] border-[3px] border-[#252b3a] ${feature.accent} p-5 shadow-[8px_8px_0_0_#252b3a]`}>
                <div className="mb-5 flex items-center justify-between">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-[#252b3a] bg-white text-[12px] font-bold uppercase tracking-[0.18em] text-[#253044]">
                    {feature.tag}
                  </span>
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-[#252b3a] bg-[#fffdf5] text-[#253044]">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
                <h2 className="mb-3 text-[24px] font-black uppercase tracking-[-0.02em] text-[#253044]">{feature.title}</h2>
                <p className="text-[16px] leading-[1.7] text-[#253044]/75">{feature.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="workflow" className="mt-8 rounded-[32px] border-[3px] border-[#252b3a] bg-[#e9fff5] p-5 shadow-[12px_12px_0_0_#252b3a] md:p-8">
          <div className="mb-6 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#253044]/65">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#9bf1cd]" />
            Workflow
          </div>

          <div className="relative">
            <div className="hidden md:block absolute left-0 right-0 top-7 h-[3px] bg-[#252b3a]" />
            <div className="grid gap-4 md:grid-cols-4">
              {steps.map((step, index) => (
                <div key={step} className="pop-card relative rounded-[22px] border-[3px] border-[#252b3a] bg-white p-4 shadow-[6px_6px_0_0_#252b3a]">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-[#252b3a] bg-[#ffd05b] text-[12px] font-black uppercase tracking-[0.18em] text-[#253044]">
                      0{index + 1}
                    </span>
                    <span className="h-3 w-3 rounded-full border-[2px] border-[#252b3a] bg-[#6434df]" />
                  </div>
                  <div className="text-[15px] font-semibold uppercase tracking-[0.12em] text-[#253044]">{step}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="insights" className="mt-8 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[32px] border-[3px] border-[#252b3a] bg-[#fffdf5] p-5 shadow-[12px_12px_0_0_#252b3a] md:p-8">
            <div className="mb-6 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#253044]/65">
              <BarChart3 className="h-4 w-4 text-[#6434df]" />
              Insights
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              {factCards.map((item) => (
                <div key={item.label} className="pop-card rounded-[22px] border-[3px] border-[#252b3a] bg-[#f1ebff] p-4 shadow-[5px_5px_0_0_#252b3a]">
                  <div className="text-[28px] font-black uppercase tracking-[-0.02em] text-[#253044]">{item.value}</div>
                  <div className="mt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#253044]/65">{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border-[3px] border-[#252b3a] bg-[#fff0f7] p-5 shadow-[12px_12px_0_0_#252b3a] md:p-8">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#253044]/65">Signal</div>
              <span className="rounded-full border-[3px] border-[#252b3a] bg-[#9bf1cd] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#253044]">new</span>
            </div>

            <div className="space-y-4 text-[15px] leading-[1.7] text-[#253044]/75">
              <p>47% of incoming questions are now resolved without a human handoff, while your team can focus on more valuable moments.</p>
              <div className="flex items-start gap-3 border-t-[2px] border-[#252b3a] pt-4">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-[#6434df]" />
                <span>Clear ownership and stronger customer trust across every interaction.</span>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[32px] border-[3px] border-[#252b3a] bg-[#fffdf5] p-5 shadow-[12px_12px_0_0_#252b3a] md:p-8">
            <div className="mb-6 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#253044]/65">
              <MessageSquareText className="h-4 w-4 text-[#6434df]" />
              What teams get
            </div>

            <div className="space-y-4">
              {tickets.map((ticket) => (
                <div key={ticket.title} className="pop-card rounded-[22px] border-[3px] border-[#252b3a] bg-white p-4 shadow-[6px_6px_0_0_#252b3a]">
                  <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6434df]">{ticket.title}</div>
                  <p className="text-[16px] leading-[1.7] text-[#253044]/75">{ticket.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border-[3px] border-[#252b3a] bg-[#e9fff5] p-5 shadow-[12px_12px_0_0_#252b3a] md:p-8">
            <div className="mb-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#253044]/65">Customer note</div>
            <div className="pop-card rounded-[26px] border-[3px] border-[#252b3a] bg-white p-5 shadow-[7px_7px_0_0_#252b3a]">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-[#252b3a] bg-[#f1ebff] text-[#253044]">
                  <Star className="h-5 w-5 text-[#6434df]" />
                </div>
                <div>
                  <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#253044]/65">Sarah Chen</div>
                  <div className="text-[13px] text-[#253044]/65">@sarahdigital</div>
                </div>
              </div>
              <p className="text-[18px] leading-[1.7] text-[#253044]">
                “Allié helped us reduce support backlog and make every conversation feel more consistent, faster, and more human.”
              </p>
            </div>
          </div>
        </section>

        <section id="pricing" className="mt-8 rounded-[32px] border-[3px] border-[#252b3a] bg-[#fffdf5] p-5 shadow-[12px_12px_0_0_#252b3a] md:p-8">
          <div className="mb-6 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#253044]/65">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#ff78c5]" />
            Pricing
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[26px] border-[3px] border-[#252b3a] bg-[#fff4d9] p-6 shadow-[8px_8px_0_0_#252b3a]">
              <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#253044]/65">Starter</div>
              <div className="flex items-end gap-3">
                <span className="text-[46px] font-black uppercase tracking-[-0.03em] text-[#253044]">$49</span>
                <span className="pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#253044]/65">month</span>
              </div>

              <ul className="mt-6 space-y-3 text-[15px] leading-[1.7] text-[#253044]/75">
                <li className="flex items-center gap-3"><Check className="h-4 w-4 text-[#6434df]" /> 24/7 AI support</li>
                <li className="flex items-center gap-3"><Check className="h-4 w-4 text-[#6434df]" /> Live chat widget</li>
                <li className="flex items-center gap-3"><Check className="h-4 w-4 text-[#6434df]" /> Weekly summaries</li>
              </ul>
            </div>

            <div className="rounded-[26px] border-[3px] border-[#252b3a] bg-[#e9fff5] p-6 shadow-[8px_8px_0_0_#252b3a]">
              <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#253044]/65">Recommended</div>
              <div className="text-[28px] font-black uppercase tracking-[-0.02em] text-[#253044]">Scale</div>
              <p className="mt-5 text-[15px] leading-[1.7] text-[#253044]/75">Built for teams that want AI support, better routing, and happier customers without more admin.</p>
              <div className="mt-6 flex items-end gap-3">
                <span className="text-[42px] font-black uppercase tracking-[-0.03em] text-[#253044]">$149</span>
                <span className="pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#253044]/65">month</span>
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-8 rounded-[32px] border-[3px] border-[#252b3a] bg-[#252b3a] px-5 py-6 text-[#eef3ff] shadow-[12px_12px_0_0_#6434df] md:px-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="text-[12px] font-bold uppercase tracking-[0.24em] text-[#eef3ff]">Allié</div>

            <div className="flex flex-wrap gap-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#eef3ff]/80">
              {navItems.map((item) => (
                <a key={item.label} href={item.href} className="transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9bf1cd]">
                  {item.label}
                </a>
              ))}
            </div>

            <LandingButton to="/login" variant="soft">Sign in</LandingButton>
          </div>
        </footer>
      </div>
    </main>
  );
}
