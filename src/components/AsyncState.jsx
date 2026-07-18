import { AlertTriangle, Inbox, LoaderCircle, RefreshCw } from 'lucide-react';

export function LoadingState({ label = 'Loading data…' }) {
  return (
    <div className="grid min-h-64 place-items-center rounded-2xl border border-slate-200 bg-white p-8">
      <div className="text-center">
        <LoaderCircle className="mx-auto size-7 animate-spin text-yellow-500" />
        <p className="mt-3 text-sm font-medium text-slate-500">{label}</p>
      </div>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="grid min-h-64 place-items-center rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
      <div>
        <AlertTriangle className="mx-auto size-8 text-red-500" />
        <h2 className="mt-3 font-semibold text-slate-900">Could not load this page</h2>
        <p className="mt-1 text-sm text-slate-600">{message}</p>
        {onRetry && (
          <button
            className="mx-auto mt-5 flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            onClick={onRetry}
            type="button"
          >
            <RefreshCw className="size-4" />
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

export function EmptyState({
  description = 'No records match the current filters.',
  title = 'Nothing to show',
}) {
  return (
    <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
      <div>
        <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-500">
          <Inbox className="size-6" />
        </div>
        <h2 className="mt-4 font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
      </div>
    </div>
  );
}
