import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { playTap } from '../utils/sounds';

const { width: SW } = Dimensions.get('window');

const ABBREVS = {
  0: [
    { abbr: 'AB', answer: 'Avrupa Birliği', wrongs: ['Amerika Birleşik', 'Asya Birliği', 'Afrika Birliği'] },
    { abbr: 'BM', answer: 'Birleşmiş Milletler', wrongs: ['Büyük Millet', 'Bölge Merkezi', 'Batı Marmara'] },
    { abbr: 'TC', answer: 'Türkiye Cumhuriyeti', wrongs: ['Ticaret Cemiyet', 'Toplum Cephesi', 'Türk Cephe'] },
    { abbr: 'vb.', answer: 'Ve benzeri', wrongs: ['Var olan', 'Veya başka', 'Varsa bir'] },
    { abbr: 'vs.', answer: 'Vesaire', wrongs: ['Varsayım', 'Vasıta', 'Vesile'] },
    { abbr: 'Dr.', answer: 'Doktor', wrongs: ['Dernek', 'Direktör', 'Danışman'] },
  ],
  1: [
    { abbr: 'NATO', answer: 'Kuzey Atlantik Antlaşması Örgütü', wrongs: ['Nükleer Araştırma Örgütü', 'Ulusal Ticaret Örgütü', 'Avrupa Güvenlik Örgütü'] },
    { abbr: 'TDK', answer: 'Türk Dil Kurumu', wrongs: ['Türk Devlet Koleji', 'Tarih Derleme Kurulu', 'Ticaret Denetim Kurulu'] },
    { abbr: 'MEB', answer: 'Milli Eğitim Bakanlığı', wrongs: ['Maliye ve Ekonomi', 'Mühendislik Bakanlığı', 'Maden Enerji Birliği'] },
    { abbr: 'THY', answer: 'Türk Hava Yolları', wrongs: ['Türk Harita Yayın', 'Toplum Hizmet Yeri', 'Taşıma Hizmet Yol'] },
    { abbr: 'WHO', answer: 'Dünya Sağlık Örgütü', wrongs: ['Dünya Hukuk Örgütü', 'Dünya Su Örgütü', 'Dünya Harita Örgütü'] },
    { abbr: 'FIFA', answer: 'Uluslararası Futbol Federasyonu', wrongs: ['Uluslararası Film Fonu', 'Federal İstihbarat Ajansı', 'Finans İzleme Ajansı'] },
  ],
  2: [
    { abbr: 'UNESCO', answer: 'BM Eğitim, Bilim ve Kültür Örgütü', wrongs: ['BM Ekonomi Konseyi', 'BM Çevre Programı', 'BM Gıda Örgütü'] },
    { abbr: 'TBMM', answer: 'Türkiye Büyük Millet Meclisi', wrongs: ['Türk Basın Medya Merkezi', 'Türkiye Bankalar Merkezi', 'Türk Bilim Müzesi'] },
    { abbr: 'UNICEF', answer: 'BM Çocuklara Yardım Fonu', wrongs: ['BM Eğitim Fonu', 'BM Kadın Hakları', 'BM Sağlık Merkezi'] },
    { abbr: 'TÜBİTAK', answer: 'Türkiye Bilimsel Araştırma Kurumu', wrongs: ['Türkiye Basın Kurumu', 'Türk Bankacılık Kurumu', 'Türkiye Biyoloji Akademisi'] },
    { abbr: 'IMF', answer: 'Uluslararası Para Fonu', wrongs: ['Uluslararası Medya Fonu', 'İstihbarat Merkez Fonu', 'İthalat Merkezi Fonu'] },
    { abbr: 'YÖK', answer: 'Yükseköğretim Kurulu', wrongs: ['Yurt Öğrenci Kooperatif', 'Yeni Ödül Kurumu', 'Yasa Onay Komisyonu'] },
  ],
};

const DIFFICULTY_CONFIG = { 0: {}, 1: {}, 2: {} };

export default function Abbreviation({ difficulty, onCorrect, onWrong }) {
  const items = ABBREVS[difficulty] || ABBREVS[0];
  const [current, setCurrent] = useState(items[0]);
  const [options, setOptions] = useState([]);
  const [streak, setStreak] = useState(0);

  const next = () => {
    const item = items[Math.floor(Math.random() * items.length)];
    setCurrent(item);
    setOptions([item.answer, ...item.wrongs.slice(0, 3)].sort(() => Math.random() - 0.5));
  };

  useEffect(() => { next(); setStreak(0); }, [difficulty]);

  const handleAnswer = (val) => {
    playTap();
    if (val === current.answer) { onCorrect(); setStreak(s => s + 1); } else { onWrong(); setStreak(0); }
    next();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.streak}>🔥 {streak}</Text>
      <Text style={styles.label}>Bu kısaltma ne anlama gelir?</Text>
      <Text style={styles.abbr}>{current.abbr}</Text>
      <View style={styles.options}>
        {options.map((opt, i) => (
          <TouchableOpacity key={i} style={styles.btn} onPress={() => handleAnswer(opt)} activeOpacity={0.7}>
            <Text style={styles.btnText}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  streak: { color: COLORS.text, fontSize: 18, marginBottom: 16 },
  label: { color: COLORS.textSecondary, fontSize: 16, marginBottom: 12 },
  abbr: { color: COLORS.text, fontSize: 48, fontWeight: '800', marginBottom: 30 },
  options: { width: SW - 40, gap: 10 },
  btn: { paddingVertical: 14, paddingHorizontal: 16, backgroundColor: COLORS.surface, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceLight },
  btnText: { color: COLORS.text, fontSize: 15, fontWeight: '600', textAlign: 'center' },
});
