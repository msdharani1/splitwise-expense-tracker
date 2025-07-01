import AsyncStorage from '@react-native-async-storage/async-storage';
import { Friend, Transaction } from '@/types';

const FRIENDS_KEY = 'expense_tracker_friends';
const TRANSACTIONS_KEY = 'expense_tracker_transactions';

export const saveFriends = async (friends: Friend[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(FRIENDS_KEY, JSON.stringify(friends));
  } catch (error) {
    console.error('Error saving friends:', error);
  }
};

export const loadFriends = async (): Promise<Friend[]> => {
  try {
    const data = await AsyncStorage.getItem(FRIENDS_KEY);
    if (data) {
      const friends = JSON.parse(data);
      return friends.map((friend: any) => ({
        ...friend,
        lastUpdated: new Date(friend.lastUpdated),
      }));
    }
    return [];
  } catch (error) {
    console.error('Error loading friends:', error);
    return [];
  }
};

export const saveTransactions = async (transactions: Transaction[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
  } catch (error) {
    console.error('Error saving transactions:', error);
  }
};

export const loadTransactions = async (): Promise<Transaction[]> => {
  try {
    const data = await AsyncStorage.getItem(TRANSACTIONS_KEY);
    if (data) {
      const transactions = JSON.parse(data);
      return transactions.map((transaction: any) => ({
        ...transaction,
        date: new Date(transaction.date),
      }));
    }
    return [];
  } catch (error) {
    console.error('Error loading transactions:', error);
    return [];
  }
};