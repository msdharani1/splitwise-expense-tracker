import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ImageBackground, 
  Image, 
  FlatList, 
  Dimensions, 
  NativeSyntheticEvent, 
  NativeScrollEvent 
} from 'react-native';
import { Spacing, BorderRadius, useTheme } from './ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width * 0.95;
const ITEM_SPACING = (width - ITEM_WIDTH) / 2;

interface Team {
  name: string;
  logo: any; // For React Native image require type
  score?: string;
}

interface Match {
  id: string;
  league: string;
  team1: Team;
  team2: Team;
  bowlInfo: string;
  backgroundImage: any; // For React Native image require type
  isLive: boolean;
}

const MatchSlide: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<Match>>(null);
  const { colors } = useTheme();
  
  // Sample match data
  const matches: Match[] = [
    {
      id: '1',
      league: 'International League T20',
      team1: { name: 'IND', logo: require('../../assets/images/india.png'), score: '30/0 (4)' },
      team2: { name: 'ENG', logo: require('../../assets/images/england.png') },
      bowlInfo: 'ADKR to Bowl',
      backgroundImage: require('../../assets/images/cricket-stadium.png'),
      isLive: true,
    },
    {
      id: '2',
      league: 'IPL 2025',
      team1: { name: 'MI', logo: require('../../assets/images/india.png'), score: '156/4 (18)' },
      team2: { name: 'CSK', logo: require('../../assets/images/england.png'), score: '160/6 (19.2)' },
      bowlInfo: 'Match ended',
      backgroundImage: require('../../assets/images/cricket-stadium.png'),
      isLive: false,
    },
    {
      id: '3',
      league: 'Big Bash League',
      team1: { name: 'STA', logo: require('../../assets/images/india.png') },
      team2: { name: 'SCO', logo: require('../../assets/images/england.png') },
      bowlInfo: 'Starts in 2h',
      backgroundImage: require('../../assets/images/cricket-stadium.png'),
      isLive: false,
    },
  ];

  // Generate styles with current theme colors
  const getStyles = () => {
    return StyleSheet.create({
      flatListContent: {
        paddingHorizontal: 0,
      },
      slideWrapper: {
        width,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
      },
      slideContainer: {
        width: ITEM_WIDTH,
        height: 180,
        justifyContent: 'center',
        borderRadius: BorderRadius.md,
        overflow: 'hidden',
      },
      backgroundImage: {
        borderRadius: BorderRadius.md,
      },
      overlay: {
        backgroundColor: colors.overlayBackground,
        flex: 1,
        padding: Spacing.md,
        justifyContent: 'space-between',
      },
      topSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      },
      leagueTitle: {
        color: colors.white,
        fontWeight: 'bold',
      },
    
      matchInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      },
      teamContainer: {
        alignItems: 'center',
        width: '30%',
      },
      teamLogo: {
        width: 50,
        height: 50,
        borderRadius: BorderRadius.round,
        backgroundColor: colors.white,
      },
      teamName: {
        color: colors.white,
        fontWeight: 'bold',
        marginTop: Spacing.xs,
      },
      scoreContainer: {
        alignItems: 'center',
        width: '40%',
      },
      scoreText: {
        color: colors.white,
        fontSize: 14,
        marginTop: Spacing.xs,
      },
      bowlInfo: {
        color: colors.white,
        fontSize: 12,
        marginTop: Spacing.xs,
        textAlign: 'center',
      },
      vsContainer: {
        // backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.xs,
      },
      vsText: {
        color: colors.white,
        fontWeight: 'bold',
        fontSize: 16,
      },
      pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
      },
      paginationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        marginHorizontal: 4,
      },
      paginationDotActive: {
        backgroundColor: colors.white,
      },
      headerContainer: {
        // padding: 6,
        borderRadius: 10, 
        alignSelf: "flex-start", 
      },
      liveButton: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: "transparent", 
        borderRadius: 10,
      },
      liveDot: {
        width: 8,
        height: 8,
        borderRadius: 4, 
        backgroundColor: "#FFFFFF", 
        marginRight: 6, 
      },
      liveText: {
        color: "#FFFFFF", 
        fontSize: 14,
        fontWeight: "bold",
      },
    });
  };

  const styles = getStyles();

  const renderItem = ({ item }: { item: Match }) => {
    return (
      <View style={styles.slideWrapper}>
        <ImageBackground
          source={item.backgroundImage}
          style={styles.slideContainer}
          imageStyle={styles.backgroundImage}
        >
          <View style={styles.overlay}>
            <View style={styles.topSection}>
              <Text style={styles.leagueTitle}>{item.league}</Text>
              {item.isLive && (
                 <LinearGradient
                 colors={["#820404", "#FF0000"]}
                 start={{ x: 0, y: 0 }}
                 end={{ x: 1, y: 0 }}
                 style={styles.headerContainer}
               >
                 <View style={styles.liveButton}>
                   <View style={styles.liveDot} />
                   <Text style={styles.liveText}>LIVE</Text>
                 </View>
               </LinearGradient>
              )}
            </View>
            
            <View style={styles.matchInfo}>
              <View style={styles.teamContainer}>
                <Image 
                  source={item.team1.logo} 
                  style={styles.teamLogo} 
                />
                <Text style={styles.teamName}>{item.team1.name}</Text>
                {item.team1.score && <Text style={styles.scoreText}>{item.team1.score}</Text>}
              </View>
              
              <View style={styles.scoreContainer}>
                <View style={styles.vsContainer}>
                  <Text style={styles.vsText}>30/0 (4)</Text>
                </View>
                <Text style={styles.bowlInfo}>{item.bowlInfo}</Text>
              </View>
              
              <View style={styles.teamContainer}>
                <Image 
                  source={item.team2.logo} 
                  style={styles.teamLogo} 
                />
                <Text style={styles.teamName}>{item.team2.name}</Text>
                {item.team2.score && <Text style={styles.scoreText}>{item.team2.score}</Text>}
              </View>
            </View>
          </View>
        </ImageBackground>
      </View>
    );
  };

  const handlePageChange = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset } = event.nativeEvent;
    const pageIndex = Math.round(contentOffset.x / width);
    setCurrentIndex(pageIndex);
  };

  return (
    <View>
      <FlatList
        ref={flatListRef}
        data={matches}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handlePageChange}
        snapToInterval={width}
        decelerationRate="fast"
        snapToAlignment="center"
        contentContainerStyle={styles.flatListContent}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
      />
      
      <View style={styles.pagination}>
        {matches.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              index === currentIndex && styles.paginationDotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

export default MatchSlide;