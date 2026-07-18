import { useState } from 'react';
import {
  Download,
  FileUp,
  LoaderCircle,
  Plus,
  Search,
  Upload,
  X,
} from 'lucide-react';
import {
  bulkUpdateTranslations,
  exportTranslations,
  getLanguages,
  getLanguageTranslations,
  getMissingTranslations,
  getTranslationKeys,
  importTranslations,
  saveTranslation,
} from '../../api/localization';
import { EmptyState, ErrorState, LoadingState } from '../../components/AsyncState';
import DataTable from '../../components/DataTable';
import DynamicTable from '../../components/DynamicTable';
import PageHeader from '../../components/PageHeader';
import useAsyncData from '../../hooks/useAsyncData';

export default function TranslationsPage() {
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [languageCode, setLanguageCode] = useState('en');
  const [operation, setOperation] = useState(null);
  const [operationData, setOperationData] = useState(null);
  const [operationError, setOperationError] = useState('');
  const [isOperating, setIsOperating] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [translationForm, setTranslationForm] = useState({
    languageCode: 'en',
    resourceKey: '',
    translationValue: '',
    moduleName: '',
    description: '',
  });
  const [bulkJson, setBulkJson] = useState('[]');
  const [importFile, setImportFile] = useState(null);
  const { data, error, isLoading, reload } = useAsyncData(
    () => getTranslationKeys(search || undefined),
    [search],
  );
  const {
    data: languagesData,
    error: languagesError,
    isLoading: languagesLoading,
  } = useAsyncData(() => getLanguages(true), []);
  const keys = Array.isArray(data) ? data : [];
  const languages = Array.isArray(languagesData) ? languagesData : [];

  function submitSearch(event) {
    event.preventDefault();
    setSearch(searchDraft.trim());
  }

  async function loadLanguageData(type) {
    setOperation(type);
    setOperationData(null);
    setOperationError('');
    setIsOperating(true);

    try {
      const response =
        type === 'missing'
          ? await getMissingTranslations(languageCode)
          : await getLanguageTranslations(languageCode);
      setOperationData(response.data.data);
    } catch (requestError) {
      setOperationError(
        requestError.response?.status
          ? `Request failed with status ${requestError.response.status}.`
          : 'Unable to load translation data.',
      );
    } finally {
      setIsOperating(false);
    }
  }

  async function submitTranslation(event) {
    event.preventDefault();
    setIsOperating(true);
    setOperationError('');

    try {
      if (operation === 'bulk') {
        await bulkUpdateTranslations({
          languageCode,
          translations: JSON.parse(bulkJson),
        });
      } else {
        await saveTranslation(translationForm);
      }
      setOperation(null);
      setActionMessage('Translation changes saved successfully.');
    } catch (requestError) {
      setOperationError(
        requestError instanceof SyntaxError
          ? 'Bulk translations must be a valid JSON array.'
          : requestError.response?.status
            ? `Save failed with status ${requestError.response.status}.`
            : 'Unable to save translation changes.',
      );
    } finally {
      setIsOperating(false);
    }
  }

  async function submitImport(event) {
    event.preventDefault();

    if (!importFile) {
      return;
    }

    setIsOperating(true);
    setOperationError('');

    try {
      await importTranslations(languageCode, importFile);
      setOperation(null);
      setImportFile(null);
      setActionMessage(`Translation file imported successfully for ${languageCode}.`);
    } catch (requestError) {
      setOperationError(
        requestError.response?.status
          ? `Import failed with status ${requestError.response.status}.`
          : 'Unable to import this file.',
      );
    } finally {
      setIsOperating(false);
    }
  }

  async function downloadExport() {
    setIsOperating(true);
    setOperationError('');

    try {
      const response = await exportTranslations(languageCode, 'csv');
      const blob = new Blob([
        typeof response.data === 'string' ? response.data : JSON.stringify(response.data),
      ]);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${languageCode}-translations.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
      setActionMessage('Translation export downloaded.');
    } catch (requestError) {
      setOperationError(
        requestError.response?.status
          ? `Export failed with status ${requestError.response.status}.`
          : 'Unable to export translations.',
      );
    } finally {
      setIsOperating(false);
    }
  }

  const columns = [
    { key: 'keyId', label: 'ID' },
    { key: 'resourceKey', label: 'Resource key' },
    { key: 'moduleName', label: 'Module' },
    { key: 'description', label: 'Description' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        action={
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white"
            onClick={() => setOperation('single')}
            type="button"
          >
            <Plus className="size-4" />
            Add translation
          </button>
        }
        description="Search translation resources used across the platform."
        eyebrow="Localization"
        title="Translation keys"
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
          <label className="block xl:w-64">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Language
            </span>
            <select
              className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-yellow-500"
              disabled={languagesLoading || languages.length === 0}
              onChange={(event) => {
                setLanguageCode(event.target.value);
                setTranslationForm((current) => ({
                  ...current,
                  languageCode: event.target.value,
                }));
              }}
              value={languageCode}
            >
              {languagesLoading && <option value="">Loading languages…</option>}
              {!languagesLoading && languages.length === 0 && (
                <option value="">No languages available</option>
              )}
              {languages.map((language) => (
                <option key={language.languageId} value={language.languageCode}>
                  {language.nativeName} — {language.languageName} ({language.languageCode})
                </option>
              ))}
            </select>
          </label>
          <div className="grid flex-1 grid-cols-1 gap-2 min-[400px]:grid-cols-2 sm:grid-cols-3 xl:flex">
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold leading-4"
              onClick={() => loadLanguageData('language')}
              type="button"
            >
              <Search className="size-3.5" />
              Language values
            </button>
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold leading-4"
              onClick={() => loadLanguageData('missing')}
              type="button"
            >
              <Search className="size-3.5" />
              Missing values
            </button>
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold leading-4"
              onClick={() => setOperation('bulk')}
              type="button"
            >
              <Upload className="size-3.5" />
              Bulk update
            </button>
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold leading-4"
              onClick={() => setOperation('import')}
              type="button"
            >
              <FileUp className="size-3.5" />
              Import
            </button>
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold leading-4"
              disabled={isOperating}
              onClick={downloadExport}
              type="button"
            >
              <Download className="size-3.5" />
              Export CSV
            </button>
          </div>
        </div>
        {operationError && !operation && (
          <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{operationError}</p>
        )}
        {languagesError && (
          <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            Unable to load languages: {languagesError}
          </p>
        )}
      </section>

      {actionMessage && (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
          {actionMessage}
        </div>
      )}

      <form
        className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row"
        onSubmit={submitSearch}
      >
        <label className="relative flex-1">
          <span className="sr-only">Search translation keys</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:border-yellow-500 focus:ring-4 focus:ring-yellow-400/10"
            onChange={(event) => setSearchDraft(event.target.value)}
            placeholder="Search resource keys"
            value={searchDraft}
          />
        </label>
        <button
          className="h-11 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800"
          type="submit"
        >
          Search
        </button>
      </form>

      {isLoading && <LoadingState label="Loading translation keys…" />}
      {!isLoading && error && <ErrorState message={error} onRetry={reload} />}
      {!isLoading && !error && keys.length === 0 && (
        <EmptyState title="No translation keys found" />
      )}
      {!isLoading && !error && keys.length > 0 && (
        <DataTable columns={columns} getRowKey={(item) => item.keyId} rows={keys} />
      )}

      {operation && (
        <div className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto p-3 sm:p-4">
          <button
            aria-label="Close translation dialog"
            className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm"
            onClick={() => setOperation(null)}
            type="button"
          />
          <section className="relative my-3 w-full max-w-3xl rounded-2xl bg-white p-5 shadow-2xl sm:my-6 sm:p-6">
            <button
              aria-label="Close translation dialog"
              className="absolute right-3 top-3 grid size-11 place-items-center rounded-xl text-slate-400 hover:bg-slate-100"
              onClick={() => setOperation(null)}
              type="button"
            >
              <X className="size-4" />
            </button>
            <h2 className="pr-12 text-lg font-bold text-slate-950">
              {operation === 'single'
                ? 'Add translation'
                : operation === 'bulk'
                  ? 'Bulk update translations'
                  : operation === 'import'
                    ? 'Import translations'
                    : operation === 'missing'
                      ? `Missing ${languageCode} translations`
                      : `${languageCode} translations`}
            </h2>

            {isOperating && (
              <div className="grid min-h-56 place-items-center">
                <LoaderCircle className="size-7 animate-spin text-yellow-500" />
              </div>
            )}
            {!isOperating && operationError && (
              <p className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                {operationError}
              </p>
            )}
            {!isOperating && (operation === 'language' || operation === 'missing') && (
              <div className="mt-5">
                {Array.isArray(operationData) && operationData.length > 0 ? (
                  <DynamicTable rows={operationData} />
                ) : (
                  <EmptyState title="No translation records found" />
                )}
              </div>
            )}
            {!isOperating && operation === 'single' && (
              <form className="mt-5 space-y-4" onSubmit={submitTranslation}>
                {[
                  ['languageCode', 'Language code'],
                  ['resourceKey', 'Resource key'],
                  ['translationValue', 'Translation value'],
                  ['moduleName', 'Module name'],
                  ['description', 'Description'],
                ].map(([key, label]) => (
                  <label className="block" key={key}>
                    <span className="mb-2 block text-sm font-semibold text-slate-700">
                      {label}
                    </span>
                    <input
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-yellow-500"
                      onChange={(event) =>
                        setTranslationForm((current) => ({
                          ...current,
                          [key]: event.target.value,
                        }))
                      }
                      required={['languageCode', 'resourceKey', 'translationValue'].includes(key)}
                      value={translationForm[key]}
                    />
                  </label>
                ))}
                <button
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-sm font-semibold text-white"
                  type="submit"
                >
                  Save translation
                </button>
              </form>
            )}
            {!isOperating && operation === 'bulk' && (
              <form className="mt-5" onSubmit={submitTranslation}>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    Translations JSON array
                  </span>
                  <textarea
                    className="min-h-56 w-full rounded-xl border border-slate-200 p-3 font-mono text-xs outline-none focus:border-yellow-500"
                    onChange={(event) => setBulkJson(event.target.value)}
                    value={bulkJson}
                  />
                </label>
                <button
                  className="mt-4 h-11 w-full rounded-xl bg-slate-900 text-sm font-semibold text-white"
                  type="submit"
                >
                  Save bulk translations
                </button>
              </form>
            )}
            {!isOperating && operation === 'import' && (
              <form className="mt-5 space-y-4" onSubmit={submitImport}>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    Import into language
                  </span>
                  <select
                    className="min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-yellow-500"
                    disabled={languagesLoading || languages.length === 0}
                    onChange={(event) => setLanguageCode(event.target.value)}
                    required
                    value={languageCode}
                  >
                    {languages.map((language) => (
                      <option key={language.languageId} value={language.languageCode}>
                        {language.nativeName} — {language.languageName} (
                        {language.languageCode})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    Translation file
                  </span>
                  <input
                    className="w-full rounded-xl border border-dashed border-slate-300 p-3 text-xs sm:p-5 sm:text-sm"
                    onChange={(event) => setImportFile(event.target.files?.[0] || null)}
                    required
                    type="file"
                  />
                </label>
                {importFile && (
                  <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                    Selected file: <strong>{importFile.name}</strong>
                  </div>
                )}
                <button
                  className="h-11 w-full rounded-xl bg-slate-900 text-sm font-semibold text-white disabled:opacity-50"
                  disabled={!languageCode || !importFile || isOperating}
                  type="submit"
                >
                  Import into {languageCode || 'language'}
                </button>
              </form>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
