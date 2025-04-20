// MatchInfoCard.tsx - Match information card component
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Spacing, BorderRadius, useTheme } from './ThemeContext';

const MatchInfoCard = () => {
  const { colors } = useTheme();
  
  // Generate styles with current theme colors
  const getStyles = () => {
    return StyleSheet.create({
      cardContainer: {
        backgroundColor: colors.cardBackground,
        borderRadius: BorderRadius.md,
        marginHorizontal: Spacing.md,
        marginBottom: Spacing.md,
        paddingBottom: Spacing.md,
        borderWidth: 1,
        borderColor: colors.primary,
      },
      leagueBox: {
        backgroundColor: colors.primary,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        alignSelf: 'center',
        borderBottomLeftRadius: BorderRadius.md,
        borderBottomRightRadius: BorderRadius.md,
        marginBottom: Spacing.sm,
      },
      leagueText: {
        color: colors.white,
        fontWeight: 'bold',
      },
      matchTitle: {
        textAlign: 'center',
        paddingHorizontal: Spacing.md,
        marginBottom: Spacing.md,
        color: colors.text,
      },
      matchDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        marginBottom: Spacing.md,
      },
      teamContainer: {
        alignItems: 'center',
      },
      teamLogo: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.round,
      },
      teamName: {
        fontWeight: 'bold',
        marginTop: Spacing.xs,
        color: colors.text,
      },
      timeContainer: {
        alignItems: 'center',
      },
      startsText: {
        fontSize: 12,
        color: colors.theme === 'light' ? '#666' : '#aaa',
      },
      timeText: {
        fontWeight: 'bold',
        fontSize: 16,
        marginVertical: Spacing.xs,
        color: colors.text,
      },
      dateText: {
        fontSize: 12,
        color: colors.theme === 'light' ? '#666' : '#aaa',
      },
      favoriteContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        marginTop: Spacing.sm,
      },
      favoriteText: {
        fontWeight: 'bold',
        color: colors.text,
      },
      oddsContainer: {
        flexDirection: 'row',
      },
      sroBox: {
        backgroundColor: colors.gray,
        paddingVertical: Spacing.xs,
        paddingHorizontal: Spacing.sm,
        borderRadius: BorderRadius.xs,
        marginRight: Spacing.xs,
      },
      sroText: {
        fontSize: 12,
        color: colors.text,
      },
      oddsBox: {
        backgroundColor: colors.favoriteGreen,
        paddingVertical: Spacing.xs,
        paddingHorizontal: Spacing.sm,
        borderRadius: BorderRadius.xs,
        marginRight: Spacing.xs,
      },
      redOddsBox: {
        backgroundColor: colors.favoriteRed,
      },
      oddsText: {
        color: colors.white,
        fontSize: 12,
        fontWeight: 'bold',
      },
    });
  };
  
  const styles = getStyles();

  return (
    <View style={styles.cardContainer}>
      <View style={styles.leagueBox}>
        <Text style={styles.leagueText}>KCC T 20 Challengers B League</Text>
      </View>
      
      <Text style={styles.matchTitle}>Monday 23, T10, Surrey royals Vs Middlesex Titans</Text>
      
      <View style={styles.matchDetails}>
        <View style={styles.teamContainer}>
          <Image 
            source={require('../../assets/images/india.png')} 
            style={styles.teamLogo} 
          />
          <Text style={styles.teamName}>IND</Text>
        </View>
        
        <View style={styles.timeContainer}>
          <Text style={styles.startsText}>Starts in</Text>
          <Text style={styles.timeText}>42h: 12m</Text>
          <Text style={styles.dateText}>Monday, 30 Dec, 06:30 AM</Text>
        </View>
        
        <View style={styles.teamContainer}>
          <Image 
            source={require('../../assets/images/england.png')} 
            style={styles.teamLogo} 
          />
          <Text style={styles.teamName}>ENG</Text>
        </View>
      </View>
      
      <View style={styles.favoriteContainer}>
        <Text style={styles.favoriteText}>Favourite:</Text>
        <View style={styles.oddsContainer}>
          <View style={styles.sroBox}>
            <Text style={styles.sroText}>SRO</Text>
          </View>
          <View style={styles.oddsBox}>
            <Text style={styles.oddsText}>86</Text>
          </View>
          <View style={[styles.oddsBox, styles.redOddsBox]}>
            <Text style={styles.oddsText}>89</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default MatchInfoCard;