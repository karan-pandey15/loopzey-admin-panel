import apiClient from './client';

export function getLanguages(includeInactive = true) {
  return apiClient.get('/api/AdminLanguage', {
    params: { includeInactive },
  });
}

export function getLanguage(id) {
  return apiClient.get(`/api/AdminLanguage/${id}`);
}

export function saveLanguage(request) {
  return apiClient.post('/api/AdminLanguage', request);
}

export function deleteLanguage(id) {
  return apiClient.delete(`/api/AdminLanguage/${id}`);
}

export function getTranslationKeys(searchTerm) {
  return apiClient.get('/api/AdminTranslation/keys', {
    params: { searchTerm },
  });
}

export function getLanguageTranslations(languageCode) {
  return apiClient.get(`/api/AdminTranslation/language/${languageCode}`);
}

export function saveTranslation(request) {
  return apiClient.post('/api/AdminTranslation', request);
}

export function bulkUpdateTranslations(request) {
  return apiClient.post('/api/AdminTranslation/bulk', request);
}

export function getMissingTranslations(languageCode) {
  return apiClient.get(`/api/AdminTranslation/missing/${languageCode}`);
}

export function exportTranslations(languageCode, format = 'csv') {
  return apiClient.get(`/api/AdminTranslation/export/${languageCode}`, {
    params: { format },
  });
}

export function importTranslations(languageCode, file) {
  const formData = new FormData();
  formData.append('file', file);

  return apiClient.post(`/api/AdminTranslation/import/${languageCode}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}
