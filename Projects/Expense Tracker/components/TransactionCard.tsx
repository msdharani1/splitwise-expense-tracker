import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Transaction } from '@/types';
import { formatCurrency } from '@/utils/currency';
import { formatDateTime } from '@/utils/date';
import { CreditCard as Edit3, Trash2 } from 'lucide-react-native';

interface TransactionCardProps {
  transaction: Transaction;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transactionId: string) => void;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({ 
  transaction, 
  onEdit, 
  onDelete 
}) => {
  const handleDelete = () => {
    Alert.alert(
      'Delete Transaction',
      `Are you sure you want to delete "${transaction.description}"?`,
      [
        { 
          text: 'Cancel', 
          style: 'cancel' 
        },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: () => {
            try {
              onDelete(transaction.id);
            } catch (error) {
              console.error('Error in delete handler:', error);
              Alert.alert('Error', 'Failed to delete transaction');
            }
          }
        },
      ]
    );
  };

  const handleEdit = () => {
    try {
      onEdit(transaction);
    } catch (error) {
      console.error('Error in edit handler:', error);
      Alert.alert('Error', 'Failed to edit transaction');
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.description} numberOfLines={2}>
            {transaction.description}
          </Text>
          <Text style={[
            styles.amount,
            { color: transaction.type === 'I_PAID' ? '#EF4444' : '#10B981' }
          ]}>
            {transaction.type === 'I_PAID' ? '+' : '-'}{formatCurrency(transaction.amount)}
          </Text>
        </View>
        
        <View style={styles.details}>
          <Text style={styles.paymentType}>
            {transaction.type === 'I_PAID' ? 'You paid' : 'They paid'}
          </Text>
          <Text style={styles.date}>{formatDateTime(transaction.date)}</Text>
        </View>
      </View>
      
      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={handleEdit}
          activeOpacity={0.7}
        >
          <Edit3 size={16} color="#6B7280" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={handleDelete}
          activeOpacity={0.7}
        >
          <Trash2 size={16} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    flex: 1,
    marginRight: 12,
  },
  amount: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    minWidth: 80,
    textAlign: 'right',
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentType: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  date: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
    borderRadius: 6,
  },
});