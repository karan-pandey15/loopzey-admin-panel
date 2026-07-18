import apiClient from './client';

export function getDashboardStats() {
  return apiClient.get('/api/Admin/dashboard/stats');
}

export function getUsers(params) {
  return apiClient.get('/api/Admin/users', { params });
}

export function getUser(userId) {
  return apiClient.get(`/api/Admin/users/${userId}`);
}

export function deleteUser(userId) {
  return apiClient.delete(`/api/Admin/users/${userId}`);
}

export function updateUserBan(userId, { isBanned, reason }) {
  return apiClient.put(`/api/Admin/users/${userId}/ban`, {
    userId,
    isBanned,
    reason,
  });
}

export function updateUserActive(userId, { isActive }) {
  return apiClient.put(`/api/Admin/users/${userId}/active`, {
    userId,
    isActive,
  });
}

export function getUserFollowers(userId, params) {
  return apiClient.get(`/api/Admin/users/${userId}/followers`, { params });
}

export function getUserFollowing(userId, params) {
  return apiClient.get(`/api/Admin/users/${userId}/following`, { params });
}

export function getPosts(params) {
  return apiClient.get('/api/Admin/posts', { params });
}

export function deletePost(postId) {
  return apiClient.delete(`/api/Admin/posts/${postId}`);
}

export function getReels(params) {
  return apiClient.get('/api/Admin/reels', { params });
}

export function deleteReel(reelId) {
  return apiClient.delete(`/api/Admin/reels/${reelId}`);
}

export function getReports({ PageNumber, PageSize, Status }) {
  return apiClient.get('/api/Admin/reports', {
    params: {
      PageNumber,
      PageSize,
      Status,
    },
  });
}

export function resolveReport(reportId, { resolution }) {
  return apiClient.put(`/api/Admin/reports/${reportId}/resolve`, {
    reportId,
    resolution,
  });
}
