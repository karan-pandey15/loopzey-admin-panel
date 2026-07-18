import { useState } from 'react';
import { Eye, Heart, MessageCircle, Search, Trash2 } from 'lucide-react';
import {
  deletePost,
  deleteReel,
  getPosts,
  getReels,
} from '../../api/admin';
import { EmptyState, ErrorState, LoadingState } from '../../components/AsyncState';
import ConfirmDialog from '../../components/ConfirmDialog';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import useAsyncData from '../../hooks/useAsyncData';

const PAGE_SIZE = 10;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.sellifyy.com';

function assetUrl(path) {
  if (!path || path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  return `${API_BASE_URL}/${path.replace(/^\/+/, '')}`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
  }).format(new Date(value));
}

export default function ContentPage({ type }) {
  const isReels = type === 'reels';
  const [page, setPage] = useState(1);
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const { data, error, isLoading, reload } = useAsyncData(
    () =>
      (isReels ? getReels : getPosts)({
        PageNumber: page,
        PageSize: PAGE_SIZE,
        SearchQuery: search || undefined,
      }),
    [isReels, page, search],
  );

  const rows = Array.isArray(data) ? data : [];
  const totalCount = rows[0]?.totalCount || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const idKey = isReels ? 'reelId' : 'postId';

  function submitSearch(event) {
    event.preventDefault();
    setPage(1);
    setSearch(searchDraft.trim());
  }

  async function removeContent() {
    if (!selectedItem) {
      return;
    }

    setIsDeleting(true);
    setActionMessage('');

    try {
      if (isReels) {
        await deleteReel(selectedItem.reelId);
      } else {
        await deletePost(selectedItem.postId);
      }

      setSelectedItem(null);
      setActionMessage(`${isReels ? 'Reel' : 'Post'} deleted successfully.`);
      await reload();
    } catch (requestError) {
      setActionMessage(
        requestError.response?.status
          ? `Delete failed with status ${requestError.response.status}.`
          : `Unable to delete this ${isReels ? 'reel' : 'post'}.`,
      );
    } finally {
      setIsDeleting(false);
    }
  }

  const columns = [
    {
      key: 'content',
      label: isReels ? 'Reel' : 'Post',
      render: (item) => (
        <div className="flex min-w-0 items-center gap-2 md:min-w-64 md:gap-3">
          <div className="size-12 shrink-0 overflow-hidden rounded-xl bg-slate-100">
            {item.thumbnailUrl || item.mediaUrl ? (
              <img
                alt=""
                className="size-full object-cover"
                src={assetUrl(item.thumbnailUrl || item.mediaUrl)}
              />
            ) : null}
          </div>
          <div className="min-w-0">
            <p className="line-clamp-1 font-semibold text-slate-900">
              {item.caption || 'Untitled content'}
            </p>
            <p className="mt-1 text-xs text-slate-500">@{item.username}</p>
          </div>
        </div>
      ),
    },
    { key: 'visibility', label: 'Visibility' },
    {
      key: 'engagement',
      label: 'Engagement',
      render: (item) => (
        <div className="flex flex-wrap items-center justify-end gap-2 text-xs text-slate-500 md:justify-start md:gap-3 md:whitespace-nowrap">
          <span className="inline-flex items-center gap-1">
            <Eye className="size-3.5" /> {item.views}
          </span>
          <span className="inline-flex items-center gap-1">
            <Heart className="size-3.5" /> {item.likes}
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="size-3.5" /> {item.comments}
          </span>
        </div>
      ),
    },
    ...(isReels ? [{ key: 'audioName', label: 'Audio' }] : [{ key: 'mediaType', label: 'Media' }]),
    {
      key: 'createdAt',
      label: 'Published',
      render: (item) => <span className="whitespace-nowrap">{formatDate(item.createdAt)}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item) => (
        <button
          className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
          onClick={() => setSelectedItem(item)}
          type="button"
        >
          <Trash2 className="size-3.5" />
          Delete
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        description={`Review and moderate published ${type}.`}
        eyebrow="Content management"
        title={isReels ? 'Reels' : 'Posts'}
      />

      <form
        className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row"
        onSubmit={submitSearch}
      >
        <label className="relative flex-1">
          <span className="sr-only">Search {type}</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:border-yellow-500 focus:ring-4 focus:ring-yellow-400/10"
            onChange={(event) => setSearchDraft(event.target.value)}
            placeholder={`Search ${type} by caption or user`}
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

      {isLoading && <LoadingState label={`Loading ${type}…`} />}
      {!isLoading && error && <ErrorState message={error} onRetry={reload} />}
      {!isLoading && !error && rows.length === 0 && (
        <EmptyState title={`No ${type} found`} />
      )}
      {!isLoading && !error && rows.length > 0 && (
        <>
          <DataTable columns={columns} getRowKey={(item) => item[idKey]} rows={rows} />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Page {page} of {totalPages} · {totalCount} {type}
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

      <ConfirmDialog
        confirmLabel={`Delete ${isReels ? 'reel' : 'post'}`}
        description={`This permanently removes the selected ${isReels ? 'reel' : 'post'} from the platform.`}
        isLoading={isDeleting}
        onClose={() => setSelectedItem(null)}
        onConfirm={removeContent}
        open={Boolean(selectedItem)}
        title={`Delete this ${isReels ? 'reel' : 'post'}?`}
      />
    </div>
  );
}
