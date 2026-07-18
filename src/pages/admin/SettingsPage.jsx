import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  LoaderCircle,
  Pencil,
  RefreshCw,
  RotateCcw,
  Search,
  Settings2,
  ToggleLeft,
  X,
} from 'lucide-react';
import {
  getSettings,
  updateSetting,
} from '../../api/settings';
import { EmptyState, ErrorState, LoadingState } from '../../components/AsyncState';
import PageHeader from '../../components/PageHeader';
import useAsyncData from '../../hooks/useAsyncData';

const PAGE_SIZE = 10;

function formatDate(value) {
  if (!value) {
    return 'Not updated';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Not updated';
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function isBooleanSetting(setting) {
  return setting.settingType?.toLowerCase() === 'boolean';
}

function booleanValue(setting) {
  return String(setting.settingValue).toLowerCase() === 'true';
}

function validateValue(setting, value) {
  const type = setting.settingType?.toLowerCase();

  if (type === 'integer' && !/^-?\d+$/.test(value.trim())) {
    return 'Enter a valid whole number.';
  }

  if (
    ['decimal', 'double', 'float', 'number'].includes(type) &&
    (value.trim() === '' || !Number.isFinite(Number(value)))
  ) {
    return 'Enter a valid number.';
  }

  if (type === 'json') {
    try {
      JSON.parse(value);
    } catch {
      return 'Enter valid JSON.';
    }
  }

  return '';
}

function requestErrorMessage(error, fallback) {
  return (
    error.response?.data?.message ||
    error.response?.data?.title ||
    (error.response?.status ? `${fallback} (status ${error.response.status}).` : fallback)
  );
}

function SettingToggle({ checked, disabled, label, onChange }) {
  return (
    <button
      aria-checked={checked}
      aria-label={label}
      className="grid min-h-11 min-w-14 shrink-0 place-items-center rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 focus-visible:ring-offset-2 disabled:opacity-50"
      disabled={disabled}
      onClick={onChange}
      role="switch"
      type="button"
    >
      <span
        className={`relative h-7 w-12 rounded-full transition ${
          checked ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
        }`}
      >
        <span
          className={`absolute top-1 size-5 rounded-full bg-white shadow-sm transition ${
            checked ? 'left-6' : 'left-1'
          }`}
        />
      </span>
    </button>
  );
}

export default function SettingsPage() {
  const { data, error, isLoading, reload, setData } = useAsyncData(getSettings, []);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [settingValue, setSettingValue] = useState('');
  const [editorError, setEditorError] = useState('');
  const [updatingKeys, setUpdatingKeys] = useState(() => new Set());
  const [actionStatus, setActionStatus] = useState(null);

  useEffect(() => {
    if (!editing) {
      return undefined;
    }

    function closeOnEscape(event) {
      if (event.key === 'Escape') {
        setEditing(null);
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [editing]);

  const settings = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const filteredSettings = settings.filter((setting) => {
    const query = search.trim().toLowerCase();
    return (
      !query ||
      String(setting.settingKey ?? '')
        .toLowerCase()
        .includes(query) ||
      String(setting.description ?? '')
        .toLowerCase()
        .includes(query) ||
      String(setting.settingValue ?? '')
        .toLowerCase()
        .includes(query) ||
      String(setting.category ?? '')
        .toLowerCase()
        .includes(query)
    );
  });
  const pageCount = Math.max(1, Math.ceil(filteredSettings.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paginatedSettings = filteredSettings.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const enabledBooleanSettings = settings.filter(
    (setting) => isBooleanSetting(setting) && booleanValue(setting),
  ).length;
  const publicSettings = settings.filter((setting) => setting.isPublic).length;
  const restartSettings = settings.filter((setting) => setting.requiresRestart).length;

  function openEditor(setting) {
    setEditing(setting);
    setSettingValue(setting.settingValue ?? '');
    setEditorError('');
  }

  async function persistSetting(settingKey, value) {
    setUpdatingKeys((current) => new Set(current).add(settingKey));
    setEditorError('');
    setActionStatus(null);

    try {
      const response = await updateSetting({
        settingKey,
        settingValue: value,
      });
      const returnedSetting = response.data?.data;
      setData((current) =>
        Array.isArray(current)
          ? current.map((setting) =>
              setting.settingKey === settingKey
                ? {
                    ...setting,
                    ...(returnedSetting &&
                    !Array.isArray(returnedSetting) &&
                    typeof returnedSetting === 'object'
                      ? returnedSetting
                      : {}),
                    settingValue: returnedSetting?.settingValue ?? value,
                    updatedAt: returnedSetting?.updatedAt ?? new Date().toISOString(),
                  }
                : setting,
            )
          : current,
      );
      setActionStatus({
        type: 'success',
        message: `${settingKey} was updated successfully.`,
      });
      return true;
    } catch (requestError) {
      const message = requestErrorMessage(requestError, 'Unable to update this setting');
      setEditorError(message);
      setActionStatus({ type: 'error', message });
      return false;
    } finally {
      setUpdatingKeys((current) => {
        const next = new Set(current);
        next.delete(settingKey);
        return next;
      });
    }
  }

  async function toggleSetting(setting) {
    if (updatingKeys.has(setting.settingKey)) {
      return;
    }
    await persistSetting(setting.settingKey, booleanValue(setting) ? 'false' : 'true');
  }

  async function saveSetting(event) {
    event.preventDefault();
    const validationError = validateValue(editing, settingValue);
    if (validationError) {
      setEditorError(validationError);
      return;
    }

    const saved = await persistSetting(editing.settingKey, settingValue);

    if (saved) {
      setEditing(null);
    }
  }

  return (
    <div className="space-y-7">
      <PageHeader
        action={
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-yellow-400 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-white"
            disabled={isLoading}
            onClick={reload}
            type="button"
          >
            <RefreshCw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Refreshing…' : 'Refresh settings'}
          </button>
        }
        description="Control application behavior, feature availability, announcements, translations, and version requirements without redeployment."
        eyebrow="Platform configuration"
        title="System settings"
      />

      {isLoading && <LoadingState label="Loading live system settings…" />}
      {!isLoading && error && <ErrorState message={error} onRetry={reload} />}
      {!isLoading && !error && settings.length === 0 && (
        <EmptyState title="No settings configured" />
      )}

      {!isLoading && !error && settings.length > 0 && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: 'Total settings',
                value: settings.length,
                helper: 'Live configuration records',
                icon: Settings2,
                color: 'bg-blue-50 text-blue-600 dark:bg-blue-400/10 dark:text-blue-300',
              },
              {
                label: 'Enabled controls',
                value: enabledBooleanSettings,
                helper: 'Boolean features switched on',
                icon: ToggleLeft,
                color:
                  'bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300',
              },
              {
                label: 'Public settings',
                value: publicSettings,
                helper: 'Available to client applications',
                icon: Eye,
                color:
                  'bg-violet-50 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300',
              },
              {
                label: 'Restart required',
                value: restartSettings,
                helper: 'Changes needing an app restart',
                icon: RotateCcw,
                color:
                  'bg-amber-50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300',
              },
            ].map(({ color, helper, icon: Icon, label, value }) => (
              <article
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none"
                key={label}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{label}</p>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                      {value}
                    </p>
                  </div>
                  <div className={`grid size-11 place-items-center rounded-xl ${color}`}>
                    <Icon className="size-5" />
                  </div>
                </div>
                <p className="mt-3 text-xs text-slate-400">{helper}</p>
              </article>
            ))}
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-200 p-4 dark:border-slate-800 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <label className="relative min-w-0 flex-1">
                  <span className="sr-only">Search settings</span>
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 text-sm outline-none transition focus:border-yellow-500 focus:ring-4 focus:ring-yellow-400/10 dark:border-slate-700 dark:bg-slate-950"
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setPage(1);
                    }}
                    placeholder="Search settings…"
                    value={search}
                  />
                  {search && (
                    <button
                      aria-label="Clear search"
                      className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-800"
                      onClick={() => {
                        setSearch('');
                        setPage(1);
                      }}
                      type="button"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </label>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <span className="rounded-lg bg-slate-100 px-3 py-2 font-semibold dark:bg-slate-800">
                    {filteredSettings.length} records
                  </span>
                </div>
              </div>
            </div>

            {actionStatus && (
              <div
                aria-live="polite"
                className={`mx-4 mt-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm sm:mx-5 ${
                  actionStatus.type === 'error'
                    ? 'bg-red-50 text-red-700'
                    : 'bg-emerald-50 text-emerald-700'
                }`}
                role={actionStatus.type === 'error' ? 'alert' : 'status'}
              >
                {actionStatus.type === 'error' ? (
                  <X className="size-4 shrink-0" />
                ) : (
                  <Check className="size-4 shrink-0" />
                )}
                <span className="min-w-0 flex-1 break-words">{actionStatus.message}</span>
                <button
                  aria-label="Dismiss notification"
                  className="grid size-7 shrink-0 place-items-center rounded-lg hover:bg-black/5"
                  onClick={() => setActionStatus(null)}
                  type="button"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            )}

            {filteredSettings.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  description="Try another key, description, value, or category."
                  title="No matching settings"
                />
              </div>
            ) : (
              <div>
                <div className="hidden overflow-x-auto lg:block">
                  <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-950">
                        {[
                          'Setting',
                          'Value',
                          'Type / category',
                          'Access',
                          'Restart',
                          'Updated',
                          'Actions',
                        ].map((label) => (
                          <th
                            className="whitespace-nowrap px-4 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-500"
                            key={label}
                          >
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {paginatedSettings.map((setting) => {
                        const isBoolean = isBooleanSetting(setting);
                        const enabled = isBoolean && booleanValue(setting);
                        const isUpdating = updatingKeys.has(setting.settingKey);

                        return (
                          <tr
                            className="transition hover:bg-slate-50/70 dark:hover:bg-slate-800/50"
                            key={setting.settingKey}
                          >
                            <td className="max-w-xs px-4 py-4 align-top">
                              <p className="break-all font-semibold text-slate-900">
                                {setting.settingKey}
                              </p>
                              <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                                {setting.description || 'No description provided.'}
                              </p>
                            </td>
                            <td className="max-w-64 px-4 py-4 align-top">
                              {isBoolean && setting.isEditable ? (
                                <div className="flex items-center gap-2">
                                  {isUpdating ? (
                                    <LoaderCircle className="size-5 animate-spin text-yellow-500" />
                                  ) : (
                                    <SettingToggle
                                      checked={enabled}
                                      disabled={isUpdating}
                                      label={`${enabled ? 'Disable' : 'Enable'} ${setting.settingKey}`}
                                      onChange={() => toggleSetting(setting)}
                                    />
                                  )}
                                  <span className="text-xs font-semibold text-slate-500">
                                    {enabled ? 'Enabled' : 'Disabled'}
                                  </span>
                                </div>
                              ) : (
                                <p className="max-w-64 break-words font-medium text-slate-700 dark:text-slate-200">
                                  {setting.settingValue ?? '—'}
                                </p>
                              )}
                            </td>
                            <td className="px-4 py-4 align-top">
                              <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                {setting.settingType || 'String'}
                              </span>
                              <p className="mt-2 text-xs text-slate-500">
                                {setting.category || 'General'}
                              </p>
                            </td>
                            <td className="px-4 py-4 align-top">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                  setting.isPublic
                                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300'
                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                }`}
                              >
                                {setting.isPublic ? (
                                  <Eye className="size-3.5" />
                                ) : (
                                  <EyeOff className="size-3.5" />
                                )}
                                {setting.isPublic ? 'Public' : 'Private'}
                              </span>
                            </td>
                            <td className="px-4 py-4 align-top">
                              {setting.requiresRestart ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">
                                  <RotateCcw className="size-3.5" />
                                  Required
                                </span>
                              ) : (
                                <span className="text-slate-400">No</span>
                              )}
                            </td>
                            <td className="whitespace-nowrap px-4 py-4 align-top text-xs text-slate-500">
                              {formatDate(setting.updatedAt)}
                            </td>
                            <td className="px-4 py-4 align-top">
                              <div className="flex items-center gap-1">
                                {setting.isEditable && !isBoolean && (
                                  <button
                                    aria-label={`Edit ${setting.settingKey}`}
                                    className="grid size-9 place-items-center rounded-lg text-blue-600 transition hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-400/10"
                                    onClick={() => openEditor(setting)}
                                    title="Edit setting"
                                    type="button"
                                  >
                                    <Pencil className="size-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 lg:hidden">
                  {paginatedSettings.map((setting) => {
                    const isBoolean = isBooleanSetting(setting);
                    const enabled = isBoolean && booleanValue(setting);
                    const isUpdating = updatingKeys.has(setting.settingKey);

                    return (
                      <article className="p-4 sm:p-5" key={setting.settingKey}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="break-all font-semibold text-slate-900">
                              {setting.settingKey}
                            </p>
                            <p className="mt-1 text-xs leading-5 text-slate-500">
                              {setting.description || 'No description provided.'}
                            </p>
                          </div>
                          <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {setting.settingType || 'String'}
                          </span>
                        </div>

                        <div className="mt-4 rounded-xl bg-slate-50 p-3 dark:bg-slate-950">
                          <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                            Current value
                          </p>
                          {isBoolean && setting.isEditable ? (
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-slate-700">
                                {enabled ? 'Enabled' : 'Disabled'}
                              </span>
                              {isUpdating ? (
                                <LoaderCircle className="size-5 animate-spin text-yellow-500" />
                              ) : (
                                <SettingToggle
                                  checked={enabled}
                                  disabled={isUpdating}
                                  label={`${enabled ? 'Disable' : 'Enable'} ${setting.settingKey}`}
                                  onChange={() => toggleSetting(setting)}
                                />
                              )}
                            </div>
                          ) : (
                            <p className="break-words text-sm font-medium text-slate-700 dark:text-slate-200">
                              {setting.settingValue ?? '—'}
                            </p>
                          )}
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {setting.category || 'General'}
                          </span>
                          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300">
                            {setting.isPublic ? 'Public' : 'Private'}
                          </span>
                          {setting.requiresRestart && (
                            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">
                              Restart required
                            </span>
                          )}
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                          <span className="text-[11px] text-slate-400">
                            {formatDate(setting.updatedAt)}
                          </span>
                          {setting.isEditable && !isBoolean && (
                            <button
                              className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-blue-600 hover:bg-blue-50 dark:text-blue-300"
                              onClick={() => openEditor(setting)}
                              type="button"
                            >
                              <Pencil className="size-3.5" />
                              Edit
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <p className="text-xs text-slate-500" aria-live="polite">
                    Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                    {Math.min(currentPage * PAGE_SIZE, filteredSettings.length)} of{' '}
                    {filteredSettings.length}
                  </p>
                  <div className="flex items-center justify-between gap-2 sm:justify-end">
                    <button
                      className="inline-flex h-10 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      disabled={currentPage === 1}
                      onClick={() => setPage((value) => Math.max(1, value - 1))}
                      type="button"
                    >
                      <ChevronLeft className="size-4" />
                      Previous
                    </button>
                    <span className="min-w-20 text-center text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {currentPage} / {pageCount}
                    </span>
                    <button
                      className="inline-flex h-10 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      disabled={currentPage === pageCount}
                      onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
                      type="button"
                    >
                      Next
                      <ChevronRight className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </>
      )}

      {editing && (
        <div className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto p-3 sm:p-4">
          <button
            aria-label="Close setting editor"
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={() => setEditing(null)}
            type="button"
          />
          <form
            className="relative my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:p-7"
            onSubmit={saveSetting}
          >
            <button
              aria-label="Close setting editor"
              className="absolute right-4 top-4 grid size-9 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => setEditing(null)}
              type="button"
            >
              <X className="size-4" />
            </button>
            <div className="grid size-11 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-400/10 dark:text-blue-300">
              <Pencil className="size-5" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-slate-950">Edit setting value</h2>
            <p className="mt-1 break-all text-xs font-medium text-slate-500">
              {editing.settingKey}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-500">{editing.description}</p>

            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Setting value
              </span>
              <textarea
                aria-describedby="setting-value-help"
                autoFocus
                className="min-h-32 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none transition focus:border-yellow-500 focus:ring-4 focus:ring-yellow-400/10 dark:border-slate-700"
                onChange={(event) => {
                  setSettingValue(event.target.value);
                  if (editorError) {
                    setEditorError('');
                  }
                }}
                spellCheck={editing.settingType?.toLowerCase() !== 'json'}
                value={settingValue}
              />
            </label>
            <div
              className="mt-3 flex items-start justify-between gap-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-500 dark:bg-slate-950"
              id="setting-value-help"
            >
              <span>
                Default value:{' '}
                <strong className="break-all">{editing.defaultValue ?? '—'}</strong>
              </span>
              {editing.defaultValue !== null && editing.defaultValue !== undefined && (
                <button
                  className="shrink-0 font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-300"
                  onClick={() => {
                    setSettingValue(String(editing.defaultValue));
                    setEditorError('');
                  }}
                  type="button"
                >
                  Use default
                </button>
              )}
            </div>
            {editing.requiresRestart && (
              <div className="mt-3 flex gap-2 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-700">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                This change takes effect after the application restarts.
              </div>
            )}
            {editorError && (
              <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">
                {editorError}
              </p>
            )}
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                className="h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                onClick={() => setEditing(null)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60 dark:bg-yellow-400 dark:text-slate-950 dark:hover:bg-yellow-300"
                disabled={
                  updatingKeys.has(editing.settingKey) ||
                  settingValue === String(editing.settingValue ?? '')
                }
                type="submit"
              >
                {updatingKeys.has(editing.settingKey) && (
                  <LoaderCircle className="size-4 animate-spin" />
                )}
                Save changes
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
