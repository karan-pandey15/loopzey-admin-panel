import { useEffect, useState } from 'react';
import { LoaderCircle, X } from 'lucide-react';
import { getUser, getUserFollowers, getUserFollowing } from '../api/admin';
import DynamicTable from './DynamicTable';

function ValueList({ value }) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return <p className="text-sm text-slate-600">{String(value ?? '—')}</p>;
  }

  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {Object.entries(value).map(([key, item]) => (
        <div className="rounded-xl bg-slate-50 p-3" key={key}>
          <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            {key}
          </dt>
          <dd className="mt-1 break-words text-sm text-slate-700">
            {typeof item === 'object' ? JSON.stringify(item) : String(item ?? '—')}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export default function UserDetailsDialog({ onClose, userId }) {
  const [state, setState] = useState({
    details: null,
    followers: [],
    following: [],
    error: '',
    loading: true,
  });

  useEffect(() => {
    if (!userId) {
      return;
    }

    let isCurrent = true;

    async function load() {
      setState((current) => ({ ...current, error: '', loading: true }));

      try {
        const [details, followers, following] = await Promise.all([
          getUser(userId),
          getUserFollowers(userId, { pageNumber: 1, pageSize: 20 }),
          getUserFollowing(userId, { pageNumber: 1, pageSize: 20 }),
        ]);

        if (isCurrent) {
          setState({
            details: details.data.data,
            followers: Array.isArray(followers.data.data) ? followers.data.data : [],
            following: Array.isArray(following.data.data) ? following.data.data : [],
            error: '',
            loading: false,
          });
        }
      } catch (error) {
        if (isCurrent) {
          setState((current) => ({
            ...current,
            error: error.response?.status
              ? `Request failed with status ${error.response.status}.`
              : 'Unable to load this user.',
            loading: false,
          }));
        }
      }
    }

    load();
    return () => {
      isCurrent = false;
    };
  }, [userId]);

  if (!userId) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] flex justify-end">
      <button
        aria-label="Close user details"
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        onClick={onClose}
        type="button"
      />
      <aside className="relative h-full w-full max-w-2xl overflow-y-auto bg-white p-5 shadow-2xl sm:p-7">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-yellow-600">
              User management
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">User details</h2>
          </div>
          <button
            aria-label="Close user details"
            className="grid size-9 place-items-center rounded-xl border border-slate-200 text-slate-500"
            onClick={onClose}
            type="button"
          >
            <X className="size-4" />
          </button>
        </div>

        {state.loading && (
          <div className="grid min-h-80 place-items-center">
            <LoaderCircle className="size-7 animate-spin text-yellow-500" />
          </div>
        )}
        {!state.loading && state.error && (
          <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">{state.error}</div>
        )}
        {!state.loading && !state.error && (
          <div className="mt-6 space-y-7">
            <section>
              <h3 className="mb-3 font-bold text-slate-900">Profile</h3>
              <ValueList value={state.details} />
            </section>
            <section>
              <h3 className="mb-3 font-bold text-slate-900">
                Followers ({state.followers.length})
              </h3>
              {state.followers.length ? (
                <DynamicTable rows={state.followers} />
              ) : (
                <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                  No followers found.
                </p>
              )}
            </section>
            <section>
              <h3 className="mb-3 font-bold text-slate-900">
                Following ({state.following.length})
              </h3>
              {state.following.length ? (
                <DynamicTable rows={state.following} />
              ) : (
                <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                  Not following any users.
                </p>
              )}
            </section>
          </div>
        )}
      </aside>
    </div>
  );
}
