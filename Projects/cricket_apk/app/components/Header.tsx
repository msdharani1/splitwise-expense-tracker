import React from 'react';
import { View, Text, StyleSheet, StatusBar, Platform, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome } from '@expo/vector-icons';
import { Spacing, BorderRadius, useTheme } from './ThemeContext';

interface HeaderProps {
  // You can add props here if needed
}

const Header: React.FC<HeaderProps> = () => {
  const { theme, colors, toggleTheme } = useTheme();
  
  // Calculate lighter and darker variants of the primary color
  const lightenColor = (color: string, percent: number): string => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    const lightenValue = (value: number): number => {
      return Math.min(value + (255 - value) * (percent / 100), 255);
    };

    const rLightened = Math.round(lightenValue(r));
    const gLightened = Math.round(lightenValue(g));
    const bLightened = Math.round(lightenValue(b));

    return `#${rLightened.toString(16).padStart(2, '0')}${gLightened.toString(16).padStart(2, '0')}${bLightened.toString(16).padStart(2, '0')}`;
  };

  const darkenColor = (color: string, percent: number): string => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    const darkenValue = (value: number): number => {
      return Math.max(value * (1 - percent / 100), 0);
    };

    const rDarkened = Math.round(darkenValue(r));
    const gDarkened = Math.round(darkenValue(g));
    const bDarkened = Math.round(darkenValue(b));

    return `#${rDarkened.toString(16).padStart(2, '0')}${gDarkened.toString(16).padStart(2, '0')}${bDarkened.toString(16).padStart(2, '0')}`;
  };

  const lighterPrimary = lightenColor(colors.primary, 20);
  const darkerPrimary = darkenColor(colors.primary, 20);
  
  // Generate styles with current theme colors
  const getStyles = () => {
    return StyleSheet.create({
      headerContainer: {
        flexDirection: 'row',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.md,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 60 : 60, // Keep iOS-specific padding or adjust as needed
      },
      logoText: {
        color: colors.white,
        fontWeight: 'bold',
        fontSize: 18,
      },
      iconContainer: {
        flexDirection: 'row',
        alignItems: 'center',
      },
      iconCircle: {
        width: 36,
        height: 36,
        borderRadius: BorderRadius.round,
        backgroundColor: colors.iconBackground,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: Spacing.sm,
      },
    });
  };
  
  const styles = getStyles();

  return (
    <LinearGradient
      colors={[lighterPrimary, darkerPrimary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.headerContainer}
    >
      {/* <StatusBar 
        backgroundColor={lighterPrimary} 
        barStyle="light-content" 
      /> */}
      <Text style={styles.logoText}>APP NAME LOGO</Text>
      <View style={styles.iconContainer}>
       
        <View style={styles.iconCircle}>
          <FontAwesome name="user" size={18} color={colors.white} />
        </View>
        <View style={styles.iconCircle}>
          <FontAwesome name="bell" size={18} color={colors.white} />
        </View>
      </View>
    </LinearGradient>
  );
};

export default Header;