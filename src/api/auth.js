import apiClient from './client';

export function login({ userName, password }) {
  return apiClient.post('/api/Auth/Auth', {
    userName,
    password,
  });
}

export function registerAdmin({ username, email, mobileNo, password }) {
  return apiClient.post('/api/Auth/AdminRegistration/admin-registration', {
    username,
    email,
    mobileNo,
    password,
  });
}
