import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  ChevronRight,
  CircleDollarSign,
  FileWarning,
  Languages,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  Moon,
  Newspaper,
  PlaySquare,
  Settings,
  ShieldCheck,
  Sun,
  Users,
  X,
} from 'lucide-react';
import useAuth from '../hooks/useAuth';
import useTheme from '../hooks/useTheme';

const navigation = [
  {
    label: 'Overview',
    items: [{ label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'User management',
    items: [
      { label: 'All users', to: '/users', icon: Users },
      { label: 'Role approvals', to: '/role-approvals', icon: ShieldCheck },
    ],
  },
  {
    label: 'Content management',
    items: [
      { label: 'Posts', to: '/posts', icon: Newspaper },
      { label: 'Reels', to: '/reels', icon: PlaySquare },
      { label: 'Reports', to: '/reports', icon: FileWarning },
    ],
  },
  {
    label: 'Localization',
    items: [
      { label: 'Languages', to: '/languages', icon: Languages },
      { label: 'Translations', to: '/translations', icon: MessageSquareText },
    ],
  },
  {
    label: 'Platform',
    items: [
      { label: 'Coin operations', to: '/coins', icon: CircleDollarSign },
      { label: 'System settings', to: '/settings', icon: Settings },
    ],
  },
];

function Brand() {
  return (
    <div className="flex h-18 items-center gap-3 border-b border-white/5 px-5">
      <div className="grid size-9 place-items-center rounded-xl bg-yellow-400 text-slate-950">
        <Activity className="size-5" strokeWidth={2.5} />
      </div>
      <div>
        <p className="font-bold tracking-tight text-white">Loopzey</p>
        <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-500">
          Admin console
        </p>
      </div>
    </div>
  );
}

function Sidebar({ onClose, responsiveWidth = false }) {
  const navigate = useNavigate();
  const { endSession, user } = useAuth();

  function logout() {
    endSession();
    navigate('/login', { replace: true });
  }

  return (
    <aside
      className={`flex h-full flex-col bg-[#071426] text-slate-300 ${
        responsiveWidth ? 'w-full' : 'w-[calc(100vw-2rem)] max-w-72'
      }`}
    >
      <Brand />
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {navigation.map((group) => (
          <div key={group.label}>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map(({ icon: Icon, label, to }) => (
                <NavLink
                  className={({ isActive }) =>
                    `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      isActive
                        ? 'bg-yellow-400/10 text-yellow-300'
                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    }`
                  }
                  key={to}
                  onClick={onClose}
                  to={to}
                >
                  <Icon className="size-4.5 shrink-0" />
                  <span className="flex-1">{label}</span>
                  <ChevronRight className="size-3.5 opacity-0 transition group-hover:opacity-100" />
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-white/5 p-3">
        <div className="mb-2 flex items-center gap-3 rounded-xl px-3 py-2">
          <div className="grid size-9 place-items-center rounded-full bg-slate-700 text-sm font-bold text-white">
            {(user?.Username || 'A').slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {user?.Username || 'Administrator'}
            </p>
            <p className="truncate text-xs text-slate-500">{user?.Email || ''}</p>
          </div>
        </div>
        <button
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-red-400/10 hover:text-red-300"
          onClick={logout}
          type="button"
        >
          <LogOut className="size-4.5" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

export default function AdminLayout() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 lg:grid lg:grid-cols-[minmax(240px,24%)_minmax(0,1fr)] xl:grid-cols-[288px_minmax(0,1fr)]">
      <div className="sticky top-0 z-30 hidden h-screen min-w-0 lg:block">
        <Sidebar responsiveWidth />
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
            type="button"
          />
          <div className="relative h-full w-[calc(100vw-2rem)] max-w-72 shadow-2xl">
            <Sidebar onClose={() => setIsOpen(false)} />
            <button
              aria-label="Close navigation"
              className="absolute right-2 top-3 grid size-11 place-items-center rounded-xl text-slate-400 hover:bg-white/5 hover:text-white"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>
      )}

      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-3 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90 sm:h-18 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              aria-label="Open navigation"
              className="grid size-11 place-items-center rounded-xl border border-slate-200 text-slate-600 lg:hidden"
              onClick={() => setIsOpen(true)}
              type="button"
            >
              <Menu className="size-5" />
            </button>
            <div>
              <p className="text-sm font-bold text-slate-900">Administration</p>
              <p className="hidden text-xs text-slate-500 sm:block">
                Social platform operations
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="grid size-11 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 dark:text-slate-300"
              onClick={toggleTheme}
              title={isDark ? 'Light mode' : 'Dark mode'}
              type="button"
            >
              {isDark ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
            </button>
            <div className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 sm:flex dark:bg-emerald-400/10 dark:text-emerald-300">
              <span className="size-2 rounded-full bg-emerald-500" />
              API connected
            </div>
          </div>
        </header>

        <main className="w-full min-w-0 p-3 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
