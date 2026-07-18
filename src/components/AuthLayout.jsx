import { Activity, BarChart3, Moon, ShieldCheck, Sun, Users } from 'lucide-react';
import useTheme from '../hooks/useTheme';

const highlights = [
  {
    icon: Users,
    title: 'Community oversight',
    description: 'Manage users and role approvals from one secure workspace.',
  },
  {
    icon: BarChart3,
    title: 'Operational visibility',
    description: 'Monitor platform activity and content moderation workflows.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure administration',
    description: 'Keep sensitive management tools behind admin access.',
  },
];

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-10 place-items-center rounded-xl bg-yellow-400 text-slate-950 shadow-lg shadow-yellow-400/20">
        <Activity aria-hidden="true" className="size-5" strokeWidth={2.5} />
      </div>
      <div>
        <p className="text-lg font-bold tracking-tight text-slate-950 dark:text-white lg:text-white">
          Loopzey
        </p>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
          Admin Console
        </p>
      </div>
    </div>
  );
}

export default function AuthLayout({ children }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <main className="relative min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <button
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        className="absolute right-4 top-4 z-20 grid size-11 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 sm:right-5 sm:top-5"
        onClick={toggleTheme}
        title={isDark ? 'Light mode' : 'Dark mode'}
        type="button"
      >
        {isDark ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
      </button>
      <div className="mx-auto grid min-h-screen max-w-[1600px] lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden border-r border-white/5 bg-slate-900 px-12 py-10 lg:flex lg:flex-col xl:px-20 xl:py-14">
          <div className="absolute -left-32 top-1/3 size-96 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute -right-32 -top-20 size-96 rounded-full bg-yellow-400/10 blur-3xl" />

          <div className="relative z-10">
            <Logo />
          </div>

          <div className="relative z-10 my-auto max-w-xl py-16">
            <span className="inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/5 px-3 py-1 text-xs font-semibold text-yellow-300">
              <span className="size-1.5 rounded-full bg-yellow-400" />
              Administration workspace
            </span>
            <h1 className="mt-7 text-4xl font-bold leading-tight tracking-[-0.04em] text-white xl:text-5xl">
              Keep your social platform safe, active, and growing.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-400">
              A focused control center for user management, content moderation,
              reports, settings, localization, and coin operations.
            </p>

            <div className="mt-10 grid gap-4">
              {highlights.map(({ icon: Icon, title, description }) => (
                <div
                  className="flex gap-4 rounded-2xl border border-white/5 bg-white/[0.025] p-4"
                  key={title}
                >
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-800 text-yellow-300">
                    <Icon aria-hidden="true" className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
                    <p className="mt-1 text-sm leading-5 text-slate-400">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="relative z-10 text-xs text-slate-500">
            Restricted access · Authorized administrators only
          </p>
        </section>

        <section className="flex min-h-screen items-center justify-center px-5 py-8 sm:px-8 lg:px-12">
          <div className="w-full max-w-md">
            <div className="mb-10 lg:hidden">
              <Logo />
            </div>
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
