// Mock data for the application

export const mockTransactions = [
  {
    id: '1',
    type: 'credit',
    amount: 2500.0,
    currency: 'USD',
    description: 'Salary Payment',
    date: '2025-11-28T10:30:00Z',
    status: 'completed',
    category: 'income',
  },
  {
    id: '2',
    type: 'debit',
    amount: 45.99,
    currency: 'USD',
    description: 'Netflix Subscription',
    date: '2025-11-27T14:22:00Z',
    status: 'completed',
    category: 'entertainment',
  },
  {
    id: '3',
    type: 'debit',
    amount: 125.50,
    currency: 'USD',
    description: 'Grocery Shopping',
    date: '2025-11-26T09:15:00Z',
    status: 'completed',
    category: 'shopping',
  },
  {
    id: '4',
    type: 'credit',
    amount: 500.0,
    currency: 'USD',
    description: 'Freelance Payment',
    date: '2025-11-25T16:45:00Z',
    status: 'completed',
    category: 'income',
  },
  {
    id: '5',
    type: 'debit',
    amount: 89.00,
    currency: 'USD',
    description: 'Restaurant Bill',
    date: '2025-11-24T19:30:00Z',
    status: 'pending',
    category: 'food',
  },
];

export const mockAccounts = [
  {
    id: '1',
    name: 'Main Checking',
    accountNumber: '****7890',
    balance: 12540.85,
    currency: 'USD',
    type: 'checking',
  },
  {
    id: '2',
    name: 'Savings Account',
    accountNumber: '****4532',
    balance: 45230.20,
    currency: 'USD',
    type: 'savings',
  },
  {
    id: '3',
    name: 'Euro Account',
    accountNumber: '****8921',
    balance: 3200.50,
    currency: 'EUR',
    type: 'checking',
  },
];

export const mockCards = [
  {
    id: '1',
    type: 'physical',
    cardNumber: '**** **** **** 4532',
    cardHolder: 'John Doe',
    expiryDate: '12/27',
    status: 'active',
    limit: 5000,
    spent: 1250.45,
    currency: 'USD',
  },
  {
    id: '2',
    type: 'virtual',
    cardNumber: '**** **** **** 8921',
    cardHolder: 'John Doe',
    expiryDate: '06/26',
    status: 'active',
    limit: 2000,
    spent: 450.20,
    currency: 'USD',
  },
];

export const mockNotifications = [
  {
    id: '1',
    title: 'Payment Received',
    message: 'You received $2,500 from Acme Corp',
    date: '2025-11-28T10:30:00Z',
    read: false,
    type: 'success',
  },
  {
    id: '2',
    title: 'Card Transaction',
    message: 'Your card ending in 4532 was used for $45.99',
    date: '2025-11-27T14:22:00Z',
    read: false,
    type: 'info',
  },
  {
    id: '3',
    title: 'Security Alert',
    message: 'New device logged in from Chrome on Windows',
    date: '2025-11-26T08:15:00Z',
    read: true,
    type: 'warning',
  },
];

export const mockBeneficiaries = [
  {
    id: '1',
    name: 'Alice Johnson',
    accountNumber: '****1234',
    bank: 'First National Bank',
  },
  {
    id: '2',
    name: 'Bob Smith',
    accountNumber: '****5678',
    bank: 'Metro Bank',
  },
];

export const mockUsers = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    accountNumber: '****7890',
    status: 'active',
    kycStatus: 'approved',
    balance: 12540.85,
    joinDate: '2025-01-15',
  },
  {
    id: '2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    accountNumber: '****3421',
    status: 'active',
    kycStatus: 'approved',
    balance: 8934.20,
    joinDate: '2025-02-20',
  },
  {
    id: '3',
    firstName: 'Mike',
    lastName: 'Johnson',
    email: 'mike.j@example.com',
    accountNumber: '****9012',
    status: 'suspended',
    kycStatus: 'pending',
    balance: 4521.00,
    joinDate: '2025-03-10',
  },
];

export const mockCardRequests = [
  {
    id: '1',
    userId: '1',
    userName: 'John Doe',
    cardType: 'physical',
    status: 'pending',
    requestDate: '2025-11-25',
  },
  {
    id: '2',
    userId: '2',
    userName: 'Jane Smith',
    cardType: 'virtual',
    status: 'approved',
    requestDate: '2025-11-20',
    approvedDate: '2025-11-21',
  },
];
