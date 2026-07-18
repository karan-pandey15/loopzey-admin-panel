import { useState } from 'react';
import {
  CircleDollarSign,
  Coins,
  HandCoins,
  LoaderCircle,
  Plus,
  ReceiptText,
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
import DynamicTable from '../../components/DynamicTable';
import PageHeader from '../../components/PageHeader';
import useAuth from '../../hooks/useAuth';
import useAsyncData from '../../hooks/useAsyncData';

export default function CoinsPage() {
  const { user } = useAuth();
  const adminId = user.UserId;
  const [operation, setOperation] = useState(null);
  const [coinsToAdd, setCoinsToAdd] = useState('');
  const [remarks, setRemarks] = useState('');
  const [pendingKyc, setPendingKyc] = useState(null);
  const [selectedKyc, setSelectedKyc] = useState(null);
  const [isApproved, setIsApproved] = useState(true);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isOperating, setIsOperating] = useState(false);
  const [operationError, setOperationError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const { data, error, isLoading, reload } = useAsyncData(async () => {
    const [summaryResponse, balanceResponse, transactionsResponse] = await Promise.all([
      getUsersCoinSummary({
        adminId,
        pageNumber: 1,
        pageSize: 10,
        searchKeyword: null,
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
  }, [adminId]);

  const balance = data?.balance;
  const records = data?.summary?.records || [];
  const transactions = data?.transactions || [];

  async function submitCoins(event) {
    event.preventDefault();
    setIsOperating(true);
    setOperationError('');

    try {
      await addCoinsToBucket({
        adminId,
        coinsToAdd: Number(coinsToAdd),
        remarks: remarks || undefined,
      });
      setOperation(null);
      setCoinsToAdd('');
      setRemarks('');
      setActionMessage('Coins added to the admin bucket successfully.');
      await reload();
    } catch (requestError) {
      setOperationError(
        requestError.response?.status
          ? `Request failed with status ${requestError.response.status}.`
          : 'Unable to add coins.',
      );
    } finally {
      setIsOperating(false);
    }
  }

  async function loadPendingKyc() {
    setOperation('kyc');
    setPendingKyc(null);
    setOperationError('');
    setIsOperating(true);

    try {
      const response = await getPendingKyc({
        adminId,
        pageNumber: 1,
        pageSize: 10,
      });
      setPendingKyc(response.data.data);
    } catch (requestError) {
      setOperationError(
        requestError.response?.status
          ? `Pending KYC request failed with status ${requestError.response.status}.`
          : 'Unable to load pending KYC records.',
      );
    } finally {
      setIsOperating(false);
    }
  }

  async function submitKycDecision(event) {
    event.preventDefault();
    setIsOperating(true);
    setOperationError('');

    try {
      await verifyKyc({
        adminId,
        kycId: selectedKyc.kycId,
        isApproved,
        rejectionReason: rejectionReason || undefined,
      });
      setSelectedKyc(null);
      setActionMessage('KYC decision saved successfully.');
      await loadPendingKyc();
    } catch (requestError) {
      setOperationError(
        requestError.response?.status
          ? `KYC update failed with status ${requestError.response.status}.`
          : 'Unable to update KYC.',
      );
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
    { key: 'coinBalance', label: 'Balance' },
    { key: 'totalCoinsEarned', label: 'Earned' },
    { key: 'totalCoinsPurchased', label: 'Purchased' },
    { key: 'totalCoinsGifted', label: 'Gifted' },
    { key: 'userLevel', label: 'Level' },
    { key: 'creatorLevel', label: 'Creator tier' },
  ];
  const transactionColumns = [
    { key: 'action', label: 'Action' },
    { key: 'coinAmount', label: 'Coins' },
    { key: 'remarks', label: 'Remarks' },
    { key: 'adminName', label: 'Administrator' },
    {
      key: 'createdDate',
      label: 'Date',
      render: (item) =>
        new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(
          new Date(item.createdDate),
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold"
              onClick={loadPendingKyc}
              type="button"
            >
              <ShieldCheck className="size-4" />
              Pending KYC
            </button>
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white"
              onClick={() => setOperation('add')}
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
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
          {actionMessage}
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
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">{label}</p>
                    <p className="mt-2 text-2xl font-bold text-slate-950">
                      {value.toLocaleString()}
                    </p>
                  </div>
                  <div className="grid size-10 place-items-center rounded-xl bg-yellow-50 text-yellow-600">
                    <Icon className="size-5" />
                  </div>
                </div>
              </article>
            ))}
          </section>

          <section className="space-y-3">
            <div>
              <h2 className="font-bold text-slate-900">User coin summary</h2>
              <p className="mt-1 text-sm text-slate-500">
                {data.summary.totalRecords} accounts with wallet information
              </p>
            </div>
            {records.length > 0 ? (
              <DataTable
                columns={userColumns}
                getRowKey={(item) => item.userId}
                rows={records}
              />
            ) : (
              <EmptyState title="No coin accounts found" />
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
                getRowKey={(item) => item.logId}
                rows={transactions}
              />
            ) : (
              <EmptyState title="No transactions found" />
            )}
          </section>
        </>
      )}

      {operation && (
        <div className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto p-4">
          <button
            aria-label="Close coin operation"
            className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm"
            onClick={() => setOperation(null)}
            type="button"
          />
          <section className="relative my-6 w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl">
            <button
              aria-label="Close coin operation"
              className="absolute right-4 top-4 grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100"
              onClick={() => setOperation(null)}
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
              Array.isArray(pendingKyc) &&
              pendingKyc.length > 0 && (
                <div className="mt-5">
                  <DynamicTable
                    extraColumns={[
                      {
                        key: 'actions',
                        label: 'Actions',
                        render: (item) => (
                          <button
                            className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-40"
                            disabled={!item.kycId}
                            onClick={() => setSelectedKyc(item)}
                            type="button"
                          >
                            Review
                          </button>
                        ),
                      },
                    ]}
                    rows={pendingKyc}
                  />
                </div>
              )}
            {operation === 'kyc' &&
              !isOperating &&
              !operationError &&
              Array.isArray(pendingKyc) &&
              pendingKyc.length === 0 && (
                <div className="mt-5">
                  <EmptyState title="No pending KYC records" />
                </div>
              )}
          </section>
        </div>
      )}

      {selectedKyc && (
        <div className="fixed inset-0 z-[80] grid place-items-center p-4">
          <button
            aria-label="Close KYC decision"
            className="absolute inset-0 bg-slate-950/70"
            onClick={() => setSelectedKyc(null)}
            type="button"
          />
          <form
            className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onSubmit={submitKycDecision}
          >
            <h2 className="text-lg font-bold text-slate-950">Verify KYC</h2>
            <label className="mt-5 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input
                checked={isApproved}
                onChange={(event) => setIsApproved(event.target.checked)}
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
                onChange={(event) => setRejectionReason(event.target.value)}
                value={rejectionReason}
              />
            </label>
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
