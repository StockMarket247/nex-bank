const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message?: string,
  ) {
    super(message || statusText);
    this.name = 'ApiError';
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem('accessToken');
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new ApiError(response.status, response.statusText, errorData.message || errorData.error);
  }

  return response.json();
}

export const api = {
  // Auth
  auth: {
    register: (data: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone?: string;
      dateOfBirth?: string;
      address?: string;
      city?: string;
      country?: string;
      postalCode?: string;
    }) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

    login: (email: string, password: string) =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    adminLogin: (email: string, password: string) =>
      request('/auth/admin/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    refreshToken: (refreshToken: string) =>
      request('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      }),
  },

  // Users
  users: {
    getMe: () => request('/users/me'),
    updateProfile: (data: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      dateOfBirth?: string;
      address?: string;
      city?: string;
      country?: string;
      postalCode?: string;
    }) => request('/users/me', { method: 'PUT', body: JSON.stringify(data) }),
    hasTransferPin: () => request('/users/me/transfer-pin'),
    createTransferPin: (pin: string) => request('/users/me/transfer-pin', { method: 'POST', body: JSON.stringify({ pin }) }),
    verifyTransferPin: (pin: string) => request('/users/me/transfer-pin/verify', { method: 'POST', body: JSON.stringify({ pin }) }),
    updateTransferPin: (currentPin: string, newPin: string) => request('/users/me/transfer-pin', { method: 'PUT', body: JSON.stringify({ currentPin, newPin }) }),
    getAll: (params?: { page?: number; limit?: number; status?: string }) => {
      const query = new URLSearchParams();
      if (params?.page) query.append('page', params.page.toString());
      if (params?.limit) query.append('limit', params.limit.toString());
      if (params?.status) query.append('status', params.status);
      return request(`/users?${query.toString()}`);
    },
    getById: (id: string) => request(`/users/${id}`),
    getTierInfo: () => request('/users/me/tier-info'),
    upgradeTier: (targetTier: 'TIER_1' | 'TIER_2' | 'TIER_3') =>
      request('/users/me/upgrade-tier', {
        method: 'POST',
        body: JSON.stringify({ targetTier }),
      }),
    upgradeToTier2: (data: {
      identityNumber: string;
      documentType: string;
      frontImage: string;
      backImage?: string;
    }) => request('/users/me/upgrade-tier2', { method: 'POST', body: JSON.stringify(data) }),
    upgradeToTier3: (data: {
      address: string;
      city: string;
      country: string;
      postalCode: string;
      documentType: string;
      documentImage: string;
    }) => request('/users/me/upgrade-tier3', { method: 'POST', body: JSON.stringify(data) }),
    getVerificationStatus: () => request('/users/me/verification-status'),
  },

  // Accounts
  accounts: {
    create: (data: { type: 'SAVINGS' | 'CURRENT'; currency?: string; initialBalance?: number }) =>
      request('/accounts', { method: 'POST', body: JSON.stringify(data) }),
    getMyAccounts: () => request('/accounts/me'),
    getById: (id: string) => request(`/accounts/${id}`),
    freeze: (id: string, isFrozen: boolean) =>
      request(`/accounts/${id}/freeze`, {
        method: 'PUT',
        body: JSON.stringify({ isFrozen }),
      }),
    getAll: (params?: { page?: number; limit?: number }) => {
      const query = new URLSearchParams();
      if (params?.page) query.append('page', params.page.toString());
      if (params?.limit) query.append('limit', params.limit.toString());
      return request(`/accounts?${query.toString()}`);
    },
  },

  // Transactions
  transactions: {
    createInternalTransfer: (data: {
      fromAccountId: string;
      toAccountNumber: string;
      amount: number;
      reference?: string;
      description?: string;
    }) =>
      request('/transactions/internal-transfer', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getMyTransactions: (params?: { page?: number; limit?: number; accountId?: string }) => {
      const query = new URLSearchParams();
      if (params?.page) query.append('page', params.page.toString());
      if (params?.limit) query.append('limit', params.limit.toString());
      if (params?.accountId) query.append('accountId', params.accountId);
      return request(`/transactions/me?${query.toString()}`);
    },
    getById: (id: string) => request(`/transactions/${id}`),
    getAll: (params?: { page?: number; limit?: number; accountId?: string }) => {
      const query = new URLSearchParams();
      if (params?.page) query.append('page', params.page.toString());
      if (params?.limit) query.append('limit', params.limit.toString());
      if (params?.accountId) query.append('accountId', params.accountId);
      return request(`/transactions?${query.toString()}`);
    },
  },

  // Transfers
  transfers: {
    createExternal: (data: {
      accountId: string;
      amount: number;
      recipientBankName: string;
      recipientBankCode?: string;
      recipientAccountNumber: string;
      recipientName: string;
      recipientEmail?: string;
      recipientPhone?: string;
      reference?: string;
      description?: string;
    }) =>
      request('/transfers/external', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    createInternational: (data: {
      accountId: string;
      amount: number;
      currency: string;
      recipientCountry: string;
      recipientAccountNumber: string;
      swiftBicCode?: string;
      recipientName: string;
      recipientEmail?: string;
      recipientPhone?: string;
      reference?: string;
      description?: string;
    }) =>
      request('/transfers/international', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getMyTransfers: (params?: { page?: number; limit?: number }) => {
      const query = new URLSearchParams();
      if (params?.page) query.append('page', params.page.toString());
      if (params?.limit) query.append('limit', params.limit.toString());
      return request(`/transfers/me?${query.toString()}`);
    },
    getPending: (params?: { page?: number; limit?: number }) => {
      const query = new URLSearchParams();
      if (params?.page) query.append('page', params.page.toString());
      if (params?.limit) query.append('limit', params.limit.toString());
      return request(`/transfers/pending?${query.toString()}`);
    },
    approve: (requestId: string, notes?: string) =>
      request(`/transfers/${requestId}/approve`, {
        method: 'PUT',
        body: JSON.stringify({ notes }),
      }),
    reject: (requestId: string, reason: string) =>
      request(`/transfers/${requestId}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ reason }),
      }),
    getById: (requestId: string) => request(`/transfers/${requestId}`),
    getAll: (params?: { page?: number; limit?: number; status?: string }) => {
      const query = new URLSearchParams();
      if (params?.page) query.append('page', params.page.toString());
      if (params?.limit) query.append('limit', params.limit.toString());
      if (params?.status) query.append('status', params.status);
      return request(`/transfers?${query.toString()}`);
    },
  },

  // Admin
  admin: {
    getMe: () => request('/admin/me'),
    getDashboard: () => request('/admin/dashboard'),
    suspendUser: (userId: string, suspended: boolean, reason?: string) =>
      request(`/admin/users/${userId}/suspend`, {
        method: 'PUT',
        body: JSON.stringify({ suspended, reason }),
      }),
    closeUser: (userId: string) =>
      request(`/admin/users/${userId}/close`, { method: 'PUT' }),
    adjustBalance: (accountId: string, amount: number, reason?: string) =>
      request(`/admin/accounts/${accountId}/adjust-balance`, {
        method: 'PUT',
        body: JSON.stringify({ amount, reason }),
      }),
    updateTransactionStatus: (transactionId: string, status: string, notes?: string) =>
      request(`/admin/transactions/${transactionId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, notes }),
      }),
    sendNotification: (data: { title: string; message: string; userIds?: string[]; type?: string }) =>
      request('/admin/notifications/send', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    createInternalTransfer: (data: {
      fromUserId: string;
      toUserId: string;
      amount: number;
      fromAccountId?: string;
      toAccountId?: string;
      reference?: string;
      description?: string;
    }) =>
      request('/admin/transfers/internal', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    createExternalTransfer: (data: {
      fromUserId: string;
      fromAccountId?: string;
      amount: number;
      recipientBankName: string;
      recipientAccountNumber: string;
      recipientName: string;
      recipientEmail?: string;
      recipientPhone?: string;
      recipientBankCode?: string;
      status?: string;
      reference?: string;
      description?: string;
    }) =>
      request('/admin/transfers/external', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getVerifications: (params?: { page?: number; limit?: number; status?: string }) => {
      const query = new URLSearchParams();
      if (params?.page) query.append('page', params.page.toString());
      if (params?.limit) query.append('limit', params.limit.toString());
      if (params?.status) query.append('status', params.status);
      return request(`/admin/verifications?${query.toString()}`);
    },
    updateVerificationStatus: (verificationId: string, data: {
      status: string;
      rejectionReason?: string;
      notes?: string;
    }) => request(`/admin/verifications/${verificationId}/status`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  },

  // Audit
  audit: {
    getLogs: (params?: { page?: number; limit?: number; action?: string; entityType?: string }) => {
      const query = new URLSearchParams();
      if (params?.page) query.append('page', params.page.toString());
      if (params?.limit) query.append('limit', params.limit.toString());
      if (params?.action) query.append('action', params.action);
      if (params?.entityType) query.append('entityType', params.entityType);
      return request(`/audit?${query.toString()}`);
    },
    getEntityLogs: (entityType: string, entityId: string) =>
      request(`/audit/entity/${entityType}/${entityId}`),
  },
};

export { ApiError };

