import { useState } from 'react';
import {
  CheckCircle2,
  Clock3,
  Mail,
  MessageSquareText,
  Search,
  ShieldCheck,
  UserRound,
  XCircle,
} from 'lucide-react';
import { getPendingApprovals, updateApproval } from '../../api/auth';
import { EmptyState, ErrorState, LoadingState } from '../../components/AsyncState';
import ConfirmDialog from '../../components/ConfirmDialog';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import useAuth from '../../hooks/useAuth';
import useAsyncData from '../../hooks/useAsyncData';

function formatDate(value) {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function RoleApprovalsPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [decision, setDecision] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [decisionError, setDecisionError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const { data, error, isLoading, reload } = useAsyncData(getPendingApprovals, []);

  const approvals = Array.isArray(data) ? data : [];
  const query = search.trim().toLowerCase();
  const filteredApprovals = approvals.filter(
    (approval) =>
      !query ||
      approval.username?.toLowerCase().includes(query) ||
      approval.email?.toLowerCase().includes(query) ||
      approval.roleName?.toLowerCase().includes(query) ||
      approval.requestMessage?.toLowerCase().includes(query),
  );

  function openDecision(approval, type) {
    setDecision({ approval, type });
    setRejectionReason('');
    setDecisionError('');
    setActionMessage('');
  }

  async function submitDecision() {
    if (!decision) {
      return;
    }

    if (!rejectionReason.trim()) {
      setDecisionError(
        decision.type === 'approve'
          ? 'An approval remark is required.'
          : 'A rejection reason is required.',
      );
      return;
    }

    setIsUpdating(true);
    setDecisionError('');

    try {
      await updateApproval({
        approvalId: decision.approval.approvalId,
        approvalStatus: decision.type === 'approve' ? 'Approved' : 'Rejected',
        approvedBy: user.UserId,
        rejectionReason: rejectionReason.trim(),
      });
      setActionMessage(
        `@${decision.approval.username} was ${
          decision.type === 'approve' ? 'approved' : 'rejected'
        } successfully.`,
      );
      setDecision(null);
      setRejectionReason('');
      await reload();
    } catch (requestError) {
      setDecisionError(
        requestError.response?.status
          ? `Update failed with status ${requestError.response.status}.`
          : 'Unable to update this approval request.',
      );
    } finally {
      setIsUpdating(false);
    }
  }

  const columns = [
    {
      key: 'user',
      label: 'User',
      render: (approval) => (
        <div className="flex min-w-0 items-center gap-3 md:min-w-56">
          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-400/10 dark:text-blue-300">
            <UserRound className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900">
              @{approval.username}
            </p>
            <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-500">
              <Mail className="size-3 shrink-0" />
              {approval.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'roleName',
      label: 'Requested role',
      render: (approval) => (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-700 dark:bg-violet-400/10 dark:text-violet-300">
          <ShieldCheck className="size-3.5" />
          {approval.roleName}
        </span>
      ),
    },
    {
      key: 'requestMessage',
      label: 'Request message',
      render: (approval) => (
        <div className="flex max-w-sm items-start gap-2">
          <MessageSquareText className="mt-0.5 size-4 shrink-0 text-slate-400" />
          <p className="line-clamp-3 text-sm leading-5 text-slate-600">
            {approval.requestMessage || 'No message provided.'}
          </p>
        </div>
      ),
    },
    {
      key: 'approvalStatus',
      label: 'Status',
      render: (approval) => (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">
          <Clock3 className="size-3.5" />
          {approval.approvalStatus}
        </span>
      ),
    },
    {
      key: 'createdDate',
      label: 'Requested',
      render: (approval) => (
        <span className="text-xs text-slate-500">
          {formatDate(approval.createdDate)}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (approval) => (
        <div className="flex flex-wrap justify-end gap-2 md:justify-start">
          <button
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 dark:bg-emerald-400/10 dark:text-emerald-300 dark:hover:bg-emerald-400/20"
            onClick={() => openDecision(approval, 'approve')}
            title="Approve role request"
            type="button"
          >
            <CheckCircle2 className="size-4" />
            Approve
          </button>
          <button
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100 dark:bg-red-400/10 dark:text-red-300 dark:hover:bg-red-400/20"
            onClick={() => openDecision(approval, 'reject')}
            title="Reject role request"
            type="button"
          >
            <XCircle className="size-4" />
            Reject
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        action={
          <div className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            <Clock3 className="size-4 text-amber-500" />
            {approvals.length} pending
          </div>
        }
        description="Review role elevation requests, applicant remarks, and account details."
        eyebrow="User management"
        title="Role approvals"
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <label className="relative block">
          <span className="sr-only">Search approval requests</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-yellow-500 focus:ring-4 focus:ring-yellow-400/10 dark:border-slate-700 dark:bg-slate-950"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by username, email, role, or request message"
            value={search}
          />
        </label>
      </section>

      {actionMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
          <CheckCircle2 className="size-4 shrink-0" />
          {actionMessage}
        </div>
      )}

      {isLoading && <LoadingState label="Loading pending approval requests…" />}
      {!isLoading && error && <ErrorState message={error} onRetry={reload} />}
      {!isLoading && !error && filteredApprovals.length === 0 && (
        <EmptyState
          description={
            approvals.length
              ? 'No approval requests match your search.'
              : 'There are currently no pending role requests.'
          }
          title={approvals.length ? 'No matching requests' : 'Approval queue is clear'}
        />
      )}
      {!isLoading && !error && filteredApprovals.length > 0 && (
        <DataTable
          columns={columns}
          getRowKey={(approval) => approval.approvalId}
          rows={filteredApprovals}
        />
      )}

      <ConfirmDialog
        confirmLabel={decision?.type === 'approve' ? 'Approve request' : 'Reject request'}
        description={
          decision
            ? `${decision.type === 'approve' ? 'Approve' : 'Reject'} @${decision.approval.username}'s request for the ${decision.approval.roleName} role?`
            : ''
        }
        isLoading={isUpdating}
        onClose={() => setDecision(null)}
        onConfirm={submitDecision}
        open={Boolean(decision)}
        title={
          decision?.type === 'approve'
            ? 'Approve role request?'
            : 'Reject role request?'
        }
        tone={decision?.type === 'approve' ? 'warning' : 'danger'}
      >
        {decision && (
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              {decision.type === 'approve' ? 'Approval remark' : 'Rejection reason'}
            </span>
            <textarea
              className="min-h-28 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-400/10 dark:border-slate-700"
              onChange={(event) => {
                setRejectionReason(event.target.value);
                setDecisionError('');
              }}
              placeholder={
                decision.type === 'approve'
                  ? 'Add a remark for approving this request'
                  : 'Explain why this request is being rejected'
              }
              required
              value={rejectionReason}
            />
          </label>
        )}
        {decisionError && (
          <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {decisionError}
          </p>
        )}
      </ConfirmDialog>
    </div>
  );
}
