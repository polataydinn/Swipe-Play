import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, DIFFICULTY_COLORS, DIFFICULTY_LABELS, DIFFICULTY_EMOJIS } from '../constants/colors';

export default function HUD({ score, difficulty, onBack, singleLevel }) {
  const diffColor = DIFFICULTY_COLORS[difficulty] || COLORS.easy;
  const diffLabel = DIFFICULTY_LABELS[difficulty] || 'EASY';
  const diffEmoji = DIFFICULTY_EMOJIS[difficulty] || '🟢';

  return (
    <View style={styles.container}>
      {onBack && (
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backText}>{'‹'}</Text>
        </TouchableOpacity>
      )}
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreLabel}>SKOR</Text>
        <Text style={styles.scoreValue}>{score}</Text>
      </View>
      {!singleLevel && (
        <View style={[styles.badge, { backgroundColor: diffColor + '30', borderColor: diffColor }]}>
          <Text style={styles.badgeEmoji}>{diffEmoji}</Text>
          <Text style={[styles.badgeText, { color: diffColor }]}>{diffLabel}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  backText: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '700',
    marginTop: -2,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoreLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  scoreValue: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  badgeEmoji: {
    fontSize: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
