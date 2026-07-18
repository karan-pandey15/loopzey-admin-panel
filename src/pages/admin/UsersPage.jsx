import { useState } from 'react';
import { Ban, Eye, Power, Search, Trash2, UserRound } from 'lucide-react';
import {
  deleteUser,
  getUsers,
  updateUserActive,
  updateUserBan,
} from '../../api/admin';
import { EmptyState, ErrorState, LoadingState } from '../../components/AsyncState';
import ConfirmDialog from '../../components/ConfirmDialog';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import UserDetailsDialog from '../../components/UserDetailsDialog';
import useAsyncData from '../../hooks/useAsyncData';

const PAGE_SIZE = 10;

function formatDate(value) {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
  }).format(new Date(value));
}

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [action, setAction] = useState(null);
  const [reason, setReason] = useState('');
  const [isMutating, setIsMutating] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const { data, error, isLoading, reload } = useAsyncData(
    () =>
      getUsers({
        PageNumber: page,
        PageSize: PAGE_SIZE,
        SearchQuery: search || undefined,
      }),
    [page, search],
  );

  const rows = Array.isArray(data) ? data : [];
  const totalCount = rows[0]?.totalCount || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  function submitSearch(event) {
    event.preventDefault();
    setPage(1);
    setSearch(searchDraft.trim());
  }

  async function confirmAction() {
    if (!action) {
      return;
    }

    setIsMutating(true);
    setActionMessage('');

    try {
      if (action.type === 'delete') {
        await deleteUser(action.user.userId);
      } else if (action.type === 'ban') {
        await updateUserBan(action.user.userId, {
          isBanned: !action.user.isBanned,
          reason: action.user.isBanned ? undefined : reason || undefined,
        });
      } else {
        await updateUserActive(action.user.userId, {
          isActive: !action.user.isActive,
        });
      }

      setActionMessage('User account updated successfully.');
      setAction(null);
      setReason('');
      await reload();
    } catch (requestError) {
      setActionMessage(
        requestError.response?.status
          ? `Action failed with status ${requestError.response.status}.`
          : 'Unable to update this user.',
      );
    } finally {
      setIsMutating(false);
    }
  }

  const columns = [
    {
      key: 'user',
      label: 'User',
      render: (user) => (
        <div className="flex min-w-56 items-center gap-3">
          <div className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-slate-100 text-slate-500">
            {user.profileImageUrl ? (
              <img
                alt=""
                className="size-full object-cover"
                src={user.profileImageUrl}
              />
            ) : (
              <UserRound className="size-5" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900">
              {user.fullName || user.username}
            </p>
            <p className="truncate text-xs text-slate-500">@{user.username}</p>
          </div>
        </div>
      ),
    },
    { key: 'email', label: 'Email' },
    {
      key: 'content',
      label: 'Content',
      render: (user) => (
        <span className="whitespace-nowrap text-xs text-slate-600">
          {user.postsCount} posts · {user.reelsCount} reels
        </span>
      ),
    },
    { key: 'followersCount', label: 'Followers' },
    {
      key: 'status',
      label: 'Status',
      render: (user) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
            user.isBanned
              ? 'bg-red-50 text-red-700'
              : user.isActive
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-slate-100 text-slate-600'
          }`}
        >
          {user.isBanned ? 'Banned' : user.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'createdDate',
      label: 'Joined',
      render: (user) => <span className="whitespace-nowrap">{formatDate(user.createdDate)}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (user) => (
        <div className="flex justify-end gap-1 md:justify-start">
          <button
            aria-label={`View ${user.username}`}
            className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-blue-50 hover:text-blue-600"
            onClick={() => setSelectedUserId(user.userId)}
            title="View profile, followers, and following"
            type="button"
          >
            <Eye className="size-4" />
          </button>
          <button
            aria-label={user.isActive ? `Deactivate ${user.username}` : `Activate ${user.username}`}
            className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-amber-50 hover:text-amber-700"
            onClick={() => setAction({ type: 'active', user })}
            title={user.isActive ? 'Deactivate user' : 'Activate user'}
            type="button"
          >
            <Power className="size-4" />
          </button>
          <button
            aria-label={user.isBanned ? `Unban ${user.username}` : `Ban ${user.username}`}
            className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-orange-50 hover:text-orange-700"
            onClick={() => setAction({ type: 'ban', user })}
            title={user.isBanned ? 'Unban user' : 'Ban user'}
            type="button"
          >
            <Ban className="size-4" />
          </button>
          <button
            aria-label={`Delete ${user.username}`}
            className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"
            onClick={() => setAction({ type: 'delete', user })}
            title="Delete user"
            type="button"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        description="Search and review registered platform accounts."
        eyebrow="User management"
        title="All users"
      />

      <form
        className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row"
        onSubmit={submitSearch}
      >
        <label className="relative flex-1">
          <span className="sr-only">Search users</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:border-yellow-500 focus:ring-4 focus:ring-yellow-400/10"
            onChange={(event) => setSearchDraft(event.target.value)}
            placeholder="Search username, email, or name"
            value={searchDraft}
          />
        </label>
        <button
          className="h-11 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800"
          type="submit"
        >
          Search
        </button>
      </form>

      {actionMessage && (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
          {actionMessage}
        </div>
      )}

      {isLoading && <LoadingState label="Loading users…" />}
      {!isLoading && error && <ErrorState message={error} onRetry={reload} />}
      {!isLoading && !error && rows.length === 0 && (
        <EmptyState description="No users match the current search." title="No users found" />
      )}
      {!isLoading && !error && rows.length > 0 && (
        <>
          <DataTable columns={columns} getRowKey={(user) => user.userId} rows={rows} />
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Page {page} of {totalPages} · {totalCount} users
            </p>
            <div className="flex gap-2">
              <button
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-40"
                disabled={page === 1}
                onClick={() => setPage((current) => current - 1)}
                type="button"
              >
                Previous
              </button>
              <button
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-40"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => current + 1)}
                type="button"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      <UserDetailsDialog
        onClose={() => setSelectedUserId(null)}
        userId={selectedUserId}
      />
      <ConfirmDialog
        confirmLabel={
          action?.type === 'delete'
            ? 'Delete user'
            : action?.type === 'ban'
              ? action.user.isBanned
                ? 'Unban user'
                : 'Ban user'
              : action?.user.isActive
                ? 'Deactivate'
                : 'Activate'
        }
        description={
          action?.type === 'delete'
            ? `This permanently deletes @${action.user.username}.`
            : `This changes access for @${action?.user.username}.`
        }
        isLoading={isMutating}
        onClose={() => {
          setAction(null);
          setReason('');
        }}
        onConfirm={confirmAction}
        open={Boolean(action)}
        title={
          action?.type === 'delete'
            ? 'Delete user account?'
            : action?.type === 'ban'
              ? action.user.isBanned
                ? 'Unban this user?'
                : 'Ban this user?'
              : 'Change account status?'
        }
        tone={action?.type === 'active' ? 'warning' : 'danger'}
      >
        {action?.type === 'ban' && !action.user.isBanned && (
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Ban reason
            </span>
            <textarea
              className="min-h-24 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-yellow-500"
              onChange={(event) => setReason(event.target.value)}
              placeholder="Optional reason"
              value={reason}
            />
          </label>
        )}
      </ConfirmDialog>
    </div>
  );
}
