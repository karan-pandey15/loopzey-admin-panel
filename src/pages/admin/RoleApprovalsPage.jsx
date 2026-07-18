import { useState } from 'react';
import { Check, LoaderCircle, X } from 'lucide-react';
import { getRoleApprovals, updateRoleApproval } from '../../api/admin';
import { EmptyState, ErrorState, LoadingState } from '../../components/AsyncState';
import DynamicTable from '../../components/DynamicTable';
import PageHeader from '../../components/PageHeader';
import useAuth from '../../hooks/useAuth';
import useAsyncData from '../../hooks/useAsyncData';

const PAGE_SIZE = 10;

export default function RoleApprovalsPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [approvalStatus, setApprovalStatus] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const { data, error, isLoading, reload } = useAsyncData(
    () =>
      getRoleApprovals({
        PageNumber: page,
        PageSize: PAGE_SIZE,
        Status: status || undefined,
      }),
    [page, status],
  );

  const approvals = Array.isArray(data) ? data : [];

  async function submitDecision(event) {
    event.preventDefault();

    if (!selectedApproval?.approvalId) {
      return;
    }

    setIsUpdating(true);
    setActionMessage('');

    try {
      await updateRoleApproval(selectedApproval.approvalId, {
        approvalId: selectedApproval.approvalId,
        approvalStatus,
        approvedBy: user.UserId,
        rejectionReason: rejectionReason || undefined,
      });
      setSelectedApproval(null);
      setApprovalStatus('');
      setRejectionReason('');
      setActionMessage('Role approval updated successfully.');
      await reload();
    } catch (requestError) {
      setActionMessage(
        requestError.response?.status
          ? `Update failed with status ${requestError.response.status}.`
          : 'Unable to update this request.',
      );
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        description="Review requests for elevated platform roles."
        eyebrow="User management"
        title="Role approvals"
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <label className="block max-w-xs">
          <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
            Status
          </span>
          <input
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-yellow-500 focus:ring-4 focus:ring-yellow-400/10"
            onChange={(event) => {
              setPage(1);
              setStatus(event.target.value);
            }}
            placeholder="Filter by status"
            value={status}
          />
        </label>
      </div>

      {actionMessage && (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
          {actionMessage}
        </div>
      )}

      {isLoading && <LoadingState label="Loading approval requests…" />}
      {!isLoading && error && <ErrorState message={error} onRetry={reload} />}
      {!isLoading && !error && approvals.length === 0 && (
        <EmptyState
          description="No role requests match the current status."
          title="Approval queue is empty"
        />
      )}
      {!isLoading && !error && approvals.length > 0 && (
        <>
          <DynamicTable
            extraColumns={[
              {
                key: 'actions',
                label: 'Actions',
                render: (approval) => (
                  <button
                    className="inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-40"
                    disabled={!approval.approvalId}
                    onClick={() => setSelectedApproval(approval)}
                    type="button"
                  >
                    <Check className="size-3.5" />
                    Review
                  </button>
                ),
              },
            ]}
            rows={approvals}
          />
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Page {page}</p>
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
                disabled={approvals.length < PAGE_SIZE}
                onClick={() => setPage((current) => current + 1)}
                type="button"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {selectedApproval && (
        <div className="fixed inset-0 z-[70] grid place-items-center p-4">
          <button
            aria-label="Close approval dialog"
            className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm"
            onClick={() => setSelectedApproval(null)}
            type="button"
          />
          <form
            className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onSubmit={submitDecision}
          >
            <button
              aria-label="Close approval dialog"
              className="absolute right-4 top-4 grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100"
              onClick={() => setSelectedApproval(null)}
              type="button"
            >
              <X className="size-4" />
            </button>
            <h2 className="text-lg font-bold text-slate-950">Review role request</h2>
            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Approval status
              </span>
              <input
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-yellow-500"
                onChange={(event) => setApprovalStatus(event.target.value)}
                placeholder="Enter the API-supported status"
                required
                value={approvalStatus}
              />
            </label>
            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Rejection reason
              </span>
              <textarea
                className="min-h-24 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-yellow-500"
                onChange={(event) => setRejectionReason(event.target.value)}
                placeholder="Optional"
                value={rejectionReason}
              />
            </label>
            <button
              className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-sm font-semibold text-white"
              disabled={isUpdating}
              type="submit"
            >
              {isUpdating && <LoaderCircle className="size-4 animate-spin" />}
              Save decision
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
