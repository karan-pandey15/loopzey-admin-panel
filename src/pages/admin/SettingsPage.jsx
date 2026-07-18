import { useMemo, useState } from 'react';
import {
  AppWindow,
  Bell,
  Check,
  ChevronRight,
  Clock3,
  Eye,
  EyeOff,
  History,
  LoaderCircle,
  MessageCircleMore,
  Pencil,
  RefreshCw,
  RotateCcw,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  ToggleLeft,
  X,
} from 'lucide-react';
import {
  getSettingHistory,
  getSettings,
  updateSetting,
} from '../../api/settings';
import { EmptyState, ErrorState, LoadingState } from '../../components/AsyncState';
import DynamicTable from '../../components/DynamicTable';
import PageHeader from '../../components/PageHeader';
import useAsyncData from '../../hooks/useAsyncData';

const categoryIcons = {
  Announcement: Bell,
  App: AppWindow,
  Chat: MessageCircleMore,
  Feature: SlidersHorizontal,
  Version: Smartphone,
};

const categoryColors = {
  Announcement:
    'bg-amber-50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300',
  App: 'bg-blue-50 text-blue-600 dark:bg-blue-400/10 dark:text-blue-300',
  Chat: 'bg-violet-50 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300',
  Feature:
    'bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300',
  Version: 'bg-pink-50 text-pink-600 dark:bg-pink-400/10 dark:text-pink-300',
};

