import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Coins,
  HandCoins,
  LoaderCircle,
  Plus,
  RefreshCw,
  ReceiptText,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import {
  addCoinsToBucket,
  getAdminBucketBalance,
  getAdminTransactions,
  getPendingKyc,
  getUsersCoinSummary,
  verifyKyc,
} from '../../api/coin';
import { EmptyState, ErrorState, LoadingState } from '../../components/AsyncState';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import useAuth from '../../hooks/useAuth';
import useAsyncData from '../../hooks/useAsyncData';

const PAGE_SIZE = 10;

function requestErrorMessage(error, fallback) {
  return (
    error.response?.data?.message ||
    error.response?.data?.title ||
    (error.response?.status ? `${fallback} (status ${error.response.status}).` : fallback)
  );
}

function formatNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toLocaleString() : '0';
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat('en', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date);
}

function maskSensitiveValue(value, visibleCharacters = 4) {
  const text = String(value ?? '').trim();
  if (!text) {
    return '—';
  }

  return text.length <= visibleCharacters
    ? '•'.repeat(text.length)
    : `${'•'.repeat(text.length - visibleCharacters)}${text.slice(-visibleCharacters)}`;
}

export default function CoinsPage() {
  const { user } = useAuth();
  const adminId = Number(user?.UserId ?? user?.userId ?? user?.id);
  const [page, setPage] = useState(1);
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [operation, setOperation] = useState(null);
  const [coinsToAdd, setCoinsToAdd] = useState('');
  const [remarks, setRemarks] = useState('');
  const [pendingKyc, setPendingKyc] = useState(null);
  const [kycPage, setKycPage] = useState(1);
  const [selectedKyc, setSelectedKyc] = useState(null);
  const [isApproved, setIsApproved] = useState(true);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isOperating, setIsOperating] = useState(false);
  const [operationError, setOperationError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const { data, error, isLoading, reload } = useAsyncData(async () => {
    if (!Number.isInteger(adminId) || adminId <= 0) {
      throw new Error('The signed-in administrator does not have a valid user ID.');
    }

    const [summaryResponse, balanceResponse, transactionsResponse] = await Promise.all([
      getUsersCoinSummary({
        adminId,
        pageNumber: page,
        pageSize: PAGE_SIZE,
        searchKeyword: search || null,
      }),
      getAdminBucketBalance({ adminId }),
      getAdminTransactions(adminId, 50),
    ]);

    return {
      data: {
        data: {
          balance: balanceResponse.data.data,
          summary: summaryResponse.data.data,
          transactions: transactionsResponse.data.data,
        },
      },
    };
  }, [adminId, page, search]);

  const balance = data?.balance || {};
  const summary = data?.summary || {};
  const records = Array.isArray(summary.records)
    ? summary.records
    : Array.isArray(summary)
      ? summary
      : [];
  const totalRecords = Number(summary.totalRecords ?? summary.totalCount ?? records.length);
  const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));
  const transactions = Array.isArray(data?.transactions)
    ? data.transactions
    : Array.isArray(data?.transactions?.records)
      ? data.transactions.records
      : [];
  const pendingKycRecords = Array.isArray(pendingKyc)
    ? pendingKyc
    : Array.isArray(pendingKyc?.records)
      ? pendingKyc.records
      : [];
  const pendingKycTotal = Number(
    pendingKyc?.totalRecords ?? pendingKyc?.totalCount ?? pendingKycRecords.length,
  );
  const pendingKycPages = Math.max(1, Math.ceil(pendingKycTotal / PAGE_SIZE));

  function submitSearch(event) {
    event.preventDefault();
    setPage(1);
    setSearch(searchDraft.trim());
  }

  async function submitCoins(event) {
    event.preventDefault();
    const amount = Number(coinsToAdd);
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      setOperationError('Enter a valid whole number greater than zero.');
      return;
    }

    setIsOperating(true);
    setOperationError('');

    try {
      await addCoinsToBucket({
        adminId,
        coinsToAdd: amount,
        remarks: remarks.trim() || undefined,
      });
      setOperation(null);
      setCoinsToAdd('');
      setRemarks('');
      setActionMessage('Coins added to the admin bucket successfully.');
      await reload();
    } catch (requestError) {
      setOperationError(requestErrorMessage(requestError, 'Unable to add coins'));
    } finally {
      setIsOperating(false);
    }
  }

  async function loadPendingKyc(pageNumber = 1) {
    setOperation('kyc');
    setPendingKyc(null);
    setKycPage(pageNumber);
    setOperationError('');
    setIsOperating(true);

    try {
      const response = await getPendingKyc({
        adminId,
        pageNumber,
        pageSize: PAGE_SIZE,
      });
      setPendingKyc(response.data.data);
    } catch (requestError) {
      setOperationError(
        requestErrorMessage(requestError, 'Unable to load pending KYC records'),
      );
    } finally {
      setIsOperating(false);
    }
  }

  async function submitKycDecision(event) {
    event.preventDefault();
    const kycId = Number(selectedKyc?.kycId ?? selectedKyc?.id);
    if (!Number.isInteger(kycId) || kycId <= 0) {
      setOperationError('This KYC record does not contain a valid ID.');
      return;
    }
    if (!isApproved && !rejectionReason.trim()) {
      setOperationError('A rejection reason is required.');
      return;
    }

    setIsOperating(true);
    setOperationError('');

    try {
      await verifyKyc({
        adminId,
        kycId,
        isApproved,
        rejectionReason: isApproved ? undefined : rejectionReason.trim(),
      });
      setSelectedKyc(null);
      setRejectionReason('');
      setIsApproved(true);
      setActionMessage('KYC decision saved successfully.');
      await loadPendingKyc(kycPage);
    } catch (requestError) {
      setOperationError(requestErrorMessage(requestError, 'Unable to update KYC'));
    } finally {
      setIsOperating(false);
    }
  }
  const userColumns = [
    {
      key: 'username',
      label: 'User',
      render: (item) => (
        <div>
          <p className="font-semibold text-slate-900">@{item.username}</p>
          <p className="mt-0.5 text-xs text-slate-500">{item.email}</p>
        </div>
      ),
    },
    {
      key: 'coinBalance',
      label: 'Balance',
      render: (item) => formatNumber(item.coinBalance),
    },
    {
      key: 'totalCoinsEarned',
      label: 'Earned',
      render: (item) => formatNumber(item.totalCoinsEarned),
    },
    {
      key: 'totalCoinsPurchased',
      label: 'Purchased',
      render: (item) => formatNumber(item.totalCoinsPurchased),
    },
    {
      key: 'totalCoinsGifted',
      label: 'Gifted',
      render: (item) => formatNumber(item.totalCoinsGifted),
    },
    { key: 'userLevel', label: 'Level' },
    { key: 'creatorLevel', label: 'Creator tier' },
  ];
  const transactionColumns = [
    { key: 'action', label: 'Action' },
    {
      key: 'coinAmount',
      label: 'Coins',
      render: (item) => formatNumber(item.coinAmount),
    },
    { key: 'remarks', label: 'Remarks' },
    { key: 'adminName', label: 'Administrator' },
    {
      key: 'createdDate',
      label: 'Date',
      render: (item) =>
        formatDate(item.createdDate),
    },
  ];
  const kycColumns = [
    {
      key: 'applicant',
      label: 'Applicant',
      render: (item) => (
        <div>
          <p className="font-semibold text-slate-900">
            {item.fullName || item.username || `User #${item.userId ?? '—'}`}
          </p>
          {item.email && <p className="mt-0.5 text-xs text-slate-500">{item.email}</p>}
        </div>
      ),
    },
    {
      key: 'panNumber',
      label: 'PAN',
      render: (item) => (
        <span className="font-mono text-xs">{maskSensitiveValue(item.panNumber)}</span>
      ),
    },
    {
      key: 'aadhaarNumber',
      label: 'Aadhaar',
      render: (item) => (
        <span className="font-mono text-xs">{maskSensitiveValue(item.aadhaarNumber)}</span>
      ),
    },
    {
      key: 'submittedDate',
      label: 'Submitted',
      render: (item) =>
        formatDate(item.submittedDate ?? item.createdDate ?? item.submittedAt),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (item) => (
        <button
          className="min-h-11 rounded-xl px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-40"
          disabled={!(item.kycId ?? item.id)}
          onClick={() => {
            setOperationError('');
            setSelectedKyc(item);
            setIsApproved(true);
            setRejectionReason('');
          }}
          type="button"
        >
          Review
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold"
              onClick={() => loadPendingKyc(1)}
              type="button"
            >
              <ShieldCheck className="size-4" />
              Pending KYC
            </button>
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white"
              onClick={() => {
                setOperationError('');
                setOperation('add');
              }}
              type="button"
            >
              <Plus className="size-4" />
              Add bucket coins
            </button>
          </div>
        }
        description="Monitor the admin bucket, user balances, and coin activity."
        eyebrow="Coin and wallet"
        title="Coin operations"
      />

      {actionMessage && (
        <div
          className="flex items-center justify-between gap-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
          role="status"
        >
          <span>{actionMessage}</span>
          <button
            aria-label="Dismiss notification"
            className="grid size-8 place-items-center rounded-lg hover:bg-emerald-100"
            onClick={() => setActionMessage('')}
            type="button"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {isLoading && <LoadingState label="Loading coin operations…" />}
      {!isLoading && error && <ErrorState message={error} onRetry={reload} />}
      {!isLoading && !error && !data && <EmptyState />}
      {!isLoading && !error && data && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: 'Bucket balance',
                value: balance.currentBalance,
                icon: CircleDollarSign,
              },
              { label: 'Total revenue', value: balance.totalRevenue, icon: HandCoins },
              { label: 'Fees collected', value: balance.totalFeesCollected, icon: ReceiptText },
              {
                label: 'Coins distributed',
                value: balance.totalCoinsDistributed,
                icon: Coins,
              },
            ].map(({ icon: Icon, label, value }) => (
              <article
                className="rounded-2xl border border-slate-200 bg-white p-5"
                key={label}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-slate-500">{label}</p>
                    <p className="mt-2 break-all text-2xl font-bold tabular-nums text-slate-950">
                      {formatNumber(value)}
                    </p>
                  </div>
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-yellow-50 text-yellow-600">
                    <Icon className="size-5" />
                  </div>
                </div>
              </article>
            ))}
          </section>

          <section className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-bold text-slate-900">User coin summary</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {formatNumber(totalRecords)} accounts with wallet information
                </p>
              </div>
              <button
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                disabled={isLoading}
                onClick={reload}
                type="button"
              >
                <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
            <form
              className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-3 sm:flex-row"
              onSubmit={submitSearch}
            >
              <label className="relative flex-1">
                <span className="sr-only">Search coin accounts</span>
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
              {search && (
                <button
                  className="h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600"
                  onClick={() => {
                    setSearchDraft('');
                    setSearch('');
                    setPage(1);
                  }}
                  type="button"
                >
                  Clear
                </button>
              )}
            </form>
            {records.length > 0 ? (
              <>
                <DataTable
                  columns={userColumns}
                  getRowKey={(item, index) => item.userId ?? item.id ?? index}
                  rows={records}
                />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-500">
                    Page {page} of {totalPages} · {formatNumber(totalRecords)} users
                  </p>
                  <div className="flex gap-2">
                    <button
                      className="inline-flex h-10 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold disabled:opacity-40"
                      disabled={page === 1}
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                      type="button"
                    >
                      <ChevronLeft className="size-4" />
                      Previous
                    </button>
                    <button
                      className="inline-flex h-10 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold disabled:opacity-40"
                      disabled={page >= totalPages}
                      onClick={() => setPage((current) => current + 1)}
                      type="button"
                    >
                      Next
                      <ChevronRight className="size-4" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <EmptyState
                description={
                  search
                    ? 'No wallet accounts match the current search.'
                    : 'Wallet accounts will appear here when available.'
                }
                title="No coin accounts found"
              />
            )}
          </section>

          <section className="space-y-3">
            <div>
              <h2 className="font-bold text-slate-900">Admin transactions</h2>
              <p className="mt-1 text-sm text-slate-500">Recent bucket activity</p>
            </div>
            {transactions.length > 0 ? (
              <DataTable
                columns={transactionColumns}
                getRowKey={(item, index) =>
                  item.logId ?? item.transactionId ?? item.id ?? index
                }
                rows={transactions}
              />
            ) : (
              <EmptyState title="No transactions found" />
            )}
          </section>
        </>
      )}

      {operation && (
        <div className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto p-3 sm:p-4">
          <button
            aria-label="Close coin operation"
            className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm"
            disabled={isOperating}
            onClick={() => {
              setOperation(null);
              setOperationError('');
            }}
            type="button"
          />
          <section className="relative my-3 w-full max-w-3xl rounded-2xl bg-white p-5 shadow-2xl sm:my-6 sm:p-6">
            <button
              aria-label="Close coin operation"
              className="absolute right-3 top-3 grid size-11 place-items-center rounded-xl text-slate-400 hover:bg-slate-100"
              disabled={isOperating}
              onClick={() => {
                setOperation(null);
                setOperationError('');
              }}
              type="button"
            >
              <X className="size-4" />
            </button>
            <h2 className="text-lg font-bold text-slate-950">
              {operation === 'add' ? 'Add coins to admin bucket' : 'Pending KYC'}
            </h2>

            {operation === 'add' && (
              <form className="mt-5 space-y-4" onSubmit={submitCoins}>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    Coins to add
                  </span>
                  <input
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-yellow-500"
                    min="1"
                    onChange={(event) => setCoinsToAdd(event.target.value)}
                    required
                    type="number"
                    value={coinsToAdd}
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    Remarks
                  </span>
                  <textarea
                    className="min-h-24 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-yellow-500"
                    onChange={(event) => setRemarks(event.target.value)}
                    value={remarks}
                  />
                </label>
                {operationError && (
                  <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                    {operationError}
                  </p>
                )}
                <button
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-sm font-semibold text-white"
                  disabled={isOperating}
                  type="submit"
                >
                  {isOperating && <LoaderCircle className="size-4 animate-spin" />}
                  Add coins
                </button>
              </form>
            )}

            {operation === 'kyc' && isOperating && (
              <div className="grid min-h-64 place-items-center">
                <LoaderCircle className="size-7 animate-spin text-yellow-500" />
              </div>
            )}
            {operation === 'kyc' && !isOperating && operationError && (
              <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
                {operationError}
              </p>
            )}
            {operation === 'kyc' &&
              !isOperating &&
              !operationError &&
              pendingKycRecords.length > 0 && (
                <div className="mt-5 space-y-4">
                  <DataTable
                    columns={kycColumns}
                    getRowKey={(item, index) => item.kycId ?? item.id ?? index}
                    rows={pendingKycRecords}
                  />
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-500">
                      Page {kycPage} of {pendingKycPages} · {formatNumber(pendingKycTotal)} pending
                    </p>
                    <div className="flex gap-2">
                      <button
                        className="inline-flex h-10 items-center gap-1 rounded-lg border border-slate-200 px-3 text-sm font-semibold disabled:opacity-40"
                        disabled={kycPage === 1}
                        onClick={() => loadPendingKyc(kycPage - 1)}
                        type="button"
                      >
                        <ChevronLeft className="size-4" />
                        Previous
                      </button>
                      <button
                        className="inline-flex h-10 items-center gap-1 rounded-lg border border-slate-200 px-3 text-sm font-semibold disabled:opacity-40"
                        disabled={kycPage >= pendingKycPages}
                        onClick={() => loadPendingKyc(kycPage + 1)}
                        type="button"
                      >
                        Next
                        <ChevronRight className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            {operation === 'kyc' &&
              !isOperating &&
              !operationError &&
              pendingKyc !== null &&
              pendingKycRecords.length === 0 && (
                <div className="mt-5">
                  <EmptyState title="No pending KYC records" />
                </div>
              )}
          </section>
        </div>
      )}

      {selectedKyc && (
        <div className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto p-3 sm:p-4">
          <button
            aria-label="Close KYC decision"
            className="absolute inset-0 bg-slate-950/70"
            disabled={isOperating}
            onClick={() => {
              setSelectedKyc(null);
              setOperationError('');
            }}
            type="button"
          />
          <form
            className="relative my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6"
            onSubmit={submitKycDecision}
          >
            <button
              aria-label="Close KYC decision"
              className="absolute right-3 top-3 grid size-11 place-items-center rounded-xl text-slate-400 hover:bg-slate-100"
              disabled={isOperating}
              onClick={() => {
                setSelectedKyc(null);
                setOperationError('');
              }}
              type="button"
            >
              <X className="size-4" />
            </button>
            <h2 className="pr-12 text-lg font-bold text-slate-950">Verify KYC</h2>
            <label className="mt-5 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input
                checked={isApproved}
                onChange={(event) => {
                  setIsApproved(event.target.checked);
                  setOperationError('');
                }}
                type="checkbox"
              />
              Approve this KYC
            </label>
            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Rejection reason
              </span>
              <textarea
                className="min-h-24 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-yellow-500"
                disabled={isApproved}
                onChange={(event) => {
                  setRejectionReason(event.target.value);
                  setOperationError('');
                }}
                required={!isApproved}
                value={rejectionReason}
              />
            </label>
            {operationError && (
              <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">
                {operationError}
              </p>
            )}
            <button
              className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-sm font-semibold text-white"
              disabled={isOperating}
              type="submit"
            >
              {isOperating && <LoaderCircle className="size-4 animate-spin" />}
              Save KYC decision
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
