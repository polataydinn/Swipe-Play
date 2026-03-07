import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

export default function GameCaption({ title, shortDesc, fullDesc }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {expanded ? (
        <TouchableOpacity onPress={() => setExpanded(false)} activeOpacity={0.8}>
          <Text style={styles.description}>{fullDesc}</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.shortRow}>
          <Text style={styles.shortDesc} numberOfLines={1}>
            {shortDesc}
          </Text>
          <TouchableOpacity onPress={() => setExpanded(true)}>
            <Text style={styles.more}>...daha fazla</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  title: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  shortRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shortDesc: {
    color: COLORS.textSecondary,
    fontSize: 14,
    flex: 1,
  },
  more: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  description: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
});
