import apiClient from './client';

export function getSettings() {
  return apiClient.get('/api/AdminSettings');
}

export function updateSetting({ settingKey, settingValue }) {
  return apiClient.post('/api/AdminSettings/update', {
    settingKey,
    settingValue,
  });
}

export function getSettingHistory(settingKey) {
  return apiClient.get(`/api/AdminSettings/history/${encodeURIComponent(settingKey)}`);
}
