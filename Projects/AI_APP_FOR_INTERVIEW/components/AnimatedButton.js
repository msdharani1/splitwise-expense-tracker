import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  Animated,
  StyleSheet,
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";

const AnimatedButton = ({
  isActive,
  toggleActive,
  iconName,
  CustomIcon,
  activeButtonStyle,
  inactiveButtonStyle,
  activeText,
}) => {
  const [pressed, setPressed] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const textOpacityAnim = useRef(new Animated.Value(isActive ? 1 : 0)).current;
  const [expanded, setExpanded] = useState(isActive);

  // Sync expanded state with isActive
  useEffect(() => {
    if (isActive !== expanded) {
      setExpanded(isActive);
    }

    Animated.timing(textOpacityAnim, {
      toValue: isActive ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isActive]);

  const handlePressIn = () => {
    setPressed(true);
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    setPressed(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    toggleActive();
  };

  return (
    <View
      style={[
        styles.buttonContainer,
        { width: expanded ? 150 : 40 }
      ]}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Pressable
          style={[
            styles.actionButton,
            isActive ? activeButtonStyle : inactiveButtonStyle,
            { flexDirection: "row", justifyContent: "center", alignItems: "center", overflow: "hidden" }
          ]}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          android_ripple={{
            color: isActive ? "#3a80d2" : "#444",
            borderless: false,
          }}
        >
          {CustomIcon ? 
            <CustomIcon size={20} color="#fff" /> : 
            <Icon name={iconName} size={20} color="#fff" />
          }
          {expanded && (
            <Animated.Text
              style={[
                styles.buttonText,
                { opacity: textOpacityAnim, marginLeft: 6 }
              ]}
              numberOfLines={1}
            >
              {activeText}
            </Animated.Text>
          )}
        </Pressable>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    marginRight: 8,
    height: 40,
    ...Platform.select({
      web: {
        transitionDuration: "0.2s",
        transitionProperty: "width",
      },
    }),
  },
  actionButton: {
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10,
    height: 40,
    minWidth: 40,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
});

export default AnimatedButton;