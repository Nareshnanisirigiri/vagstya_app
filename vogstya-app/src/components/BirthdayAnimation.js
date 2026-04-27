import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, Dimensions, View } from 'react-native';

const { width, height } = Dimensions.get('window');

const SYMBOLS = ['⚡', '🥳', '🎉', '🎉', '✨', '🎁'];

export default function BirthdayAnimation() {
  const animations = useRef(
    Array.from({ length: 40 }).map(() => ({
      x: new Animated.Value(Math.random() * width),
      y: new Animated.Value(-50),
      rotate: new Animated.Value(0),
      opacity: new Animated.Value(1),
      symbol: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      size: Math.random() * 20 + 20,
      duration: Math.random() * 2000 + 3000,
      delay: Math.random() * 2000,
    }))
  ).current;

  useEffect(() => {
    const sequence = animations.map((anim) => {
      return Animated.sequence([
        Animated.delay(anim.delay),
        Animated.parallel([
          Animated.timing(anim.y, {
            toValue: height + 50,
            duration: anim.duration,
            useNativeDriver: true,
          }),
          Animated.timing(anim.rotate, {
            toValue: 1,
            duration: anim.duration,
            useNativeDriver: true,
          }),
          Animated.timing(anim.opacity, {
            toValue: 0,
            duration: anim.duration,
            useNativeDriver: true,
          }),
        ]),
      ]);
    });

    Animated.parallel(sequence).start();
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {animations.map((anim, i) => (
        <Animated.Text
          key={i}
          style={[
            styles.symbol,
            {
              fontSize: anim.size,
              transform: [
                { translateX: anim.x },
                { translateY: anim.y },
                {
                  rotate: anim.rotate.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
              opacity: anim.opacity,
            },
          ]}
        >
          {anim.symbol}
        </Animated.Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  symbol: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
