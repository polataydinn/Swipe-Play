export const GAME_DESCRIPTIONS = [
  // --- Hafıza ---
  { id: 'color-memory', title: 'Renk Hafiza', shortDesc: 'Renk sirasini ezberle ve tekrarla.', fullDesc: 'Ekranda bir dizi renk belirecek. Sirayi dikkatlice izle ve ayni sirayla tekrarla.', accent: '#e74c3c' },
  { id: 'memory-match', title: 'Hafiza Eslestirme', shortDesc: 'Emoji ciftlerini bul ve eslestir.', fullDesc: 'Kartlari cevirerek ayni emoji ciftlerini bul.', accent: '#e67e22' },
  { id: 'digit-span', title: 'Rakam Dizisi', shortDesc: 'Rakam dizisini hatirla ve tekrarla.', fullDesc: 'Sirayla rakamlar gosterilecek. Ayni sirayla tekrarla!', accent: '#14b8a6' },
  { id: 'memory-grid', title: 'Hafiza Izgarasi', shortDesc: 'Isikli hucreleri hatirla.', fullDesc: 'Izgaradaki isikli hucreleri ezberle ve sonra dogru hucrelere dokun!', accent: '#3b82f6' },
  { id: 'pattern-copy', title: 'Desen Kopyala', shortDesc: 'Gosterilen deseni tekrarla.', fullDesc: 'Izgarada bir desen gosterilecek. Ezberle ve aynisini olustur!', accent: '#8b5cf6' },

  // --- Müzik ---
  { id: 'musical-note', title: 'Muzik Notasi', shortDesc: 'Notayi duyun, dogru tusa bas.', fullDesc: 'Do Re Mi notalarini dinle ve piyano tuslarinda ayni siraya bas!', accent: '#f97316', singleLevel: true },

  // --- Aksiyon & Refleks ---
  { id: 'whack-a-mole', title: 'Kostebek Vur', shortDesc: 'Cikan kostebeklere hizlica dokun.', fullDesc: 'Deliklerden cikan kostebeklere hizlica dokun!', accent: '#92400e' },
  { id: 'target-shoot', title: 'Hedef Vur', shortDesc: 'Hareketli hedefe dokun.', fullDesc: 'Ekranda hareket eden hedefe dokunarak puan kazan!', accent: '#dc2626' },
  { id: 'gravity-drop', title: 'Yercekimi Dususu', shortDesc: 'Topu dogru kovaya dusur.', fullDesc: 'Renkli topu ayni renkteki kovaya dusur!', accent: '#ef4444' },
  { id: 'stack-builder', title: 'Kule Insa', shortDesc: 'Bloklari ust uste yig.', fullDesc: 'Hareket eden blogu dogru zamanda birakarak kule yap!', accent: '#22c55e' },

  // --- Kelime ---
  { id: 'hangman-game', title: 'Adam Asmaca', shortDesc: 'Harfleri tahmin ederek kelimeyi bul.', fullDesc: 'Harfleri secerek gizli kelimeyi bul. Yanlis tahminlere dikkat!', accent: '#ef4444' },

  // --- Izgara Bulmaca ---
  { id: 'lights-out', title: 'Isiklari Sondur', shortDesc: 'Tum isiklari sondur.', fullDesc: 'Bir hucreye dokundugunda komsulariyla birlikte degisir. Hepsini sondur!', accent: '#f59e0b' },
  { id: 'tile-flip', title: 'Karo Cevir', shortDesc: 'Tum karolari ayni renge cevir.', fullDesc: 'Karolara dokunarak renklerini degistir. Tumunu ayni renge getir!', accent: '#ef4444' },
  { id: 'minesweeper-lite', title: 'Mayin Tarlasi', shortDesc: 'Mayinlardan kacinarak ac.', fullDesc: 'Mayinlara basmadan tum guvenli hucreleri ac!', accent: '#6b7280' },
  { id: 'slide-puzzle', title: 'Kaydirma Bulmacasi', shortDesc: 'Sayilari sirayla diz.', fullDesc: 'Karolari kaydirarak sayilari siraya diz!', accent: '#8b5cf6' },

  // --- Görsel ---
  { id: 'mirror-image', title: 'Ayna Goruntusu', shortDesc: 'Desenin ayna goruntusu olustur.', fullDesc: 'Verilen desenin ayna yansimisini izgarada olustur!', accent: '#22c55e' },
  { id: 'pixel-art', title: 'Piksel Sanat', shortDesc: 'Verilen deseni kopyala.', fullDesc: 'Sol taraftaki piksel deseni sag tarafta kopyala!', accent: '#ef4444' },
  { id: 'rotate-shape', title: 'Sekil Dondur', shortDesc: 'Dondurlmus sekli bul.', fullDesc: 'Belirtilen acida dondurlmus halini bul!', accent: '#8b5cf6' },

  // --- Strateji & Bulmaca ---
  { id: 'tic-tac-toe', title: 'XOX Oyunu', shortDesc: 'Klasik XOX oyna.', fullDesc: 'Yapay zekaya karsi XOX oyna. Uc sirali isareti diz!', accent: '#3b82f6', singleLevel: true },
  { id: 'tower-of-hanoi', title: 'Hanoi Kulesi', shortDesc: 'Diskleri sag direge tasi.', fullDesc: 'Tum diskleri sol direkten sag direge tasi. Buyuk kucugun ustune konamaz!', accent: '#f97316' },

  // --- Matematik ---
  { id: 'emoji-math', title: 'Emoji Matematik', shortDesc: 'Emojilerle matematik coz.', fullDesc: 'Her emoji bir sayi. Denklemi coz!', accent: '#f59e0b' },
  { id: 'algebra-solve', title: 'Denklem Coz', shortDesc: 'Tus takimiyla denklemi coz.', fullDesc: 'Denklemdeki bilinmeyeni bul ve tus takimiyla gir!', accent: '#06b6d4' },

  // --- Bilgi ---
  { id: 'periodic-element', title: 'Periyodik Tablo', shortDesc: 'Tabloda elementi bul ve dokun.', fullDesc: 'Mini periyodik tabloda istenen elementi bul!', accent: '#14b8a6', singleLevel: true },

  // --- Klasik ---
  { id: 'snake-lite', title: 'Yilan Oyunu', shortDesc: 'Klasik yilan oyunu, yemleri topla.', fullDesc: 'Yilani kontrol et ve yemleri topla. Duvarlara carpmadan buyumeye devam et.', accent: '#2ecc71' },
  { id: 'finger-maze', title: 'Parmak Labirent', shortDesc: 'Duvarlara dokunmadan cikisi bul.', fullDesc: 'Parmagini baslangictan bitise surukle. Duvarlara dokunma!', accent: '#00bcd4' },

  // --- Arcade ---
  { id: 'game-2048', title: '2048', shortDesc: 'Kaydirarak sayilari birlestir.', fullDesc: 'Ayni sayili karolari birlestirerek hedefe ulas! Klasik 2048 bulmacasi.', accent: '#edc22e', singleLevel: true },
  { id: 'flappy-dot', title: 'Flappy Dot', shortDesc: 'Dokunarak engelleri as.', fullDesc: 'Noktayi ucur ve yesil borularin arasindan gecir!', accent: '#facc15', singleLevel: true },
  { id: 'brick-breaker', title: 'Tugla Kir', shortDesc: 'Topla tuglalari kir.', fullDesc: 'Paddle\'i kaydirarak topu sektir ve tum tuglalari kir! ★ yakala = 2. top!', accent: '#3b82f6' },
  { id: 'pong-lite', title: 'Pong', shortDesc: 'Klasik Pong, AI\'ya karsi oyna.', fullDesc: 'Paddle\'ini kaydirarak topu karsi tarafa gonder!', accent: '#22c55e' },
  { id: 'mahjong-match', title: 'Mahjong Esle', shortDesc: 'Mahjong taslarini eslestir.', fullDesc: 'Ayni sembolli taslari bularak eslestir! Sure dolmadan tamamla.', accent: '#8b5cf6' },
  { id: 'sokoban-puzzle', title: 'Sokoban', shortDesc: 'Kutulari hedeflere it.', fullDesc: 'Kutulari iterek kirmizi hedeflerin uzerine yerlestir! Minimum hamleyle coz.', accent: '#f59e0b' },
  { id: 'match-3-game', title: 'Match 3', shortDesc: 'Uclu eslestir, bomba patlat.', fullDesc: 'Komsu taslari degistirerek 3+ ayni rengi yan yana getir! 4lusu bomba yapar.', accent: '#a855f7', singleLevel: true },
  { id: 'doodle-jump', title: 'Zipla!', shortDesc: 'Platformlara ziplayarak yuksel.', fullDesc: 'Platformdan platforma zipla! ⚡ yakala - ekstra ziplama gucu kazan.', accent: '#22c55e', singleLevel: true },
  { id: 'color-runner', title: 'Renk Kosusu', shortDesc: 'Renk degistir, kapilardan gec.', fullDesc: 'Dokunarak rengini degistir ve ayni renkteki kapilardan gec!', accent: '#ef4444' },
  { id: 'asteroid-blast', title: 'Asteroid', shortDesc: 'Asteroitleri vurarak hayatta kal.', fullDesc: 'Dokunarak ates et ve asteroitleri yok et! Carpismadan kacin.', accent: '#6b7280' },
  { id: 'ski-free', title: 'Kayak', shortDesc: 'Engelleri atlatarak kayaga devam et.', fullDesc: 'Agaclardan ve kayalardan kacinarak dagdan asagi kay!', accent: '#60a5fa', singleLevel: true },

  // --- Çizim ---
  { id: 'circle-draw', title: 'Yuvarlak Ciz', shortDesc: 'Mukemmel daire ciz, skorunu gör.', fullDesc: 'Parmağını kaldırmadan mükemmel bir daire çiz! Gökkuşağı renkleri seni yönlendirir.', accent: '#06b6d4', singleLevel: true },

  // --- Yeni Oyunlar ---
  { id: 'egg-farm', title: 'Yumurta Çiftliği', shortDesc: 'Tavuk al, yumurta sat, büyü!', fullDesc: 'Tavukların yumurtalarını topla ve sat! Daha fazla tavuk al, hız ve değeri artır, altın tavuğa ulaş.', accent: '#f59e0b', singleLevel: true },
  { id: 'hunting-game', title: 'Avcı', shortDesc: 'Nişan al ve hayvan avla.', fullDesc: 'Ekranı kaydırarak 360° döndür, ortadaki nişangahı hayvanın üzerine getir ve ateş et!', accent: '#6b7280', singleLevel: true },
  { id: 'flappy-first', title: '3D Flappy', shortDesc: 'İlk şahıs Flappy Bird!', fullDesc: 'Tünelin içinden uç! 3D perspektiften borulardan geç, dokunarak yukarı çık.', accent: '#facc15', singleLevel: true },
  { id: 'fishing-net', title: 'Ağ Balıkçılık', shortDesc: 'Ağ çizerek balık yakala.', fullDesc: 'Parmağını hızlıca kaydırarak balıkların üzerinden geç ve ağa takılmalarını sağla!', accent: '#38bdf8', singleLevel: true },
  { id: 'gold-miner', title: 'Altın Madenci', shortDesc: 'Kancayı fırlat, madenleri topla.', fullDesc: 'Salınan kancayı doğru anda fırlat! Altın ve elmas yakala, kayadan kaçın.', accent: '#f59e0b' },
  { id: 'twin-runner', title: 'İkiz Koşucu', shortDesc: 'İki karakteri aynı anda atla!', fullDesc: 'Ekranın üst ve alt yarısına dokunarak iki koşucuyu eş zamanlı zıplat, engellerden kaçın!', accent: '#6366f1' },
  { id: 'ball-dodge', title: 'Top Kaçış', shortDesc: 'Düşen toplardan kaçın!', fullDesc: 'Sağa sola hareket ederek yukarıdan düşen toplardan kaçın. Hayatta kaldıkça puan kazan!', accent: '#f97316' },
  { id: 'bike-jump', title: 'Bisikletçi', shortDesc: 'Engelleri atlayarak ilerle!', fullDesc: 'Dokunarak zıpla, çift zıplama yaparak engelleri ve uçan kuşları aş!', accent: '#22c55e' },
  { id: 'stack-tower', title: 'Kule İnşa', shortDesc: 'Platformları üst üste dengele!', fullDesc: 'Sallanan platformu tam üstüne denk getir ve bas! Hassas yerleştir, kuleyi büyüt!', accent: '#eab308' },
  { id: 'bottle-drop', title: 'Şişe Fırlat', shortDesc: 'Şişeyi boşluktan geçir!', fullDesc: 'Sallanan şişeyi tam boşluğa denk gelince bırak! Her geçişte boşluk değişir.', accent: '#38bdf8' },
];
