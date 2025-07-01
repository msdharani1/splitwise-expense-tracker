import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react-native';
import { Friend, Transaction, FriendWithTransactions } from '@/types';
import { TransactionCard } from '@/components/TransactionCard';
import { AddTransactionModal } from '@/components/AddTransactionModal';
import { loadFriends, saveFriends, loadTransactions, saveTransactions } from '@/utils/storage';
import { formatCurrency, getBalanceColor, getBalanceText } from '@/utils/currency';

export default function PersonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [friend, setFriend] = useState<FriendWithTransactions | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    
    try {
      const [friends, transactions] = await Promise.all([
        loadFriends(),
        loadTransactions(),
      ]);
      
      const foundFriend = friends.find(f => f.id === id);
      if (foundFriend) {
        const friendTransactions = transactions.filter(t => t.friendId === id);
        setFriend({
          ...foundFriend,
          transactions: friendTransactions,
        });
      } else {
        // Friend not found, navigate back
        router.back();
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load friend data');
      router.back();
    }
  };

  const calculateBalance = (transactions: Transaction[]): number => {
    return transactions.reduce((balance, transaction) => {
      if (transaction.type === 'I_PAID') {
        return balance + transaction.amount; // They owe me
      } else {
        return balance - transaction.amount; // I owe them
      }
    }, 0);
  };

  const updateFriendBalance = async (friendId: string, transactions: Transaction[]) => {
    try {
      const friends = await loadFriends();
      const friendIndex = friends.findIndex(f => f.id === friendId);
      
      if (friendIndex !== -1) {
        friends[friendIndex].balance = calculateBalance(transactions);
        friends[friendIndex].lastUpdated = new Date();
        await saveFriends(friends);
      }
    } catch (error) {
      console.error('Error updating friend balance:', error);
    }
  };

  const handleAddTransaction = async (description: string, amount: number, type: 'I_PAID' | 'THEY_PAID') => {
    if (!friend) return;

    try {
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        friendId: friend.id,
        description,
        amount,
        type,
        date: new Date(),
      };

      const allTransactions = await loadTransactions();
      const updatedTransactions = [...allTransactions, newTransaction];
      await saveTransactions(updatedTransactions);

      const friendTransactions = updatedTransactions.filter(t => t.friendId === friend.id);
      await updateFriendBalance(friend.id, friendTransactions);

      setFriend({
        ...friend,
        transactions: friendTransactions,
        balance: calculateBalance(friendTransactions),
        lastUpdated: new Date(),
      });
    } catch (error) {
      console.error('Error adding transaction:', error);
      Alert.alert('Error', 'Failed to add transaction');
    }
  };

  const handleEditTransaction = async (updatedTransaction: Transaction) => {
    if (!friend) return;

    try {
      const allTransactions = await loadTransactions();
      const transactionIndex = allTransactions.findIndex(t => t.id === updatedTransaction.id);
      
      if (transactionIndex !== -1) {
        allTransactions[transactionIndex] = updatedTransaction;
        await saveTransactions(allTransactions);

        const friendTransactions = allTransactions.filter(t => t.friendId === friend.id);
        await updateFriendBalance(friend.id, friendTransactions);

        setFriend({
          ...friend,
          transactions: friendTransactions,
          balance: calculateBalance(friendTransactions),
          lastUpdated: new Date(),
        });
      }
    } catch (error) {
      console.error('Error editing transaction:', error);
      Alert.alert('Error', 'Failed to update transaction');
    }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!friend) return;

    try {
      const allTransactions = await loadTransactions();
      const updatedTransactions = allTransactions.filter(t => t.id !== transactionId);
      await saveTransactions(updatedTransactions);

      const friendTransactions = updatedTransactions.filter(t => t.friendId === friend.id);
      await updateFriendBalance(friend.id, friendTransactions);

      setFriend({
        ...friend,
        transactions: friendTransactions,
        balance: calculateBalance(friendTransactions),
        lastUpdated: new Date(),
      });
    } catch (error) {
      console.error('Error deleting transaction:', error);
      Alert.alert('Error', 'Failed to delete transaction');
    }
  };

  const handleDeleteFriend = () => {
    if (!friend || isDeleting) return;

    Alert.alert(
      'Delete Friend',
      `Are you sure you want to delete ${friend.name}? This will also delete all transactions with them.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            setIsDeleting(true);
            try {
              // Delete all transactions for this friend
              const allTransactions = await loadTransactions();
              const updatedTransactions = allTransactions.filter(t => t.friendId !== friend.id);
              await saveTransactions(updatedTransactions);
              
              // Delete the friend
              const friends = await loadFriends();
              const updatedFriends = friends.filter(f => f.id !== friend.id);
              await saveFriends(updatedFriends);
              
              // Navigate back to home
              router.replace('/(tabs)');
            } catch (error) {
              console.error('Error deleting friend:', error);
              Alert.alert('Error', 'Failed to delete friend');
              setIsDeleting(false);
            }
          }
        },
      ]
    );
  };

  const handleEditPress = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowAddModal(true);
  };

  const handleModalClose = () => {
    setShowAddModal(false);
    setEditingTransaction(null);
  };

  if (!friend) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <TransactionCard
      transaction={item}
      onEdit={handleEditPress}
      onDelete={handleDeleteTransaction}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{friend.name}</Text>
        <TouchableOpacity 
          onPress={handleDeleteFriend} 
          style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
          disabled={isDeleting}
        >
          <Trash2 size={20} color={isDeleting ? "#9CA3AF" : "#EF4444"} />
        </TouchableOpacity>
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Current Balance</Text>
        <Text style={[styles.balanceAmount, { color: getBalanceColor(friend.balance) }]}>
          {formatCurrency(friend.balance)}
        </Text>
        <Text style={[styles.balanceText, { color: getBalanceColor(friend.balance) }]}>
          {getBalanceText(friend.balance)}
        </Text>
      </View>

      <View style={styles.transactionsHeader}>
        <Text style={styles.transactionsTitle}>Transactions</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Plus size={20} color="#3B82F6" />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {friend.transactions.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No transactions yet</Text>
          <Text style={styles.emptySubtitle}>
            Add your first transaction to start tracking expenses
          </Text>
        </View>
      ) : (
        <FlatList
          data={friend.transactions.sort((a, b) => b.date.getTime() - a.date.getTime())}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      <AddTransactionModal
        visible={showAddModal}
        onClose={handleModalClose}
        onAdd={handleAddTransaction}
        onEdit={handleEditTransaction}
        editingTransaction={editingTransaction}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  deleteButton: {
    padding: 4,
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  balanceCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  balanceLabel: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  balanceText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  transactionsTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF4FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#3B82F6',
    marginLeft: 4,
  },
  list: {
    paddingBottom: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
});