function formatDate(value) {
  if (!value) {
    return 'Not updated';
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function isBooleanSetting(setting) {
  return setting.settingType?.toLowerCase() === 'boolean';
}

function booleanValue(setting) {
  return setting.settingValue?.toLowerCase() === 'true';
}

function SettingToggle({ checked, disabled, onChange }) {
  return (
    <button
      aria-checked={checked}
      className="grid min-h-11 min-w-14 shrink-0 place-items-center rounded-xl disabled:opacity-50"
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
  const { data, error, isLoading, reload } = useAsyncData(getSettings, []);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [editing, setEditing] = useState(null);
  const [settingValue, setSettingValue] = useState('');
  const [historyKey, setHistoryKey] = useState('');
  const [historyData, setHistoryData] = useState(null);
  const [dialogError, setDialogError] = useState('');
  const [updatingKey, setUpdatingKey] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  const settings = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const categories = useMemo(
    () => ['All', ...new Set(settings.map((setting) => setting.category || 'General'))],
    [settings],
  );
  const filteredSettings = settings.filter((setting) => {
    const matchesCategory = category === 'All' || setting.category === category;
    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      setting.settingKey?.toLowerCase().includes(query) ||
      setting.description?.toLowerCase().includes(query) ||
      setting.settingValue?.toLowerCase().includes(query);

    return matchesCategory && matchesSearch;
  });
  const groupedSettings = filteredSettings.reduce((groups, setting) => {
    const group = setting.category || 'General';
    groups[group] = [...(groups[group] || []), setting];
    return groups;
  }, {});
  const enabledBooleanSettings = settings.filter(
    (setting) => isBooleanSetting(setting) && booleanValue(setting),
  ).length;
  const publicSettings = settings.filter((setting) => setting.isPublic).length;
  const restartSettings = settings.filter((setting) => setting.requiresRestart).length;

  function openEditor(setting) {
    setEditing(setting);
    setSettingValue(setting.settingValue ?? '');
    setDialogError('');
  }

  async function persistSetting(settingKey, value) {
    setUpdatingKey(settingKey);
    setDialogError('');
    setActionMessage('');

    try {
      await updateSetting({
        settingKey,
        settingValue: value,
      });
      setActionMessage(`${settingKey} updated successfully.`);
      await reload();
      return true;
    } catch (requestError) {
      const message = requestError.response?.status
        ? `Update failed with status ${requestError.response.status}.`
        : 'Unable to update this setting.';
      setDialogError(message);
      setActionMessage(message);
      return false;
    } finally {
      setUpdatingKey('');
    }
  }

  async function toggleSetting(setting) {
    await persistSetting(setting.settingKey, booleanValue(setting) ? 'false' : 'true');
  }

  async function saveSetting(event) {
    event.preventDefault();
    const saved = await persistSetting(editing.settingKey, settingValue);

    if (saved) {
      setEditing(null);
    }
  }

  async function openHistory(settingKey) {
    setHistoryKey(settingKey);
    setHistoryData(null);
    setDialogError('');
    setUpdatingKey(settingKey);

    try {
      const response = await getSettingHistory(settingKey);
      setHistoryData(response.data.data);
    } catch (requestError) {
      setDialogError(
        requestError.response?.status
          ? `History request failed with status ${requestError.response.status}.`
          : 'Unable to load setting history.',
      );
    } finally {
      setUpdatingKey('');
    }
  }

  return (
    <div className="space-y-7">
      <PageHeader
        action={
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-yellow-400 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-white"
            onClick={reload}
            type="button"
          >
            <RefreshCw className="size-4" />
            Refresh settings
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
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
                <label className="relative min-w-0 flex-1">
                  <span className="sr-only">Search settings</span>
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-yellow-500 focus:ring-4 focus:ring-yellow-400/10 dark:border-slate-700 dark:bg-slate-950"
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search keys, descriptions, or values"
                    value={search}
                  />
                </label>
                <div className="flex gap-2 overflow-x-auto pb-1 xl:max-w-[62%]">
                  {categories.map((item) => (
                    <button
                      className={`h-10 shrink-0 rounded-xl px-4 text-xs font-semibold transition ${
                        category === item
                          ? 'bg-slate-900 text-white dark:bg-yellow-400 dark:text-slate-950'
                          : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                      }`}
                      key={item}
                      onClick={() => setCategory(item)}
                      type="button"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {actionMessage && (
              <div
                className={`mx-4 mt-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm sm:mx-5 ${
                  dialogError
                    ? 'bg-red-50 text-red-700'
                    : 'bg-emerald-50 text-emerald-700'
                }`}
              >
                {dialogError ? (
                  <X className="size-4 shrink-0" />
                ) : (
                  <Check className="size-4 shrink-0" />
                )}
                {actionMessage}
              </div>
            )}

            {Object.keys(groupedSettings).length === 0 ? (
              <div className="p-5">
                <EmptyState
                  description="Try another search term or category."
                  title="No matching settings"
                />
              </div>
            ) : (
              <div className="space-y-8 p-4 sm:p-5">
                {Object.entries(groupedSettings).map(
                  ([groupName, categorySettings]) => {
                    const CategoryIcon = categoryIcons[groupName] || Settings2;
                    const categoryColor =
                      categoryColors[groupName] ||
                      'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';

                    return (
                      <section key={groupName}>
                        <div className="mb-3 flex items-center gap-3">
                          <div
                            className={`grid size-9 place-items-center rounded-xl ${categoryColor}`}
                          >
                            <CategoryIcon className="size-4" />
                          </div>
                          <div>
                            <h2 className="font-bold text-slate-950">{groupName}</h2>
                            <p className="text-xs text-slate-500">
                              {categorySettings.length} configuration items
                            </p>
                          </div>
                        </div>

                        <div className="grid gap-3 xl:grid-cols-2">
                          {categorySettings.map((setting) => {
                            const isBoolean = isBooleanSetting(setting);
                            const enabled = isBoolean && booleanValue(setting);
                            const isUpdating = updatingKey === setting.settingKey;

                            return (
                              <article
                                className="group rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition hover:border-slate-300 hover:bg-white hover:shadow-md dark:border-slate-800 dark:bg-slate-950 dark:hover:border-slate-700 dark:hover:bg-slate-900"
                                key={setting.settingKey}
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <h3 className="break-all text-sm font-bold text-slate-900">
                                        {setting.settingKey}
                                      </h3>
                                      <span className="rounded-md bg-slate-200/70 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-500 dark:bg-slate-800">
                                        {setting.settingType}
                                      </span>
                                    </div>
                                    <p className="mt-2 min-h-10 text-xs leading-5 text-slate-500">
                                      {setting.description || 'No description provided.'}
                                    </p>
                                  </div>
                                  {isBoolean && setting.isEditable ? (
                                    isUpdating ? (
                                      <LoaderCircle className="size-5 animate-spin text-yellow-500" />
                                    ) : (
                                      <SettingToggle
                                        checked={enabled}
                                        onChange={() => toggleSetting(setting)}
                                      />
                                    )
                                  ) : (
                                    <div
                                      className={`grid size-9 shrink-0 place-items-center rounded-xl ${
                                        setting.isPublic
                                          ? 'bg-blue-50 text-blue-600 dark:bg-blue-400/10 dark:text-blue-300'
                                          : 'bg-slate-200 text-slate-500 dark:bg-slate-800'
                                      }`}
                                    >
                                      {setting.isPublic ? (
                                        <Eye className="size-4" />
                                      ) : (
                                        <EyeOff className="size-4" />
                                      )}
                                    </div>
                                  )}
                                </div>

                                {!isBoolean && (
                                  <div className="mt-3 break-words rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                                    {setting.settingValue || '—'}
                                  </div>
                                )}

                                <div className="mt-4 flex flex-wrap items-center gap-2">
                                  <span
                                    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold ${
                                      setting.isPublic
                                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300'
                                        : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                    }`}
                                  >
                                    {setting.isPublic ? (
                                      <Eye className="size-3" />
                                    ) : (
                                      <ShieldCheck className="size-3" />
                                    )}
                                    {setting.isPublic ? 'Public' : 'Private'}
                                  </span>
                                  {setting.requiresRestart && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">
                                      <RotateCcw className="size-3" />
                                      Restart required
                                    </span>
                                  )}
                                  <span className="inline-flex w-full items-center gap-1 text-[10px] text-slate-400 sm:ml-auto sm:w-auto">
                                    <Clock3 className="size-3" />
                                    {formatDate(setting.updatedAt)}
                                  </span>
                                </div>

                                <div className="mt-3 flex items-center justify-end gap-1 border-t border-slate-200 pt-3 dark:border-slate-800">
                                  <button
                                    className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
                                    onClick={() => openHistory(setting.settingKey)}
                                    type="button"
                                  >
                                    <History className="size-3.5" />
                                    History
                                  </button>
                                  {setting.isEditable && !isBoolean && (
                                    <button
                                      className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-400/10"
                                      onClick={() => openEditor(setting)}
                                      type="button"
                                    >
                                      <Pencil className="size-3.5" />
                                      Edit value
                                    </button>
                                  )}
                                  <ChevronRight className="size-3.5 text-slate-300" />
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      </section>
                    );
                  },
                )}
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
                className="min-h-32 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none transition focus:border-yellow-500 focus:ring-4 focus:ring-yellow-400/10 dark:border-slate-700"
                onChange={(event) => setSettingValue(event.target.value)}
                required
                value={settingValue}
              />
            </label>
            <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-500 dark:bg-slate-950">
              Default value:{' '}
              <strong className="break-all">{editing.defaultValue || '—'}</strong>
            </div>
            {dialogError && (
              <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                {dialogError}
              </p>
            )}
            <button
              className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60 dark:bg-yellow-400 dark:text-slate-950 dark:hover:bg-yellow-300"
              disabled={updatingKey === editing.settingKey}
              type="submit"
            >
              {updatingKey === editing.settingKey && (
                <LoaderCircle className="size-4 animate-spin" />
              )}
              Save setting
            </button>
          </form>
        </div>
      )}

      {historyKey && (
        <div className="fixed inset-0 z-[70] flex justify-end">
          <button
            aria-label="Close setting history"
            className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm"
            onClick={() => setHistoryKey('')}
            type="button"
          />
          <aside className="relative h-full w-full max-w-2xl overflow-y-auto border-l border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-yellow-600">
                  Audit trail
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-950">Setting history</h2>
                <p className="mt-1 truncate text-xs text-slate-500">{historyKey}</p>
              </div>
              <button
                aria-label="Close setting history"
                className="grid size-9 place-items-center rounded-xl border border-slate-200 text-slate-500 dark:border-slate-700"
                onClick={() => setHistoryKey('')}
                type="button"
              >
                <X className="size-4" />
              </button>
            </div>

            {updatingKey === historyKey && (
              <div className="grid min-h-72 place-items-center">
                <LoaderCircle className="size-7 animate-spin text-yellow-500" />
              </div>
            )}
            {updatingKey !== historyKey && dialogError && (
              <p className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
                {dialogError}
              </p>
            )}
            {updatingKey !== historyKey &&
              !dialogError &&
              Array.isArray(historyData) &&
              historyData.length > 0 && (
                <div className="mt-6">
                  <DynamicTable rows={historyData} />
                </div>
              )}
            {updatingKey !== historyKey &&
              !dialogError &&
              Array.isArray(historyData) &&
              historyData.length === 0 && (
                <div className="mt-6">
                  <EmptyState
                    description="Changes to this setting will appear here."
                    title="No history recorded"
                  />
                </div>
              )}
          </aside>
        </div>
      )}
    </div>
  );
}
