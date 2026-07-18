import apiClient from './client';

export function login({ userName, password }) {
  return apiClient.post('/api/Auth/Auth', {
    userName,
    password,
  });
}

export function sendLoginOtp(email) {
  return apiClient.post('/api/Common/sendotp-mail', {
    email,
    mobileNo: null,
  });
}

export function verifyLoginOtp({ email, otp }) {
  return apiClient.post('/api/Auth/VerifyOtp/verify-otp', {
    email,
    mobileNo: null,
    otp,
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

export function getPendingApprovals() {
  return apiClient.get('/api/Auth/PendingApprovals/pending-approvals');
}

export function updateApproval({
  approvalId,
  approvalStatus,
  approvedBy,
  rejectionReason,
}) {
  const payload = {
    approvalId,
    approvalStatus,
    approvedBy,
    rejectionReason,
  };

  return apiClient.post('/api/Auth/UpdateApproval/update-role-approval', payload);
}
