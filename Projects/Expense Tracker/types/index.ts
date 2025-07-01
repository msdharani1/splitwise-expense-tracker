export interface Friend {
  id: string;
  name: string;
  balance: number;
  lastUpdated: Date;
}

export interface Transaction {
  id: string;
  friendId: string;
  description: string;
  amount: number;
  type: 'I_PAID' | 'THEY_PAID';
  date: Date;
}

export interface FriendWithTransactions extends Friend {
  transactions: Transaction[];
}