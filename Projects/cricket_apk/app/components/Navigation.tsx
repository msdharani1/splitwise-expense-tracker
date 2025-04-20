// Navigation.tsx - Navigation tabs component
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Spacing, BorderRadius, useTheme } from './ThemeContext';

const Navigation = () => {
  const [activeTab, setActiveTab] = useState('Live');
  const { colors } = useTheme();
  
  const tabs = ['Live', 'Upcoming', 'Finished', 'Series'];
  
  // Generate styles with current theme colors
  const getStyles = () => {
    return StyleSheet.create({
      navContainer: {
        flexDirection: 'row',
        backgroundColor: colors.cardBackground,
        marginHorizontal: Spacing.md,
        marginVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        padding: Spacing.sm,
        marginTop: -10,
      },
      tabButton: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.sm,
      },
      activeTabButton: {
        backgroundColor: colors.primary,
      },
      tabText: {
        color: colors.text,
        fontWeight: '500',
      },
      activeTabText: {
        color: colors.white,
        fontWeight: 'bold',
      },
    });
  };
  
  const styles = getStyles();
  
  return (
    <View style={styles.navContainer}>
      {tabs.map(tab => (
        <TouchableOpacity 
          key={tab}
          style={[
            styles.tabButton,
            activeTab === tab && styles.activeTabButton
          ]} 
          onPress={() => setActiveTab(tab)}
        >
          <Text style={[
            styles.tabText,
            activeTab === tab && styles.activeTabText
          ]}>
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default Navigation;