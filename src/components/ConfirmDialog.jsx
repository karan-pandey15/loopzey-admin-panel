import { AlertTriangle, LoaderCircle, X } from 'lucide-react';

export default function ConfirmDialog({
  children,
  confirmLabel = 'Confirm',
  description,
  isLoading,
  onClose,
  onConfirm,
  open,
  title,
  tone = 'danger',
}) {
  if (!open) {
    return null;
  }

  const isDanger = tone === 'danger';

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto p-3 sm:p-4">
      <button
        aria-label="Close dialog"
        className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm"
        onClick={isLoading ? undefined : onClose}
        type="button"
      />
      <section
        aria-modal="true"
        className="relative my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6"
        role="dialog"
      >
        <button
          aria-label="Close dialog"
          className="absolute right-3 top-3 grid size-11 place-items-center rounded-xl text-slate-400 hover:bg-slate-100"
          disabled={isLoading}
          onClick={onClose}
          type="button"
        >
          <X className="size-4" />
        </button>
        <div
          className={`grid size-11 place-items-center rounded-xl ${
            isDanger ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-700'
          }`}
        >
          <AlertTriangle className="size-5" />
        </div>
        <h2 className="mt-4 text-lg font-bold text-slate-950">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
        {children && <div className="mt-4">{children}</div>}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700"
            disabled={isLoading}
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-white ${
              isDanger ? 'bg-red-600 hover:bg-red-500' : 'bg-slate-900 hover:bg-slate-800'
            }`}
            disabled={isLoading}
            onClick={onConfirm}
            type="button"
          >
            {isLoading && <LoaderCircle className="size-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
