import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  CircleDollarSign,
  FileWarning,
  Languages,
  MessageSquareText,
  Newspaper,
  PlaySquare,
  Settings,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
} from 'lucide-react';
import { getDashboardStats } from '../../api/admin';
import { EmptyState, ErrorState, LoadingState } from '../../components/AsyncState';
import PageHeader from '../../components/PageHeader';
import useAsyncData from '../../hooks/useAsyncData';

const statCards = [
  {
    key: 'totalUsers',
    label: 'Total users',
    description: 'Registered accounts',
    icon: Users,
    color: 'blue',
    to: '/users',
  },
  {
    key: 'totalPosts',
    label: 'Published posts',
    description: 'Platform posts',
    icon: Newspaper,
    color: 'violet',
    to: '/posts',
  },
  {
    key: 'totalReels',
    label: 'Published reels',
    description: 'Short-form videos',
    icon: PlaySquare,
    color: 'pink',
    to: '/reels',
  },
  {
    key: 'activeUsersToday',
    label: 'Active today',
    description: 'Daily active users',
    icon: UserPlus,
    color: 'emerald',
    to: '/users',
  },
  {
    key: 'pendingApprovals',
    label: 'Pending approvals',
    description: 'Role requests',
    icon: ShieldCheck,
    color: 'amber',
    to: '/role-approvals',
  },
  {
    key: 'totalReports',
    label: 'Open reports',
    description: 'Moderation queue',
    icon: FileWarning,
    color: 'red',
    to: '/reports',
  },
];

const modules = [
  {
    title: 'User administration',
    description: 'Accounts, access status, bans, followers, and role approvals.',
    icon: Users,
    color: 'blue',
    operations: 9,
    links: [
      { label: 'Manage users', to: '/users' },
      { label: 'Role approvals', to: '/role-approvals' },
    ],
  },
  {
    title: 'Content moderation',
    description: 'Review posts, reels, reports, and removal workflows.',
    icon: Newspaper,
    color: 'pink',
    operations: 6,
    links: [
      { label: 'Posts', to: '/posts' },
      { label: 'Reels', to: '/reels' },
      { label: 'Reports', to: '/reports' },
    ],
  },
  {
    title: 'Localization',
    description: 'Languages, translations, missing keys, imports, and exports.',
    icon: Languages,
    color: 'violet',
    operations: 11,
    links: [
      { label: 'Languages', to: '/languages' },
      { label: 'Translations', to: '/translations' },
    ],
  },
  {
    title: 'Coin and KYC operations',
    description: 'Wallet summaries, bucket balance, transactions, and KYC reviews.',
    icon: CircleDollarSign,
    color: 'emerald',
    operations: 6,
    links: [{ label: 'Coin operations', to: '/coins' }],
  },
  {
    title: 'Platform configuration',
    description: 'Runtime settings, feature switches, values, and change history.',
    icon: Settings,
    color: 'amber',
    operations: 3,
    links: [{ label: 'System settings', to: '/settings' }],
  },
];

const colorClasses = {
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300',
  blue: 'bg-blue-50 text-blue-600 dark:bg-blue-400/10 dark:text-blue-300',
  emerald:
    'bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300',
  pink: 'bg-pink-50 text-pink-600 dark:bg-pink-400/10 dark:text-pink-300',
  red: 'bg-red-50 text-red-600 dark:bg-red-400/10 dark:text-red-300',
  violet: 'bg-violet-50 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300',
};

