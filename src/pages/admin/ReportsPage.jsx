import { useState } from 'react';
import { CheckCircle2, Filter, LoaderCircle, X } from 'lucide-react';
import { getReports, resolveReport } from '../../api/admin';
import { EmptyState, ErrorState, LoadingState } from '../../components/AsyncState';
import DynamicTable from '../../components/DynamicTable';
import PageHeader from '../../components/PageHeader';
import useAsyncData from '../../hooks/useAsyncData';

const DEFAULT_PAGE_SIZE = 10;

export default function ReportsPage() {
  const [PageNumber, setPageNumber] = useState(1);
  const [PageSize] = useState(DEFAULT_PAGE_SIZE);
  const [statusInput, setStatusInput] = useState('');
  const [Status, setStatus] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [resolution, setResolution] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const { data, error, isLoading, reload } = useAsyncData(
    () =>
      getReports({
        PageNumber,
        PageSize,
        Status: Status || undefined,
      }),
    [PageNumber, PageSize, Status],
  );

  const reports = Array.isArray(data) ? data : [];

  function search(event) {
    event.preventDefault();
    setPageNumber(1);
    setStatus(statusInput.trim());
  }

  async function submitResolution(event) {
    event.preventDefault();

    if (!selectedReport?.reportId) {
      return;
    }

    setIsResolving(true);
    setActionMessage('');

    try {
      await resolveReport(selectedReport.reportId, { resolution });
      setSelectedReport(null);
      setResolution('');
      setActionMessage('Report resolved successfully.');
      await reload();
    } catch (requestError) {
      setActionMessage(
        requestError.response?.status
          ? `Resolve failed with status ${requestError.response.status}.`
          : 'Unable to resolve this report.',
      );
    } finally {
      setIsResolving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        description="Review community reports and their current resolution status."
        eyebrow="Content moderation"
        title="Reports"
      />

      <form
        className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row"
        onSubmit={search}
      >
        <label className="relative flex-1">
          <span className="sr-only">Report status</span>
          <Filter className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:border-yellow-500 focus:ring-4 focus:ring-yellow-400/10"
            onChange={(event) => setStatusInput(event.target.value)}
            placeholder="Filter by status, for example Pending"
            value={statusInput}
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

      {isLoading && <LoadingState label="Loading reports…" />}
      {!isLoading && error && <ErrorState message={error} onRetry={reload} />}
      {!isLoading && !error && reports.length === 0 && (
        <EmptyState
          description="There are no reports matching the selected status."
          title="No reports found"
        />
      )}
      {!isLoading && !error && reports.length > 0 && (
        <>
          <DynamicTable
            extraColumns={[
              {
                key: 'actions',
                label: 'Actions',
                render: (report) => (
                  <button
                    className="inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-40"
                    disabled={!report.reportId}
                    onClick={() => setSelectedReport(report)}
                    type="button"
                  >
                    <CheckCircle2 className="size-3.5" />
                    Resolve
                  </button>
                ),
              },
            ]}
            rows={reports}
          />
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Page {PageNumber}</p>
            <div className="flex gap-2">
              <button
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-40"
                disabled={PageNumber === 1}
                onClick={() => setPageNumber((current) => current - 1)}
                type="button"
              >
                Previous
              </button>
              <button
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-40"
                disabled={reports.length < PageSize}
                onClick={() => setPageNumber((current) => current + 1)}
                type="button"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {selectedReport && (
        <div className="fixed inset-0 z-[70] grid place-items-center p-4">
          <button
            aria-label="Close resolution dialog"
            className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm"
            onClick={() => setSelectedReport(null)}
            type="button"
          />
          <form
            className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onSubmit={submitResolution}
          >
            <button
              aria-label="Close resolution dialog"
              className="absolute right-4 top-4 grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100"
              onClick={() => setSelectedReport(null)}
              type="button"
            >
              <X className="size-4" />
            </button>
            <h2 className="text-lg font-bold text-slate-950">Resolve report</h2>
            <p className="mt-2 text-sm text-slate-500">
              Record the moderation outcome for report #{selectedReport.reportId}.
            </p>
            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Resolution
              </span>
              <textarea
                className="min-h-28 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-yellow-500"
                onChange={(event) => setResolution(event.target.value)}
                required
                value={resolution}
              />
            </label>
            <button
              className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-sm font-semibold text-white"
              disabled={isResolving}
              type="submit"
            >
              {isResolving && <LoaderCircle className="size-4 animate-spin" />}
              Resolve report
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
