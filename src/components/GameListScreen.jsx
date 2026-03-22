import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import { GAME_DESCRIPTIONS } from '../constants/gameDescriptions';

const { width: SW } = Dimensions.get('window');
const CARD_WIDTH = (SW - 48) / 2;

const GAME_ICONS = {
  'color-memory': '🎨',
  'fast-math': '🧮',
  'snake-lite': '🐍',
  'word-puzzle': '📝',
  'memory-match': '🃏',
  'reaction-speed': '⚡',
  'number-sort': '🔢',
  'color-mixing': '🌈',
  'emoji-guess': '😄',
  'finger-maze': '🔀',
  'rhythm-tap': '🥁',
  'tap-count': '👆',
  'odd-one-out': '🔍',
  'true-or-false': '✅',
  'arrow-match': '➡️',
  'quick-count': '🔣',
  'speed-tap': '💨',
  'pin-code': '🔐',
  'digit-span': '🔟',
  'stroop-test': '🎭',
  'parity': '➗',
  'prime-check': '🔬',
  'higher-lower': '⬆️',
  'percentage': '💯',
  'roman-numerals': '🏛️',
  'binary-choice': '💻',
  'temperature-convert': '🌡️',
  'emoji-math': '➕',
  'antonym': '↔️',
  'synonym': '🔄',
  'category-sort': '📂',
  'odd-even-tap': '🎯',
  'whack-a-mole': '🔨',
  'balloon-pop': '🎈',
  'target-shoot': '🏹',
  'pattern-copy': '🔲',
  'shape-match': '🔷',
  'symbol-match': '✨',
  'letter-hunt': '🔤',
  'visual-search': '👁️',
  'color-tap': '🟢',
  'word-scramble': '🔠',
  'hangman-game': '💀',
  'word-chain': '⛓️',
  'spelling-bee': '🐝',
  'missing-letter': '🅰️',
  'vowel-count': '🗣️',
  'syllable-count': '✂️',
  'rhyme-match': '🎤',
  'word-length': '📏',
  'abbreviation': '📎',
  'math-comparison': '⚖️',
  'sequence-complete': '📊',
  'fraction-compare': '🍕',
  'power-calc': '💪',
  'square-root': '🌳',
  'algebra-solve': '✏️',
  'estimation': '👀',
  'gcd-game': '🔗',
  'fibonacci-next': '🐚',
  'factorial-guess': '❗',
  'tic-tac-toe': '❌',
  'rock-paper-scissors': '✊',
  'lights-out': '💡',
  'slide-puzzle': '🧩',
  'tile-flip': '🀄',
  'connect-dots': '✍️',
  'clock-reading': '⏰',
  'unit-convert': '📐',
  'change-maker': '💰',
  'logic-gate': '🔌',
  'morse-code': '📡',
  'pattern-recognition': '🧬',
  'bracket-match': '🧱',
  'trail-making': '🛤️',
  'pixel-art': '🖼️',
  'flag-quiz': '🏁',
  'capital-quiz': '🌍',
  'animal-quiz': '🐾',
  'planet-order': '🪐',
  'history-date': '📜',
  'inventor-match': '🔧',
  'language-guess': '🌐',
  'coin-flip': '🪙',
  'dice-guess': '🎲',
  'memory-grid': '🧠',
  'mirror-image': '🪞',
  'rotate-shape': '🌀',
  'scale-compare': '🏋️',
  'gravity-drop': '⬇️',
  'card-high-low': '🎴',
  'minesweeper-lite': '💣',
  'tower-of-hanoi': '🗼',
  'bubble-sort-game': '🫧',
  'stack-builder': '🏗️',
  'food-chain': '🌿',
  'base-convert': '🖥️',
  'hex-color': '💜',
  'area-calc': '🔶',
  'angle-estimate': '🔺',
  'perimeter-calc': '⭕',
  'tip-calculator': '🧾',
  'speed-calc-game': '⏱️',
  'calendar-math': '📅',
  'time-zone-game': '🕐',
  'bit-flip': '💾',
  'color-blend': '🖌️',
  'musical-note': '🎵',
  'shadow-match': '👤',
  'lucky-number': '🍀',
  'periodic-element': '⚗️',
  'game-2048': '🔢',
  'flappy-dot': '🐤',
  'brick-breaker': '🧱',
  'pong-lite': '🏓',
  'mahjong-match': '🀄',
  'hextris-game': '⬡',
  'sokoban-puzzle': '📦',
  'match-3-game': '💎',
  'doodle-jump': '🦘',
  'color-runner': '🏃',
  'asteroid-blast': '☄️',
  'ski-free': '⛷️',
  'circle-draw': '⭕',
  'egg-farm': '🥚',
  'hunting-game': '🎯',
  'monochromatic-game': '🎨',
  'flappy-first': '🚀',
  'fishing-net': '🎣',
  'gold-miner': '⛏️',
};

export default function GameListScreen({ onSelectGame }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>SwipePlay</Text>
        <Text style={styles.subtitle}>Mini oyunlar, maksimum eğlence</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.grid, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Shuffle / Feed card */}
        <TouchableOpacity
          style={styles.shuffleCard}
          onPress={() => onSelectGame(null)}
          activeOpacity={0.8}
        >
          <Text style={styles.shuffleIcon}>🎲</Text>
          <Text style={styles.shuffleTitle}>Karışık Oyna</Text>
          <Text style={styles.shuffleDesc}>Rastgele sırayla tüm oyunlar</Text>
        </TouchableOpacity>

        {/* Game cards */}
        {GAME_DESCRIPTIONS.map((game) => (
          <TouchableOpacity
            key={game.id}
            style={[styles.gameCard, { borderColor: game.accent + '40' }]}
            onPress={() => onSelectGame(game.id)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconCircle, { backgroundColor: game.accent + '20' }]}>
              <Text style={styles.icon}>{GAME_ICONS[game.id] || '🎮'}</Text>
            </View>
            <Text style={styles.gameTitle} numberOfLines={1}>{game.title}</Text>
            <Text style={styles.gameDesc} numberOfLines={2}>{game.shortDesc}</Text>
            <View style={[styles.accentLine, { backgroundColor: game.accent }]} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  logo: {
    color: COLORS.text,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  shuffleCard: {
    width: SW - 32,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffffff15',
    marginBottom: 4,
  },
  shuffleIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  shuffleTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '800',
  },
  shuffleDesc: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  gameCard: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 24,
  },
  gameTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  gameDesc: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  accentLine: {
    height: 3,
    borderRadius: 2,
    marginTop: 12,
    width: 30,
  },
});
