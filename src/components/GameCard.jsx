import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function GameCard({ children, accent }) {
  return (
    <View style={[styles.container, { borderColor: accent + '20' }]}>
      {children}
    </View>
  );
}

export { SCREEN_WIDTH, SCREEN_HEIGHT };

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
