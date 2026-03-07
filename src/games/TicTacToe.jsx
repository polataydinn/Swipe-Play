import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';
const { width: SW } = Dimensions.get('window');
const LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
function checkWin(b, p) { return LINES.some(([a,c,d]) => b[a]===p && b[c]===p && b[d]===p); }
function getAIMove(board, diff) {
  const empty = board.map((v,i) => v===null?i:null).filter(v=>v!==null);
  if (empty.length === 0) return -1;
  if (diff >= 1) { for (const i of empty) { const b=[...board]; b[i]='O'; if(checkWin(b,'O')) return i; } for (const i of empty) { const b=[...board]; b[i]='X'; if(checkWin(b,'X')) return i; } }
  if (diff >= 2) { if (board[4]===null) return 4; const corners=[0,2,6,8].filter(i=>board[i]===null); if(corners.length) return corners[Math.floor(Math.random()*corners.length)]; }
  return empty[Math.floor(Math.random()*empty.length)];
}
export default function TicTacToe({ difficulty, onCorrect, onWrong }) {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [turn, setTurn] = useState('X');
  const [gameOver, setGameOver] = useState(false);
  const newGame = () => { setBoard(Array(9).fill(null)); setTurn('X'); setGameOver(false); };
  useEffect(() => { newGame(); }, [difficulty]);
  useEffect(() => {
    if (turn === 'O' && !gameOver) {
      const t = setTimeout(() => {
        const move = getAIMove(board, difficulty);
        if (move >= 0) {
          const b = [...board]; b[move] = 'O'; setBoard(b);
          if (checkWin(b,'O')) { setGameOver(true); onWrong(); setTimeout(newGame, 1000); }
          else if (b.every(v=>v!==null)) { setGameOver(true); onWrong(); setTimeout(newGame, 1000); }
          else setTurn('X');
        }
      }, 400);
      return () => clearTimeout(t);
    }
  }, [turn, gameOver]);
  const handlePress = (i) => {
    if (board[i] || gameOver || turn !== 'X') return;
    playTap();
    const b = [...board]; b[i] = 'X'; setBoard(b);
    if (checkWin(b,'X')) { setGameOver(true); onCorrect(); setTimeout(newGame, 1000); }
    else if (b.every(v=>v!==null)) { setGameOver(true); onWrong(); setTimeout(newGame, 1000); }
    else setTurn('O');
  };
  const GAP = 6;
  const gridSize = Math.min(SW - 40, 360);
  const cellSize = Math.floor((gridSize - GAP * 2) / 3);
  const totalGrid = cellSize * 3 + GAP * 2;
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{gameOver ? 'Oyun bitti!' : turn === 'X' ? 'Senin sıran (X)' : 'Rakip düşünüyor...'}</Text>
      <View style={[styles.grid, { width: totalGrid, gap: GAP }]}>
        {board.map((v, i) => (
          <TouchableOpacity key={i} style={[styles.cell, { width: cellSize, height: cellSize }]} onPress={() => handlePress(i)} activeOpacity={0.7}>
            <Text style={[styles.cellText, { fontSize: cellSize * 0.45 }, v === 'X' ? styles.x : styles.o]}>{v || ''}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  label: { color: COLORS.textSecondary, fontSize: 18, marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  cell: { backgroundColor: COLORS.surface, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceLight },
  cellText: { fontWeight: '800' },
  x: { color: '#3b82f6' }, o: { color: '#ef4444' },
});
