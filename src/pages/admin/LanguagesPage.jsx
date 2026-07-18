import { useState } from 'react';
import { LoaderCircle, Pencil, Plus, Trash2, X } from 'lucide-react';
import {
  deleteLanguage,
  getLanguage,
  getLanguages,
  saveLanguage,
} from '../../api/localization';
import { EmptyState, ErrorState, LoadingState } from '../../components/AsyncState';
import ConfirmDialog from '../../components/ConfirmDialog';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import useAsyncData from '../../hooks/useAsyncData';

export default function LanguagesPage() {
  const { data, error, isLoading, reload } = useAsyncData(() => getLanguages(true), []);
  const languages = Array.isArray(data) ? data : [];
  const [form, setForm] = useState(null);
  const [languageToDelete, setLanguageToDelete] = useState(null);
  const [isMutating, setIsMutating] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  function openCreate() {
    setForm({
      languageCode: '',
      languageName: '',
      nativeName: '',
      countryCode: '',
      isDefault: false,
      isRTL: false,
      isActive: true,
      displayOrder: 0,
    });
  }

  async function openEditor(languageId) {
    setIsMutating(true);
    setActionMessage('');

    try {
      const response = await getLanguage(languageId);
      setForm(response.data.data);
    } catch (requestError) {
      setActionMessage(
        requestError.response?.status
          ? `Language request failed with status ${requestError.response.status}.`
          : 'Unable to load this language.',
      );
    } finally {
      setIsMutating(false);
    }
  }

  async function submitLanguage(event) {
    event.preventDefault();
    setIsMutating(true);
    setActionMessage('');

    try {
      await saveLanguage(form);
      setForm(null);
      setActionMessage('Language saved successfully.');
      await reload();
    } catch (requestError) {
      setActionMessage(
        requestError.response?.status
          ? `Save failed with status ${requestError.response.status}.`
          : 'Unable to save this language.',
      );
    } finally {
      setIsMutating(false);
    }
  }

  async function removeLanguage() {
    setIsMutating(true);
    setActionMessage('');

    try {
      await deleteLanguage(languageToDelete.languageId);
      setLanguageToDelete(null);
      setActionMessage('Language deleted successfully.');
      await reload();
    } catch (requestError) {
      setActionMessage(
        requestError.response?.status
          ? `Delete failed with status ${requestError.response.status}.`
          : 'Unable to delete this language.',
      );
    } finally {
      setIsMutating(false);
    }
  }

  const columns = [
    { key: 'languageName', label: 'Language' },
    { key: 'nativeName', label: 'Native name' },
    { key: 'languageCode', label: 'Code' },
    { key: 'countryCode', label: 'Country' },
    { key: 'isDefault', label: 'Default' },
    { key: 'isRTL', label: 'Right to left' },
    { key: 'isActive', label: 'Active' },
    { key: 'displayOrder', label: 'Order' },
    {
      key: 'actions',
      label: 'Actions',
      render: (language) => (
        <div className="flex justify-end gap-1 md:justify-start">
          <button
            className="grid size-11 place-items-center rounded-xl text-slate-500 hover:bg-blue-50 hover:text-blue-600"
            onClick={() => openEditor(language.languageId)}
            title="Edit language"
            type="button"
          >
            <Pencil className="size-4" />
          </button>
          <button
            className="grid size-11 place-items-center rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600"
            onClick={() => setLanguageToDelete(language)}
            title="Delete language"
            type="button"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        action={
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white"
            onClick={openCreate}
            type="button"
          >
            <Plus className="size-4" />
            Add language
          </button>
        }
        description="Manage supported languages and locale behavior."
        eyebrow="Localization"
        title="Languages"
      />

      {actionMessage && (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
          {actionMessage}
        </div>
      )}

      {isLoading && <LoadingState label="Loading languages…" />}
      {!isLoading && error && <ErrorState message={error} onRetry={reload} />}
      {!isLoading && !error && languages.length === 0 && (
        <EmptyState title="No languages configured" />
      )}
      {!isLoading && !error && languages.length > 0 && (
        <DataTable
          columns={columns}
          getRowKey={(language) => language.languageId}
          rows={languages}
        />
      )}

      {form && (
        <div className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto p-3 sm:p-4">
          <button
            aria-label="Close language form"
            className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm"
            onClick={() => setForm(null)}
            type="button"
          />
          <form
            className="relative my-3 w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl sm:my-6 sm:p-6"
            onSubmit={submitLanguage}
          >
            <button
              aria-label="Close language form"
              className="absolute right-3 top-3 grid size-11 place-items-center rounded-xl text-slate-400 hover:bg-slate-100"
              onClick={() => setForm(null)}
              type="button"
            >
              <X className="size-4" />
            </button>
            <h2 className="pr-12 text-lg font-bold text-slate-950">
              {form.languageId ? 'Edit language' : 'Add language'}
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {[
                ['languageCode', 'Language code'],
                ['languageName', 'Language name'],
                ['nativeName', 'Native name'],
                ['countryCode', 'Country code'],
              ].map(([key, label]) => (
                <label className="block" key={key}>
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    {label}
                  </span>
                  <input
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-yellow-500"
                    onChange={(event) =>
                      setForm((current) => ({ ...current, [key]: event.target.value }))
                    }
                    required
                    value={form[key]}
                  />
                </label>
              ))}
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Display order
                </span>
                <input
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-yellow-500"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      displayOrder: Number(event.target.value),
                    }))
                  }
                  type="number"
                  value={form.displayOrder}
                />
              </label>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                ['isDefault', 'Default'],
                ['isRTL', 'Right to left'],
                ['isActive', 'Active'],
              ].map(([key, label]) => (
                <label
                  className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-sm font-medium text-slate-700"
                  key={key}
                >
                  <input
                    checked={form[key]}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, [key]: event.target.checked }))
                    }
                    type="checkbox"
                  />
                  {label}
                </label>
              ))}
            </div>
            <button
              className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-sm font-semibold text-white"
              disabled={isMutating}
              type="submit"
            >
              {isMutating && <LoaderCircle className="size-4 animate-spin" />}
              Save language
            </button>
          </form>
        </div>
      )}

      <ConfirmDialog
        confirmLabel="Delete language"
        description={`This removes ${languageToDelete?.languageName || 'the selected language'} from the platform.`}
        isLoading={isMutating}
        onClose={() => setLanguageToDelete(null)}
        onConfirm={removeLanguage}
        open={Boolean(languageToDelete)}
        title="Delete this language?"
      />
    </div>
  );
}
