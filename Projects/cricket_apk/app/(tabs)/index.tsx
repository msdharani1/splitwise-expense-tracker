import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Text, Image } from 'react-native';
import { ThemeProvider, useTheme } from '../components/ThemeContext';
import Header from '../components/Header';
import Navigation from '../components/Navigation';
import MatchSlide from '../components/MatchSlide';
import MatchInfoCard from '../components/MatchInfoCard';
import styles from '../components/Styles/styles';


// Main app component with theme support
const MainApp: React.FC = () => {
  const { colors } = useTheme();
  const [selectedTab, setSelectedTab] = useState("Live");

  const tabs = ["Live", "Upcoming", "Finished", "Series"];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Header />
      <ScrollView style={{ backgroundColor: '#04826714' }}>
        <MatchSlide />
        <View style={styles.tabContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                selectedTab === tab && styles.activeTab, // Apply active style
              ]}
              onPress={() => setSelectedTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedTab === tab && styles.activeTabText,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {selectedTab === "Live" && (
        <View style={styles.comingSoon}>
          <Text style={styles.comingSoonText}>Coming Soon...</Text>
        </View>
      )}
      {selectedTab === "Upcoming" && (
        <>
        {[...Array(3)].map((_, index) => (
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.leagueTitle}>KCC T 20 Challengers B League</Text>
          </View>

          {/* Match Info */}
          <Text style={styles.matchDetails}>
            Monday 23, T10, Surrey Royals Vs Middlesex Titans
          </Text>

          {/* Countdown Timer */}
          <Text style={styles.startsIn}>Starts in</Text>
          <View style={styles.teamsContainer}>
            <View style={styles.team}>
              <Image
                source={require("../../assets/images/india.png")} // Replace with your actual image path
                style={styles.teamLogo}
              />
              <Text style={styles.teamText}>IND</Text>
            </View>
            <Text style={styles.timer}>42h : 12m</Text>
            <View style={styles.team}>
              <Text style={styles.teamText}>ENG</Text>
              <Image
                source={require("../../assets/images/england.png")} // Replace with your actual image path
                style={styles.teamLogo}
              />
            </View>

          </View>

          <Text style={styles.dateTime}>Monday, 30 Dec, 06:30 AM</Text>

          {/* Teams Section */}


          {/* Favourite Section */}
          <View style={styles.favouriteSection}>
            <Text style={styles.favouriteText}>Favourite:</Text>
            <View style={styles.favouriteChips}>
              <View style={styles.chip}>
                <Text style={styles.chipText}>SRO</Text>
              </View>
              <View style={[styles.scoreBox, styles.greenBox]}>
                <Text style={styles.scoreText}>86</Text>
              </View>
              <View style={[styles.scoreBox, styles.redBox]}>
                <Text style={styles.scoreText}>89</Text>
              </View>
            </View>
          </View>
        </View>
        ))}
        </>
      )}
      {selectedTab === "Finished" && (
        <View style={styles.comingSoon}>  
          <Text style={styles.comingSoonText}>Coming Soon...</Text>
        </View>
      )}
      {selectedTab === "Series" && (
        <View style={styles.comingSoon}>
          <Text style={styles.comingSoonText}>Coming Soon...</Text>
        </View>
      )}
        {/* <Navigation />
        <MatchInfoCard />
        <MatchInfoCard />
        <MatchInfoCard /> */}
      </ScrollView>
    </SafeAreaView>
  );
};
// Wrapper component with ThemeProvider
const App: React.FC = () => {
  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  );
};

export default App;