export default function DashboardPage() {
  const { data, error, isLoading, reload } = useAsyncData(getDashboardStats, []);

  return (
    <div className="space-y-7">
      <PageHeader
        action={
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            <Sparkles className="size-3.5 text-yellow-500" />
            36 admin API operations connected
          </div>
        }
        description="A live command center for users, content, moderation, localization, coins, and platform settings."
        eyebrow="Overview"
        title="Dashboard"
      />

      {isLoading && <LoadingState label="Loading platform overview…" />}
      {!isLoading && error && <ErrorState message={error} onRetry={reload} />}
      {!isLoading && !error && !data && <EmptyState />}

      {!isLoading && !error && data && (
        <>
          <section aria-label="Platform statistics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {statCards.map(({ color, description, icon: Icon, key, label, to }) => (
              <Link
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40 transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:shadow-none dark:hover:border-slate-700"
                key={key}
                to={to}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{label}</p>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                      {data[key].toLocaleString()}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">{description}</p>
                  </div>
                  <div
                    className={`grid size-11 shrink-0 place-items-center rounded-xl ${colorClasses[color]}`}
                  >
                    <Icon className="size-5" />
                  </div>
                </div>
                <ArrowUpRight className="absolute bottom-4 right-4 size-4 text-slate-300 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
              </Link>
            ))}
          </section>

          <section className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
            <article className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-bold text-slate-900">Today at a glance</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Registration and activity from the live dashboard endpoint.
                  </p>
                </div>
                <div className="grid size-10 place-items-center rounded-xl bg-yellow-50 text-yellow-600 dark:bg-yellow-400/10 dark:text-yellow-300">
                  <UserPlus className="size-5" />
                </div>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Link
                  className="group rounded-xl border border-slate-100 bg-slate-50 p-4 transition hover:border-yellow-300 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-yellow-500/50"
                  to="/users"
                >
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    New users today
                  </p>
                  <div className="mt-2 flex items-end justify-between">
                    <p className="text-2xl font-bold text-slate-900">
                      {data.newUsersToday.toLocaleString()}
                    </p>
                    <ArrowRight className="size-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-yellow-500" />
                  </div>
                </Link>
                <Link
                  className="group rounded-xl border border-slate-100 bg-slate-50 p-4 transition hover:border-emerald-300 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-emerald-500/50"
                  to="/users"
                >
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Active users today
                  </p>
                  <div className="mt-2 flex items-end justify-between">
                    <p className="text-2xl font-bold text-slate-900">
                      {data.activeUsersToday.toLocaleString()}
                    </p>
                    <ArrowRight className="size-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-emerald-500" />
                  </div>
                </Link>
              </div>
            </article>

            <article className="relative overflow-hidden rounded-2xl bg-[#071426] p-5 text-white sm:p-6">
              <div className="absolute -right-16 -top-16 size-40 rounded-full bg-yellow-400/10 blur-2xl" />
              <p className="relative text-xs font-bold uppercase tracking-[0.14em] text-yellow-300">
                Moderation health
              </p>
              <h2 className="relative mt-3 text-xl font-bold">Review queue</h2>
              <p className="relative mt-2 text-sm leading-6 text-slate-400">
                Open the moderation queues and keep community reviews moving.
              </p>
              <div className="relative mt-6 grid grid-cols-1 gap-3 min-[380px]:grid-cols-2">
                <Link
                  className="group rounded-xl border border-white/5 bg-white/5 p-3 transition hover:border-yellow-400/30 hover:bg-yellow-400/10"
                  to="/role-approvals"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold">{data.pendingApprovals}</p>
                    <ShieldCheck className="size-4 text-yellow-300" />
                  </div>
                  <p className="mt-1 text-xs text-slate-400 group-hover:text-slate-200">
                    Approvals
                  </p>
                </Link>
                <Link
                  className="group rounded-xl border border-white/5 bg-white/5 p-3 transition hover:border-red-400/30 hover:bg-red-400/10"
                  to="/reports"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold">{data.totalReports}</p>
                    <FileWarning className="size-4 text-red-300" />
                  </div>
                  <p className="mt-1 text-xs text-slate-400 group-hover:text-slate-200">
                    Reports
                  </p>
                </Link>
              </div>
            </article>
          </section>

          <section>
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-950">Administration modules</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Every documented admin API family has a dedicated workspace.
                </p>
              </div>
              <p className="text-xs font-semibold text-slate-400">Click any action to open</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {modules.map(({ color, description, icon: Icon, links, operations, title }) => (
                <article
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                  key={title}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className={`grid size-11 place-items-center rounded-xl ${colorClasses[color]}`}>
                      <Icon className="size-5" />
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      {operations} operations
                    </span>
                  </div>
                  <h3 className="mt-4 font-bold text-slate-950">{title}</h3>
                  <p className="mt-2 min-h-10 text-sm leading-5 text-slate-500">
                    {description}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {links.map((link) => (
                      <Link
                        className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-yellow-400 hover:bg-yellow-50 hover:text-slate-950 dark:border-slate-700 dark:text-slate-300 dark:hover:border-yellow-500/50 dark:hover:bg-yellow-400/10 dark:hover:text-white"
                        key={link.to}
                        to={link.to}
                      >
                        {link.label}
                        <ArrowRight className="size-3.5" />
                      </Link>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <Link
              className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-violet-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-violet-500/40"
              to="/translations"
            >
              <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300">
                  <MessageSquareText className="size-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-950">Translation workspace</h3>
                  <p className="mt-1 text-sm text-slate-500">Keys, values, import, and export</p>
                </div>
              </div>
              <ArrowRight className="size-5 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-violet-500" />
            </Link>
            <Link
              className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-amber-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-amber-500/40"
              to="/settings"
            >
              <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300">
                  <Settings className="size-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-950">System configuration</h3>
                  <p className="mt-1 text-sm text-slate-500">Feature flags and runtime settings</p>
                </div>
              </div>
              <ArrowRight className="size-5 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-amber-500" />
            </Link>
          </section>
        </>
      )}
    </div>
  );
}
