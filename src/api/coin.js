import apiClient from './client';

export function getUsersCoinSummary(request) {
  return apiClient.post('/api/Coin/admin/users-summary', request);
}

export function getPendingKyc(request) {
  return apiClient.post('/api/Coin/admin/pending-kyc', request);
}

export function verifyKyc(request) {
  return apiClient.post('/api/Coin/admin/verify-kyc', request);
}

export function addCoinsToBucket(request) {
  return apiClient.post('/api/Coin/admin/add-coins-to-bucket', request);
}

export function getAdminBucketBalance(request) {
  return apiClient.post('/api/Coin/admin/bucket-balance', request);
}

export function getAdminTransactions(adminId, limit = 50) {
  return apiClient.get('/api/Coin/admin/transactions', {
    params: { adminId, limit },
  });
}
