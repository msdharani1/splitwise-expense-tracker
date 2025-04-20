import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, PanResponder, Dimensions } from 'react-native';

const CircleAnimation = () => {
  // State to store active animations
  const [animations, setAnimations] = useState([]);
  // Counter for unique IDs
  const idCounter = useRef(0);

  // Create a new animation when screen is tapped
  const handlePress = (x, y) => {
    const newId = idCounter.current++;
    const animationValue = new Animated.Value(0);
    
    // Add the new animation to state
    setAnimations(prev => [...prev, { id: newId, x, y, animationValue }]);
    
    // Start the animation
    Animated.timing(animationValue, {
      toValue: 1,
      duration: 500,
      useNativeDriver: false,
    }).start(() => {
      // Remove the animation from state after it completes
      setAnimations(prev => prev.filter(anim => anim.id !== newId));
    });
  };

  // Configure PanResponder to detect taps
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => false,
      onPanResponderGrant: (evt) => {
        // Get the tap location
        const { locationX, locationY } = evt.nativeEvent;
        handlePress(locationX, locationY);
      },
    })
  ).current;

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {/* Render each active animation */}
      {animations.map(({ id, x, y, animationValue }) => {
        // Interpolate the scale from 0 to 1
        const scale = animationValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0.3, 1],
        });
        
        // Interpolate the opacity to fade out
        const opacity = animationValue.interpolate({
          inputRange: [0, 0.8, 1],
          outputRange: [0.8, 0.5, 0],
        });
        
        return (
          <Animated.View
            key={id}
            style={[
              styles.circle,
              {
                left: x - 25, // Center the circle on tap position
                top: y - 25,  // Center the circle on tap position
                transform: [{ scale }],
                opacity,
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  circle: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 123, 255, 0.6)',
  },
});

export default CircleAnimation;