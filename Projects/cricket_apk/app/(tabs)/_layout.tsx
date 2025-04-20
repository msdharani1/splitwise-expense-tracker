import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { Image, StyleSheet } from 'react-native';
import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          // height: 70,
        
        },
        tabBarShowLabel: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Image
              source={
                //   require("../../assets/images/activehome.png")
                focused
                  ? require('../../assets/images/home.png')
                  : require('../../assets/images/home.png')
              }
              style={[styles.BottomMenuImg, { tintColor: focused ? '#048267' : '#000000' }]}

            />
          ),
          tabBarLabel: "Home",
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarInactiveTintColor: "#000000",
          tabBarActiveTintColor: "#048267",
        }}
      />
      <Tabs.Screen
        name="series"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Image
              source={
                focused
                  ? require("../../assets/images/series.png")
                  : require("../../assets/images/series.png")
              }
              style={[styles.BottomMenuImg, { tintColor: focused ? '#048267' : '#000000' }]}

            />
          ),
          tabBarLabel: "Series",
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarInactiveTintColor: "#5C5C5C",
          tabBarActiveTintColor: "#26B24B",
        }}
      />
      <Tabs.Screen
        name="reels"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Image
              source={
                focused
                  ? require("../../assets/images/reels.png")
                  : require("../../assets/images/reels.png")
              }
              style={[styles.BottomMenuImg, { tintColor: focused ? '#048267' : '#000000' }]}

            />
          ),
          tabBarLabel: "Reels",
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarInactiveTintColor: "#5C5C5C",
          tabBarActiveTintColor: "#26B24B",
        }}
      />
      <Tabs.Screen
        name="images"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Image
              source={
                focused
                  ? require("../../assets/images/image.png")
                  : require("../../assets/images/image.png")
              }
              style={[styles.BottomMenuImg, { tintColor: focused ? '#048267' : '#000000' }]}
            />
          ),
          tabBarLabel: "Images",
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarInactiveTintColor: "#5C5C5C",
          tabBarActiveTintColor: "#26B24B",
        }}
      />


    </Tabs>
  );
}

const styles = StyleSheet.create({
  BottomMenuImg: {
    width: 23,
    height: 23,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    // color:'#26B24B',
    textAlign: 'center',
  },
})