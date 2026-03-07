export const GAME_DESCRIPTIONS = [
  // --- Original 11 ---
  { id: 'color-memory', title: 'Renk Hafıza', shortDesc: 'Renk sırasını ezberle ve tekrarla.', fullDesc: 'Ekranda bir dizi renk belirecek. Sırayı dikkatlice izle ve aynı sırayla tekrarla. Her turda bir renk daha eklenir.', accent: '#e74c3c' },
  { id: 'fast-math', title: 'Hızlı Matematik', shortDesc: 'Süre dolmadan işlemi çöz.', fullDesc: 'Ekranda bir matematik işlemi belirecek. Doğru cevabı süre bitmeden bul.', accent: '#3498db' },
  { id: 'snake-lite', title: 'Yılan Oyunu', shortDesc: 'Klasik yılan oyunu, yemleri topla.', fullDesc: 'Yılanı kontrol et ve yemleri topla. Duvarlara çarpmadan büyümeye devam et.', accent: '#2ecc71' },
  { id: 'word-puzzle', title: 'Kelime Bulmaca', shortDesc: 'İpuçlarından kelimeyi tahmin et.', fullDesc: 'Verilen ipuçlarına bakarak gizli kelimeyi bul.', accent: '#9b59b6' },
  { id: 'memory-match', title: 'Hafıza Eşleştirme', shortDesc: 'Emoji çiftlerini bul ve eşleştir.', fullDesc: 'Kartları çevirerek aynı emoji çiftlerini bul.', accent: '#e67e22' },
  { id: 'reaction-speed', title: 'Tepki Hızı', shortDesc: 'Sinyal geldiğinde hızla dokun.', fullDesc: 'Ekran yeşile döndüğünde en hızlı şekilde dokun.', accent: '#1abc9c' },
  { id: 'number-sort', title: 'Sayı Sıralama', shortDesc: 'Sayıları doğru sıraya diz.', fullDesc: 'Ekrandaki sayılara küçükten büyüğe doğru sırayla dokun.', accent: '#f39c12' },
  { id: 'color-mixing', title: 'Renk Karışımı', shortDesc: 'Hangi iki renk bu rengi oluşturur?', fullDesc: 'Hedef rengi elde etmek için karıştırılması gereken iki rengi seç.', accent: '#e91e63' },
  { id: 'emoji-guess', title: 'Emoji Tahmin', shortDesc: 'Emojilerden kelimeyi tahmin et.', fullDesc: 'Emoji kombinasyonlarına bakarak ne anlattıklarını tahmin et.', accent: '#ff9800' },
  { id: 'finger-maze', title: 'Parmak Labirent', shortDesc: 'Duvarlara dokunmadan çıkışı bul.', fullDesc: 'Parmağını başlangıçtan bitişe sürükle. Duvarlara dokunma!', accent: '#00bcd4' },
  { id: 'rhythm-tap', title: 'Ritim Vuruş', shortDesc: 'Ritme uygun şekilde dokun.', fullDesc: 'Vuruş kalıbını izle ve aynı ritimde dokun.', accent: '#8e24aa' },

  // --- Aksiyon & Refleks (3) ---
  { id: 'tap-count', title: 'Dokunma Sayacı', shortDesc: 'Belirtilen sayıda hızlıca dokun.', fullDesc: 'Hedef sayı kadar hızlıca ekrana dokun. Fazla veya eksik dokunursan kaybedersin!', accent: '#ef4444' },
  { id: 'speed-tap', title: 'Hız Dokunuşu', shortDesc: 'Süre bitmeden en çok dokun.', fullDesc: 'Belirli sürede ekrana olabildiğince hızlı dokun. Hedefe ulaş!', accent: '#ec4899' },
  { id: 'balloon-pop', title: 'Balon Patlatma', shortDesc: 'Yükselen balonları patlatın.', fullDesc: 'Ekranda yükselen balonlara dokunarak patlat!', accent: '#ef4444' },

  // --- Kelime Oyunları (3) ---
  { id: 'word-scramble', title: 'Kelime Karıştır', shortDesc: 'Karışık harflerden kelime oluştur.', fullDesc: 'Harfler karıştırılmış bir kelime var. Doğru kelimeyi bul!', accent: '#8b5cf6' },
  { id: 'hangman-game', title: 'Adam Asmaca', shortDesc: 'Harfleri tahmin ederek kelimeyi bul.', fullDesc: 'Harfleri seçerek gizli kelimeyi bul. Yanlış tahminlere dikkat!', accent: '#ef4444' },
  { id: 'missing-letter', title: 'Eksik Harf', shortDesc: 'Kelimedeki eksik harfi bul.', fullDesc: 'Kelimede bir harf eksik. Doğru harfi seçerek tamamla!', accent: '#3b82f6' },

  // --- Izgara Bulmaca (3) ---
  { id: 'lights-out', title: 'Işıkları Söndür', shortDesc: 'Tüm ışıkları söndür.', fullDesc: 'Bir hücreye dokunduğunda komşularıyla birlikte değişir. Hepsini söndür!', accent: '#f59e0b' },
  { id: 'tile-flip', title: 'Karo Çevir', shortDesc: 'Tüm karoları aynı renge çevir.', fullDesc: 'Karolara dokunarak renklerini değiştir. Tümünü aynı renge getir!', accent: '#ef4444' },
  { id: 'pattern-copy', title: 'Desen Kopyala', shortDesc: 'Gösterilen deseni tekrarla.', fullDesc: 'Izgarada bir desen gösterilecek. Ezberle ve aynısını oluştur!', accent: '#8b5cf6' },

  // --- Kart Kaydırma & Jest (3) ---
  { id: 'true-or-false', title: 'Doğru mu Yanlış mı', shortDesc: 'Kartı sağa veya sola kaydır.', fullDesc: 'İfadeyi oku, doğruysa sağa yanlışsa sola kaydır!', accent: '#22c55e' },
  { id: 'math-comparison', title: 'Matematik Karşılaştır', shortDesc: 'Büyük olan tarafa kaydır.', fullDesc: 'İki işlemi karşılaştır. Büyük olan tarafa kaydır, eşitse yukarı!', accent: '#ef4444' },
  { id: 'higher-lower', title: 'Yüksek Düşük', shortDesc: 'Sonraki sayı yüksek mi düşük mü?', fullDesc: 'İki sayı göreceksin. Sonrakinin yüksek veya düşük olduğunu tahmin et!', accent: '#ef4444' },

  // --- Bilgi (3) ---
  { id: 'flag-quiz', title: 'Bayrak Testi', shortDesc: 'Bayrağın hangi ülkeye ait olduğunu bul.', fullDesc: 'Bayrak emojisini gör ve ülkesini bul!', accent: '#3b82f6' },
  { id: 'capital-quiz', title: 'Başkent Testi', shortDesc: 'Ülkenin başkentini bul.', fullDesc: 'Verilen ülkenin başkentini seçeneklerden bul!', accent: '#22c55e' },
  { id: 'animal-quiz', title: 'Hayvan Testi', shortDesc: 'Hayvan bilgini test et.', fullDesc: 'Hayvanlar hakkında soruları cevapla!', accent: '#f59e0b' },

  // --- Sıralama & Düzenleme (3) ---
  { id: 'category-sort', title: 'Kategori Sınıfla', shortDesc: 'Emojileri doğru kategoriye yerleştir.', fullDesc: 'Her emojiyi doğru kategoriye sınıfla!', accent: '#8b5cf6' },
  { id: 'planet-order', title: 'Gezegen Sırası', shortDesc: 'Gezegenleri sırala.', fullDesc: 'Güneş sistemindeki gezegenleri doğru sıraya diz!', accent: '#8b5cf6' },
  { id: 'food-chain', title: 'Besin Zinciri', shortDesc: 'Besin zincirini sırala.', fullDesc: 'Canlıları besin zincirine göre doğru sıraya diz!', accent: '#84cc16' },

  // --- Hafıza (3) ---
  { id: 'pin-code', title: 'PIN Kodu', shortDesc: 'Gösterilen PIN kodunu hatırla.', fullDesc: 'Kısa süreliğine PIN gösterilecek. Ezberle ve doğru gir!', accent: '#06b6d4' },
  { id: 'digit-span', title: 'Rakam Dizisi', shortDesc: 'Rakam dizisini hatırla ve tekrarla.', fullDesc: 'Sırayla rakamlar gösterilecek. Aynı sırayla tekrarla!', accent: '#14b8a6' },
  { id: 'stroop-test', title: 'Stroop Testi', shortDesc: 'Kelimenin rengini söyle, yazısını değil.', fullDesc: 'Yazının RENGINI seç, kelimeyi değil!', accent: '#f97316' },

  // --- Kaydırıcı & Tahmin (3) ---
  { id: 'percentage', title: 'Yüzde Hesapla', shortDesc: 'Kaydırıcıyla yüzdeyi ayarla.', fullDesc: 'Kaydırıcıyı sürükleyerek doğru yüzde değerini bul!', accent: '#3b82f6' },
  { id: 'temperature-convert', title: 'Sıcaklık Çevirici', shortDesc: 'Termometreyi kaydırarak çevir.', fullDesc: 'Termometre seviyesini ayarlayarak doğru Fahrenheit değerini bul!', accent: '#ef4444' },
  { id: 'angle-estimate', title: 'Açı Tahmin', shortDesc: 'Kolu döndürerek açıyı ayarla.', fullDesc: 'Döndürme hareketiyle doğru açıyı oluştur!', accent: '#f59e0b' },

  // --- Görsel Arama (3) ---
  { id: 'odd-one-out', title: 'Farklı Olan', shortDesc: 'Gruptan farklı olanı bul.', fullDesc: 'Emojiler arasından farklı olanı bul ve dokun!', accent: '#f59e0b' },
  { id: 'letter-hunt', title: 'Harf Avı', shortDesc: 'Hedef harfi bul.', fullDesc: 'Harfler arasından istenen harfi hızlıca bul!', accent: '#22c55e' },
  { id: 'visual-search', title: 'Görsel Arama', shortDesc: 'Hedef emojiyi bul.', fullDesc: 'Kalabalık emojiler arasında hedefi bul!', accent: '#ec4899' },

  // --- Strateji & Bulmaca (3) ---
  { id: 'tic-tac-toe', title: 'XOX Oyunu', shortDesc: 'Klasik XOX oyna.', fullDesc: 'Yapay zekaya karşı XOX oyna. Üç sıralı işareti diz!', accent: '#3b82f6' },
  { id: 'rock-paper-scissors', title: 'Taş Kağıt Makas', shortDesc: 'Klasik taş kağıt makas.', fullDesc: 'Bilgisayara karşı taş kağıt makas oyna!', accent: '#22c55e' },
  { id: 'tower-of-hanoi', title: 'Hanoi Kulesi', shortDesc: 'Diskleri sağ direğe taşı.', fullDesc: 'Tüm diskleri sol direkten sağ direğe taşı. Büyük küçüğün üstüne konamaz!', accent: '#f97316' },

  // --- İnşa & Giriş (3) ---
  { id: 'roman-numerals', title: 'Roma Rakamları', shortDesc: 'Sembollerle Roma rakamı yaz.', fullDesc: 'I, V, X gibi sembolleri birleştirerek doğru Roma rakamını oluştur!', accent: '#d4a574' },
  { id: 'morse-code', title: 'Mors Kodu', shortDesc: 'Nokta ve çizgiyle Mors kodu gir.', fullDesc: 'Nokta (.) ve çizgi (-) butonlarıyla harfin Mors kodunu oluştur!', accent: '#f97316' },
  { id: 'algebra-solve', title: 'Denklem Çöz', shortDesc: 'Tuş takımıyla denklemi çöz.', fullDesc: 'Denklemdeki bilinmeyeni bul ve tuş takımıyla gir!', accent: '#06b6d4' },

  // --- Aksiyon 2 (3) ---
  { id: 'whack-a-mole', title: 'Köstebek Vur', shortDesc: 'Çıkan köstebeklere hızlıca dokun.', fullDesc: 'Deliklerden çıkan köstebeklere hızlıca dokun!', accent: '#92400e' },
  { id: 'target-shoot', title: 'Hedef Vur', shortDesc: 'Hareketli hedefe dokun.', fullDesc: 'Ekranda hareket eden hedefe dokunarak puan kazan!', accent: '#dc2626' },
  { id: 'gravity-drop', title: 'Yerçekimi Düşüşü', shortDesc: 'Topu doğru kovaya düşür.', fullDesc: 'Renkli topu aynı renkteki kovaya düşür!', accent: '#ef4444' },

  // --- Sayı Dizisi (3) ---
  { id: 'sequence-complete', title: 'Dizi Tamamla', shortDesc: 'Sayı dizisindeki eksik sayıyı bul.', fullDesc: 'Dizideki kalıbı bul ve eksik sayıyı tamamla!', accent: '#3b82f6' },
  { id: 'fibonacci-next', title: 'Fibonacci', shortDesc: 'Dizideki sonraki sayıyı bul.', fullDesc: 'Fibonacci dizisinde sonraki sayıyı tahmin et!', accent: '#14b8a6' },
  { id: 'power-calc', title: 'Üs Hesapla', shortDesc: 'Üs alma işlemini çöz.', fullDesc: 'Verilen üs alma işleminin sonucunu hesapla!', accent: '#8b5cf6' },

  // --- Izgara Hafıza (3) ---
  { id: 'memory-grid', title: 'Hafıza Izgarası', shortDesc: 'Işıklı hücreleri hatırla.', fullDesc: 'Izgaradaki ışıklı hücreleri ezberle ve sonra doğru hücrelere dokun!', accent: '#3b82f6' },
  { id: 'mirror-image', title: 'Ayna Görüntüsü', shortDesc: 'Desenin ayna görüntüsünü oluştur.', fullDesc: 'Verilen desenin ayna yansımasını ızgarada oluştur!', accent: '#22c55e' },
  { id: 'pixel-art', title: 'Piksel Sanat', shortDesc: 'Verilen deseni kopyala.', fullDesc: 'Sol taraftaki piksel deseni sağ tarafta kopyala!', accent: '#ef4444' },

  // --- Kelime Bilgi (3) ---
  { id: 'antonym', title: 'Zıt Anlamlı', shortDesc: 'Kelimenin zıt anlamlısını bul.', fullDesc: 'Verilen kelimenin zıt anlamlısını seçeneklerden bul!', accent: '#ef4444' },
  { id: 'synonym', title: 'Eş Anlamlı', shortDesc: 'Kelimenin eş anlamlısını bul.', fullDesc: 'Verilen kelimenin eş anlamlısını seçeneklerden bul!', accent: '#22c55e' },
  { id: 'rhyme-match', title: 'Kafiye Eşleştir', shortDesc: 'Kafiyeli kelimeyi bul.', fullDesc: 'Verilen kelimeyle kafiyeli olanı bul!', accent: '#a855f7' },

  // --- Şans & Tahmin (3) ---
  { id: 'coin-flip', title: 'Yazı Tura', shortDesc: 'Sonucu tahmin et.', fullDesc: 'Para atılacak. Yazı mı tura mı gelecek?', accent: '#f59e0b' },
  { id: 'dice-guess', title: 'Zar Tahmini', shortDesc: 'Zar sonucunu tahmin et.', fullDesc: 'Zar atılacak. Yüksek mi düşük mü olacak?', accent: '#ef4444' },
  { id: 'card-high-low', title: 'Kart Yüksek Düşük', shortDesc: 'Sonraki kart yüksek mi düşük mü?', fullDesc: 'Sonraki kartın değerini tahmin et!', accent: '#06b6d4' },

  // --- Eşleştirme (3) ---
  { id: 'inventor-match', title: 'Mucit Eşleştir', shortDesc: 'Kart çevirerek mucit-icat eşle.', fullDesc: 'Kartları çevirerek mucitleri icatlarıyla eşleştir!', accent: '#06b6d4' },
  { id: 'unit-convert', title: 'Birim Çevirici', shortDesc: 'Sol ve sağ sütunu eşleştir.', fullDesc: 'Birim çiftlerini sütunlardan seçerek eşleştir!', accent: '#3b82f6' },
  { id: 'change-maker', title: 'Para Üstü', shortDesc: 'Madeni paralarla üstü ver.', fullDesc: 'Madeni paralara dokunarak tam para üstünü oluştur!', accent: '#22c55e' },

  // --- Eleme & Dokunma (3) ---
  { id: 'prime-check', title: 'Asal Eleme', shortDesc: 'Asal olmayanları eleye.', fullDesc: 'Izgaradan asal olmayan sayılara dokunarak ele! Asallara dokunma!', accent: '#a855f7' },
  { id: 'parity', title: 'Tek Çift Avı', shortDesc: 'Tüm tek veya çift sayılara dokun.', fullDesc: 'Izgarada istenen türdeki tüm sayılara hızlıca dokun!', accent: '#3b82f6' },
  { id: 'odd-even-tap', title: 'Tek Çift Dokun', shortDesc: 'Tek veya çift sayılara dokun.', fullDesc: 'İstenen türe göre doğru sayılara dokun!', accent: '#3b82f6' },

  // --- Bilgi 2 (3) ---
  { id: 'language-guess', title: 'Dil Tahmin', shortDesc: 'Kelimenin dilini tahmin et.', fullDesc: 'Kelimenin hangi dile ait olduğunu bul!', accent: '#ec4899' },
  { id: 'emoji-math', title: 'Emoji Matematik', shortDesc: 'Emojilerle matematik çöz.', fullDesc: 'Her emoji bir sayı. Denklemi çöz!', accent: '#f59e0b' },
  { id: 'binary-choice', title: 'İkilik Sistem', shortDesc: 'İkilik sayıyı onluk sisteme çevir.', fullDesc: 'İkilik sayının onluk karşılığını bul!', accent: '#22c55e' },

  // --- Kaydırıcı 2 (3) ---
  { id: 'tip-calculator', title: 'Bahşiş Hesapla', shortDesc: 'Kaydırarak bahşişi ayarla.', fullDesc: 'Kaydırıcıyla doğru bahşiş miktarını bul!', accent: '#22c55e' },
  { id: 'history-date', title: 'Tarih Bilgisi', shortDesc: 'Zaman çizelgesinde tarihi bul.', fullDesc: 'Pimi kaydırarak tarihi olayın yılını bul!', accent: '#92400e' },
  { id: 'hex-color', title: 'HEX Renk', shortDesc: 'RGB kaydırıcılarıyla renk karıştır.', fullDesc: 'Kırmızı, yeşil, mavi kaydırıcılarıyla hedef rengi yakala!', accent: '#ec4899' },

  // --- Bulmaca 2 (3) ---
  { id: 'minesweeper-lite', title: 'Mayın Tarlası', shortDesc: 'Mayınlardan kaçınarak aç.', fullDesc: 'Mayınlara basmadan tüm güvenli hücreleri aç!', accent: '#6b7280' },
  { id: 'slide-puzzle', title: 'Kaydırma Bulmacası', shortDesc: 'Sayıları sırayla diz.', fullDesc: 'Karoları kaydırarak sayıları sıraya diz!', accent: '#8b5cf6' },
  { id: 'bubble-sort-game', title: 'Kabarcık Sırala', shortDesc: 'Takas ederek sırala.', fullDesc: 'Yanyana elemanları takas ederek küçükten büyüğe diz!', accent: '#3b82f6' },

  // --- Kelime 2 (3) ---
  { id: 'word-chain', title: 'Kelime Zinciri', shortDesc: 'Son harfle başlayan kelimeyi seç.', fullDesc: 'Son harfle başlayan kelimeyi seç, zinciri sürdür!', accent: '#22c55e' },
  { id: 'spelling-bee', title: 'Heceleme', shortDesc: 'Kelimeyi doğru hecele.', fullDesc: 'Kelimenin doğru yazılışını bul!', accent: '#f59e0b' },
  { id: 'word-length', title: 'Kelime Uzunluğu', shortDesc: 'Kelimenin harf sayısını bul.', fullDesc: 'Kelimenin kaç harften oluştuğunu bul!', accent: '#06b6d4' },

  // --- Matematik (3) ---
  { id: 'square-root', title: 'Karekök', shortDesc: 'Sayının karekökünü bul.', fullDesc: 'Verilen sayının karekökünü hesapla!', accent: '#22c55e' },
  { id: 'gcd-game', title: 'EBOB Bul', shortDesc: 'İki sayının EBOB\'unu bul.', fullDesc: 'İki sayının en büyük ortak bölenini hesapla!', accent: '#ec4899' },
  { id: 'estimation', title: 'Tahmin Et', shortDesc: 'Noktaların sayısını tahmin et.', fullDesc: 'Ekrandaki noktaları hızlıca say ve tahmin et!', accent: '#f97316' },

  // --- Görsel Eşleştir (3) ---
  { id: 'shape-match', title: 'Şekil Eşleştir', shortDesc: 'Doğru şekli bul.', fullDesc: 'Gösterilen şekille eşleşeni bul!', accent: '#06b6d4' },
  { id: 'symbol-match', title: 'Sembol Eşleştir', shortDesc: 'Aynı sembolü bul.', fullDesc: 'Hedef sembolü seçeneklerden bul!', accent: '#f59e0b' },
  { id: 'shadow-match', title: 'Gölge Eşleştir', shortDesc: 'Gölgenin sahibini bul.', fullDesc: 'Karartılmış şeklin hangi emojiye ait olduğunu bul!', accent: '#6b7280' },

  // --- Özel Bulmaca (3) ---
  { id: 'rotate-shape', title: 'Şekil Döndür', shortDesc: 'Döndürülmüş şekli bul.', fullDesc: 'Belirtilen açıda döndürülmüş halini bul!', accent: '#8b5cf6' },
  { id: 'pattern-recognition', title: 'Kalıp Tanıma', shortDesc: 'Dizideki sonrakini bul.', fullDesc: 'Emoji dizisindeki kalıbı tanı ve sonrakini seç!', accent: '#ec4899' },
  { id: 'bracket-match', title: 'Parantez Yığını', shortDesc: 'Parantez dizisini sırayla oluştur.', fullDesc: 'Açma/kapama parantezlerle doğru diziyi oluştur!', accent: '#14b8a6' },

  // --- Aksiyon 3 (3) ---
  { id: 'stack-builder', title: 'Kule İnşa', shortDesc: 'Blokları üst üste yığ.', fullDesc: 'Hareket eden bloğu doğru zamanda bırakarak kule yap!', accent: '#22c55e' },
  { id: 'color-tap', title: 'Renk Dokun', shortDesc: 'İstenen renge hızla dokun.', fullDesc: 'İstenen renkteki kutuya hızlıca dokun!', accent: '#3b82f6' },
  { id: 'connect-dots', title: 'Nokta Birleştir', shortDesc: 'Noktaları sırayla birleştir.', fullDesc: 'Numaralı noktalara sırayla dokunarak birleştir!', accent: '#06b6d4' },

  // --- Kelime Analiz (3) ---
  { id: 'vowel-count', title: 'Sesli Harf Say', shortDesc: 'Sesli harfleri say.', fullDesc: 'Kelimedeki sesli harf sayısını bul!', accent: '#ec4899' },
  { id: 'syllable-count', title: 'Hece Say', shortDesc: 'Kelimenin hece sayısını bul.', fullDesc: 'Kelimenin kaç heceden oluştuğunu bul!', accent: '#14b8a6' },
  { id: 'abbreviation', title: 'Kısaltmalar', shortDesc: 'Kısaltmanın açılımını bul.', fullDesc: 'Kısaltmanın ne anlama geldiğini bul!', accent: '#84cc16' },

  // --- Devre & Bit (3) ---
  { id: 'factorial-guess', title: 'Faktöriyel', shortDesc: 'Adım adım çarparak bul.', fullDesc: 'Her adımda çarp butonuna basarak faktöriyeli hesapla!', accent: '#a855f7' },
  { id: 'logic-gate', title: 'Mantık Kapısı', shortDesc: 'Devreyi doğru çıkışa ayarla.', fullDesc: 'Girişleri değiştirerek istenen çıkışı elde et!', accent: '#8b5cf6' },
  { id: 'bit-flip', title: 'Bit Çevir', shortDesc: 'Bitleri hedefe eşitle.', fullDesc: 'Bitlere dokunarak 0/1 çevir ve hedef diziyle eşle!', accent: '#a855f7' },

  // --- Quiz (3) ---
  { id: 'base-convert', title: 'Taban Çevirici', shortDesc: 'Sayı tabanını çevir.', fullDesc: 'Onluk sayıları ikilik, sekizlik veya onaltılık sisteme çevir!', accent: '#8b5cf6' },
  { id: 'clock-reading', title: 'Saat Okuma', shortDesc: 'Analog saati oku.', fullDesc: 'Analog saat gösterilecek. Doğru saati bul!', accent: '#f59e0b' },
  { id: 'time-zone-game', title: 'Saat Dilimi', shortDesc: 'Farklı şehirlerde saati bul.', fullDesc: 'Bir şehirde saat verilecek. Başka şehirde kaç?', accent: '#8b5cf6' },

  // --- Özel Etkileşim (3) ---
  { id: 'musical-note', title: 'Müzik Notası', shortDesc: 'Piyanoda doğru notayı çal.', fullDesc: 'Notaları ezberle ve piyano tuşlarında çal!', accent: '#f97316' },
  { id: 'periodic-element', title: 'Periyodik Tablo', shortDesc: 'Tabloda elementi bul ve dokun.', fullDesc: 'Mini periyodik tabloda istenen elementi bul!', accent: '#14b8a6' },
  { id: 'trail-making', title: 'İz Sürme', shortDesc: 'Sayıları sırayla takip et.', fullDesc: 'Ekrandaki sayılara küçükten büyüğe sırayla dokun!', accent: '#a855f7' },

  // --- Karşılaştırma (3) ---
  { id: 'scale-compare', title: 'Terazi Karşılaştır', shortDesc: 'Hangi taraf daha ağır?', fullDesc: 'Terazinin ağır tarafını belirle!', accent: '#f59e0b' },
  { id: 'fraction-compare', title: 'Kesir Karşılaştır', shortDesc: 'Büyük kesre dokun.', fullDesc: 'Doluluk çubuğuna bakarak büyük kesri seç!', accent: '#f59e0b' },
  { id: 'color-blend', title: 'Renk Karıştır', shortDesc: 'İki rengin karışımını bul.', fullDesc: 'İki ana rengi karıştırınca ne oluşur?', accent: '#ec4899' },

  // --- Zamanlı Hesap (3) ---
  { id: 'speed-calc-game', title: 'Hızlı Hesap', shortDesc: 'Süre dolmadan işlemi çöz.', fullDesc: 'Zamana karşı matematik işlemlerini çöz!', accent: '#ef4444' },
  { id: 'calendar-math', title: 'Takvim Matematiği', shortDesc: 'Takvimde gün say veya bul.', fullDesc: 'Takvim ızgarasında gün say veya doğru tarihi bul!', accent: '#06b6d4' },
  { id: 'quick-count', title: 'Hızlı Sayım', shortDesc: 'Nesneleri hızlıca say.', fullDesc: 'Ekranda emojiler belirecek. Kaç tane?', accent: '#8b5cf6' },

  // --- Sayma & Ölçme (3) ---
  { id: 'area-calc', title: 'Alan Hesapla', shortDesc: 'Renkli kareleri say.', fullDesc: 'Izgaradaki renkli kareleri sayarak alanı bul!', accent: '#14b8a6' },
  { id: 'perimeter-calc', title: 'Çevre Hesapla', shortDesc: 'Kenarları sayarak çevreyi bul.', fullDesc: 'Şeklin kenar çizgilerini sayarak çevresini hesapla!', accent: '#3b82f6' },
  { id: 'lucky-number', title: 'Şanslı Sayı', shortDesc: 'Gizli sayıyı tahmin et.', fullDesc: 'İpuçlarıyla gizli sayıyı bul! Hakkın sınırlı!', accent: '#f59e0b' },

  // --- Son Üçlü (3) ---
  { id: 'arrow-match', title: 'Ok Eşleştir', shortDesc: 'Okun yönünü doğru seç.', fullDesc: 'Okun gösterdiği yöne doğru butona bas!', accent: '#3b82f6' },
];
