# Hıfz — Sure & Dua Ezber Atölyesi

React + TypeScript + Tailwind CSS + Lucide. Vinext/Cloudflare Worker sunucusu, anahtarsız Kur’an veri rotası ve isteğe bağlı Gemini rotası.

## Çalıştırma

Node.js 22.13+ gerekir.

```sh
npm install
npm run dev
```

Önizleme: http://127.0.0.1:5173 · Giriş: `/` · Ezber: `/calis`

Açık/koyu tema seçimi cihazda hatırlanır. Girişte kategori seçimi, hızlı bağlantılar ve son çalışmaya dönüş bulunur.

```sh
npm run check
npm test
npm run build
npm start
```

Windows'ta sistem npm sarmalayıcısı yanlış yol seçerse `node "C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js" install` kullanılabilir. Uygulamayı doğrudan başlatmak için `node scripts/run-framework.mjs dev`.

## İçerik ve davranış

- 114 surelik eksiksiz dizin; toplam 6236 ayet.
- 26 temel sure/aşır seçimi, 156 kaynak ayet ve sekiz namaz duası gömülü.
- Arapça / okunuş / anlam katmanları; beş kademeli ipucu aşaması, kelimeye dokunarak açma, Space ipucu, tümünü aç/gizle ve sıfırlama.
- Zincirleme ezber: 1 → 2 → 1+2 → 3 → 1+2+3; bağlamada önceki ayetler ilk harf, yeni ayet son iki kelime ipucuyla gelir. Üç seçenekli boşluk doldurma ve cihazda saklanan zor kelime filtresi bulunur.
- Uzun surelerde beşli bölümler, son üç ayet ve 1–20 ayetlik özel aralık.
- Ayet sesleri: Mişârî Râşid el-Afâsî; tek dinleme veya dinle → sessiz tekrar → kontrol döngüsü. Ses akışı internet gerektirir. Dualar için cihazda Arapça konuşma sesi varsa tarayıcı seslendirmesi kullanılır; bu, kârî kaydı değildir.
- Ezber işaretleri ve indirilen aralıklar localStorage'da kalır. Üretim sürümündeki Service Worker arayüz dosyalarını çevrimdışı saklar; ilk çevrimiçi ziyaret gereklidir.

## Kaynaklar ve doğruluk

- [AlQuran Cloud](https://alquran.cloud/api): tam Arapça metin, Muhammet Abay Türkçe çeviriyazı, Diyanet Vakfı meali, Afâsî ses adresleri.
- [Quran.com API](https://api-docs.quran.com/): kelime Arapçaları ve Türkçe anlamları, Diyanet meali (77).
- [Açık Kuran API](https://github.com/acik-kuran/acikkuran-api): birincil Türkçe kelime kaynağı; güncel `verseparts` rotası kullanılır. İlk canlı kontrolde DNS çözümlenemedi; bu kaynak çalışıyor olarak raporlanmaz.
- [EveryAyah](https://everyayah.com/): alternatif ayet sesleri.

Türkçe okunuşlar `tr.transliteration` (Muhammet Abay), ayet mealleri `tr.vakfi` (Diyanet Vakfı) kaynağındandır. 114 sure / 6236 ayetlik kaynak korpusu sunucuda gömülüdür. İngilizce kelime çevriyazısından Türkçe okunuş üretilmez. Fâtiha kelimelerinde bağımsız kelime başlangıçları düzenlenmiştir. Diğer ayetlerde yalnız kesin eşleşen kaynak grupları bölünür; eşleşme belirsizse Arapça ve kaynak Türkçe okunuş aynı ifade kartında birlikte tutulur; bağımsız kelime okunuşu tahmin edilmez. Bu durumda gizleme ve seçenekler ifade düzeyinde çalışır. Dipnot rakamları mealden temizlenir.

Dualar anlam bütünlüğüne göre elle bölünmüş geleneksel metinlerdir. Rabbena dualarının Kur’an karşılıkları Bakara 2:201 ve İbrahim 14:41'dir. Namaz dualarının okunuşları için [Diyanet namaz rehberi](https://namaz.diyanet.gov.tr/) karşılaştırma kaynağıdır. Bu proje dinî metin uzmanı tarafından son redaksiyondan geçirilmiş sayılmaz.

Gömülü veri yenileme: `npm run data:refresh`. Kaynak ve indirme zamanı `lib/hifz/provenance.json` içindedir. Veri kaynaklarının kendi kullanım koşulları geçerlidir. Amiri ve Manrope yazı tiplerinin OFL lisansları `public/fonts/` içinde korunmuştur.

## Gemini

Anahtar tarayıcıya gönderilmez. Sunucuda `GEMINI_API_KEY` tanımlanınca `@google/genai` üzerinden `gemini-2.5-flash` kullanılabilir. Yerelde `.dev.vars` dosyası, Sites üzerinde gizli ortam değişkeni kullanın. `.dev.vars` Git tarafından dışlanır. Model yalnızca seçilmiş en fazla beş ayetin kelime okunuş ve anlamını işler. Arapça metin/sıra kontrol edilir; tam kaynak ayet ve meal değiştirilmez. Sonuç yapay zekâ eşleştirmesi olarak etiketlenir ve localStorage'a kaydedilir. Anahtar verilmediğinde özellik kapalıdır; canlı Gemini testi yapılmamıştır.

## Doğrulama

`npm test`: gizleme, zincirleme, sınırlar, tüm gömülü içerik katmanları ve sağlayıcı başarısızlıkları için 45 test. Sağlayıcı yedekleri fixture ile sınanır; bunlar canlı servis testi değildir.

`node scripts/check-live-bulk.mjs`: dört toplu sürümde 114 sure / 6236 ayet eksiksizliği. Tüm MP3'leri çalmaz. Ayrı sure çağrılarını çok sık yapmak HTTP 429 üretebilir; denetim için toplu çağrıyı tercih edin.

Odak düğmesi standart/boşluk doldurma görünümünde tek ayeti gösterir; önceki/sonraki oklarıyla geçiş yapılır. Escape odaktan çıkar; / aramayı açar. Space, giriş alanları ve düğmeler dışında sıradaki kelimeyi açar. Çalışma modu, aşama, zincirleme adımı, ayet konumu ve açılan kelimeler içerik/aralık başına cihazda saklanır. Yazı boyutu ve görünüm katmanları da hatırlanır. Ana sayfadaki Devam et bağlantısı son ayet aralığını taşır.

Aynı seçili sureye yeniden basmak ilerlemeyi sıfırlamaz. Bozuk önbellek/eksik yanıt gösterilmez; görünümde en az bir katman açık tutulur. Zincirleme modunun otomatik ipuçları sırasında elle aşama seçimi devre dışıdır. Ses oturumu sayfadan ayrılınca iptal edilir. Çevrimdışı sayfalar sorgu adresine göre ayrı saklanır.

İçerik isteği, yanıt gövdesi dahil 30 saniye ile sınırlıdır; süre dolunca mevcut yeniden deneme kontrolü açılır. Test seçenekleri Arapça kapalıysa Türkçe okunuşla gösterilir ve görünen etiketler birbirinden ayrıdır. Testte en az bir kelime katmanı açık kalır. Arapça cihaz sesi bulunmayan dualarda dinleme kontrolleri pasiftir; ses listesi sonradan hazır olduğunda güncellenir. Doğrudan Türkçe verseparts verisi, farklı bir birleşik ayet çevriyazısı yüzünden silinmez.

Ayrıntılı gerçekleşen kontroller ve sınırlamalar `VERIFICATION.md` dosyasındadır.
