import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, DIFFICULTY_LABELS, DIFFICULTY_EMOJIS } from '../constants/colors';

export default function GamePreview({ game, difficulty }) {
  return (
    <View style={[styles.container, { borderColor: game.accent + '40' }]}>
      <View style={[styles.accentBar, { backgroundColor: game.accent }]} />
      <Text style={styles.title}>{game.title}</Text>
      <Text style={styles.desc}>{game.shortDesc}</Text>
      <Text style={styles.diff}>
        {DIFFICULTY_EMOJIS[difficulty]} {DIFFICULTY_LABELS[difficulty]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  accentBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 16,
  },
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  desc: {
    color: COLORS.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 16,
  },
  diff: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
});
