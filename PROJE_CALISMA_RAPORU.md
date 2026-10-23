# Hıfz Projesi Çalışma Raporu

## 1. Projenin amacı

Hıfz, sure ve dua ezberlemeyi kolaylaştıran web tabanlı bir çalışma uygulamasıdır. Uygulama Arapça öğretmekten çok, ayeti bütün halinde görme, dinleme, ipuçlarını kademeli azaltma ve aktif hatırlama yoluyla ezber yapmaya odaklanır.

Temel yaklaşım şudur:

1. Kullanıcı sureyi veya duayı seçer.
2. Ayetin Arapçasını, Türkçe okunuşunu ve mealini birlikte görür.
3. İpuçlarını aşamalı olarak azaltır.
4. Gizlenen kelimeleri zihninden söyleyip dokunarak açar.
5. Zorlandığı kelimeleri işaretler ve sonraki çalışmalarda yalnız bu noktalara yoğunlaşır.
6. Dinleme, zincirleme ve boşluk doldurma yöntemleriyle aynı içeriği farklı geri çağırma biçimlerinde tekrar eder.

## 2. Kullanıcı akışı

### Ana giriş sayfası

Ana sayfa üç çalışma alanına giriş verir:

- **Sureler:** Sık çalışılan kısa sureler ve özel ayet grupları.
- **Dualar:** Namaz duaları ve Rabbena duaları.
- **114 Sure:** Kur'an'ın bütün sure dizini.

Kullanıcının önceki çalışması cihazda bulunuyorsa ana sayfada **Devam et** bağlantısı gösterilir. Bu bağlantı son seçilen içeriği ve ayet aralığını yeniden açar. Fâtiha, Âyetel Kürsî ve Yâsîn için hızlı bağlantılar da bulunur.

### Çalışma sayfası

Çalışma sayfasında kullanıcı:

- içerik arayabilir ve sure/dua değiştirebilir,
- uzun surelerde beşli ayet grubu, son üç ayet veya en fazla 20 ayetlik özel aralık seçebilir,
- Arapça, okunuş ve meal katmanlarını ayrı ayrı açıp kapatabilir,
- yazı boyutunu değiştirebilir,
- açık ve koyu tema arasında geçiş yapabilir,
- standart, zincirleme veya boşluk doldurma modunu seçebilir,
- tek bir ayete odaklanabilir.

Arayüz en az bir içerik katmanını görünür tutar. Böylece yanlış veya eski bir cihaz ayarı yüzünden çalışma alanının tamamen boş kalması engellenir.

## 3. Ezber aşamaları

Uygulamada beş kademeli ipucu azaltma sistemi vardır.

### 1. Kodlama

Arapça ayet, Türkçe okunuş ve meal açıktır. Kullanıcı ayetin sesini, görünüşünü ve anlamını birlikte kodlar.

### 2. Ayet Sonu

Her ayetin son iki kelimesi gizlenir. Kullanıcı ayetin akışından yararlanarak sonunu üretmeye çalışır.

### 3. Anahtar Kelimeler

Kısa edat ve bağlaçlar görünür kalır; anlam yükünü taşıyan diğer kelimeler gizlenir. Parçacık tespiti sınırlı ve açık bir Arapça sözcük listesiyle yapılır; uygulama kapsamlı bir dilbilgisi çözümleyicisi kullanmaz.

### 4. Okunuş İpucu

Arapça kelime bütün olarak bulanık kalır. Türkçe okunuşun yalnız ilk iki karakteri gösterilir; örneğin `Bi…` veya `Er…`. Böylece tek tek Arapça harf öğretmek yerine ayetin bilinen ses akışı hatırlatılır.

### 5. Aktif Hatırlama

Bütün kelimeler gizlenir. Yalnız sıradaki kelimenin konumu vurgulanır. Kullanıcı kelimeyi zihninden söyledikten sonra dokunarak sırayla açar.

Kelimenin üzerine çift dokunmak veya altındaki küçük işareti kullanmak o kelimeyi **Zorlandım** olarak kaydeder. **Zorlandıklarım** filtresi, daha önce işaretlenen yerleri yeniden çalıştırır.

## 4. Çalışma modları

### Standart

Seçilen ayetlerin klasik çalışma görünümüdür. Kullanıcı aşamayı kendisi seçer, kelimeleri açıp kapatır ve görünüm katmanlarını yönetir.

### Zincirleme

Ayetleri kademeli biçimde birleştirir. Akış `1 → 2 → 1+2 → 3 → 1+2+3` biçimindedir. Yeni ayet önce tek başına öğrenilir; birleştirme adımında önceki ayetler daha az ipucuyla, yeni ayet ise ayet sonu gizleme düzeyinde gösterilir. Bu mod aşamaları otomatik belirlediği için manuel aşama düğmeleri devre dışı kalır.

### Boşluk Doldur

Sıradaki gizli kelime için üç seçenek üretir: bir doğru cevap ve kaynak içerikten seçilen iki farklı çeldirici. Doğru seçenek kelimeyi açar. Yanlış seçenek ilgili kelimeyi görünür hale getirir ve zorlanılan kelime olarak işaretler. Arapça katmanı kapalıysa seçenekler Türkçe okunuş üzerinden gösterilir.

## 5. Arapça metin ve okunuş gösterimi

Arapça metin, ayrı harf veya kutu dizileri halinde değil, sağdan sola doğal bir ayet satırı olarak gösterilir. Kelimeler görsel olarak ayetin parçasıdır; buna rağmen her kelime dokunma ve zorlanma işaretleme açısından bağımsız etkileşim noktasıdır.

Kullanılan yazı tipi **Noto Naskh Arabic**'tir ve proje içinde barındırılır. Kaynak verideki elif-i vasla karakteri (`ٱ`) yalnız ekrandaki sunumda sade elif (`ا`) olarak gösterilir. Depolanan kaynak metin, ses bağlantısı ve veri modeli değiştirilmez; diğer hareke ve Kur'an okuma işaretleri korunur.

Ayet tamamen açıkken Türkçe okunuş, kaynaktaki birleşik ayet okunuşu olarak tek satırda gösterilir. Kapsamlı ve güvenilir kelime eşleşmesi bulunmadığında uygulama okunuşu tahmin ederek parçalamaz; Arapça ifade ve kaynak okunuş birlikte daha büyük bir grup olarak tutulur.

## 6. Sesli çalışma

Sure ayetlerinde, mevcutsa Mişârî Râşid el-Afâsî tilavet bağlantısı kullanılır. Normal dinleme ayeti bir kez çalar.

Tekrarlı çalma, gölgeleme döngüsü uygular:

1. Ayet dinletilir.
2. Ses bittikten sonra ayetin süresi kadar; süre bilinmiyorsa dört saniye sessiz beklenir.
3. Bu aralıkta **Sıra Sende** işareti gösterilir ve kullanıcı ayeti yüksek sesle tekrar eder.
4. Ayet yeniden çalınarak kontrol yapılır.

Dualarda kayıtlı bir MP3 bulunmadığında tarayıcının Arapça konuşma sesi kullanılabilir. Cihazda Arapça ses yoksa ilgili dinleme kontrolü pasif olur. Kullanıcı içerik değiştirdiğinde veya sayfadan ayrıldığında önceki ses, zamanlayıcı ve geri çağırmalar iptal edilir; eski bir ses oturumunun yeni çalışmayı etkilemesi önlenir.

## 7. İçerik yapısı ve veri kaynakları

Uygulamada 114 sure ve toplam 6236 ayet için gömülü Türkçe okunuş ve meal korpusu vardır. Ayrıca sık kullanılan 26 sure/ayet seçimi, 156 gömülü kaynak ayeti ve sekiz dua bulunur.

Canlı içerik alınırken kaynak zinciri şöyledir:

1. **Açık Kuran:** Arapça ayet, Türkçe okunuş, meal ve kelime parçaları için birincil kaynak.
2. **AlQuran Cloud:** Birincil kaynak yanıt vermezse Arapça metin, Türkçe çeviriyazı, Diyanet meali ve ses için yedek.
3. **Quran.com:** Kelime katmanı ve ikinci yedek içerik kaynağı.
4. **EveryAyah:** Ayet sesi için alternatif adres düzeni.

Sunucu, dış kaynaktan gelen veriyi doğrudan ekrana vermez. Yanıtın ayet sayısı, sırası, zorunlu metin alanları ve kelime yapısı doğrulanır. Eksik, sırası bozuk veya hatalı biçimdeki veri reddedilir. İstek başına en fazla 20 ayet alınabilir. İstemci isteği başlık ve yanıt gövdesi dahil 30 saniye ile sınırlıdır; süre aşımında kullanıcı yeniden deneyebilir.

Türkçe ayet okunuşu ve meal için gömülü doğrulanmış korpus son katman olarak uygulanır. Böylece harici sağlayıcının İngilizce çevriyazısı Türkçe okunuş diye gösterilmez.

## 8. Verinin uygulama içindeki akışı

Bir sure seçildiğinde işlem sırası şöyledir:

1. URL'deki kategori, içerik ve ayet aralığı doğrulanır.
2. Dua seçildiyse yerel dua verisi doğrudan hazırlanır.
3. Gömülü sure/ayet seçimi varsa hazır veri kullanılabilir.
4. Diğer surelerde `/api/lesson` rotası dış sağlayıcılardan içeriği toplar.
5. Sağlayıcı yanıtı veri şemasından ve ayet sırasından geçirilir.
6. Gömülü Türkçe okunuş ve meal katmanı eşleştirilir.
7. İstemci, gelen ders nesnesini yeniden doğrular.
8. Geçerli içerik çalışma bileşeninde gösterilir ve daha sonra kullanılmak üzere cihaz önbelleğine alınabilir.

Ana veri modeli üç seviyelidir:

- **Lesson:** Kaynak bilgisi ve ayet listesi.
- **Verse:** Ayet numarası, Arapça metin, okunuş, meal, kelimeler ve isteğe bağlı ses.
- **Word:** Arapça kelime veya ifade grubu, Türkçe okunuş ve anlam.

## 9. İlerleme ve cihazda saklanan bilgiler

Sunucuda kullanıcıya özel ezber veritabanı yoktur. Aşağıdaki bilgiler tarayıcının `localStorage` alanında tutulur:

- son çalışılan sure/dua ve ayet aralığı,
- seçilen ezber aşaması ve çalışma modu,
- zincirleme adımı,
- odak görünümündeki ayet,
- açılmış kelimeler,
- zorlanılan kelimeler,
- Arapça/okunuş/meal görünürlüğü,
- yazı boyutu,
- tema tercihi,
- doğrulanmış ders önbelleği.

Kayıtlar içerik ve ayet aralığına göre ayrılır. Eski veya elle bozulmuş değerler sınır kontrolünden geçirilir; desteklenmeyen mod, aşama veya aralıklar varsayılan değerlere döner. Bu veriler aynı tarayıcı ve cihazda kalır; başka cihazlara otomatik eşitlenmez.

## 10. Çevrimdışı çalışma

Üretim sürümünde bir Service Worker çalışır. Ana sayfa, çalışma sayfası, arayüz dosyaları, simge ve yerel yazı tipleri önbelleğe alınır. Daha önce ziyaret edilmiş çalışma adresleri sorgu parametreleriyle birlikte ayrı tutulur; örneğin iki farklı sure seçimi aynı çevrimdışı sayfa kaydını yanlışlıkla paylaşmaz.

Çevrimdışı kullanımın sınırı şudur: uygulama kabuğu ve daha önce önbelleğe alınan içerik açılabilir, ancak ilk kez istenen harici ayet verisi ve internet üzerinden gelen MP3 tilaveti bağlantı gerektirir. API, kimlik doğrulama ve sunucu bileşeni istekleri Service Worker tarafından içerik önbelleğine alınmaz.

## 11. Teknik mimari

- **Arayüz:** React 19, TypeScript ve Next.js uyumlu bileşen yapısı.
- **Sunucu/derleme:** Vinext, Vite ve Cloudflare Worker çalışma ortamı.
- **Stil:** Projeye ait CSS, responsive kurallar, Lucide ikonları ve yerel fontlar.
- **Ana bileşen:** `HifzWorkshop`, çalışma ekranındaki seçim, mod, görünürlük, ses ve ilerleme durumunu yönetir.
- **API rotaları:** `/api/lesson` doğrulanmış ders içeriğini sağlar; `/api/enrich` sunucuda anahtar varsa isteğe bağlı yapay zekâ kelime eşleştirmesi yapabilir.
- **Doğrulama:** Zod şemaları ve proje içi tür korumaları hem dış sağlayıcı hem cihaz önbelleği için kullanılır.
- **Barındırma:** Uygulama ChatGPT Sites üzerinde, sahibiyle sınırlı özel erişimle yayınlanır.

Projede ChatGPT kimlik başlıklarını okuyabilen yardımcı kod vardır; mevcut ana kullanıcı akışı kendi hesap/veritabanı oturum sistemini kurmaz. Erişim kontrolü yayın platformu düzeyinde uygulanır.

## 12. İsteğe bağlı Gemini rotası

Sunucuda `GEMINI_API_KEY` tanımlanırsa `/api/enrich` en fazla beş ayet için kelime okunuşu ve anlam eşleştirmesi isteyebilir. Anahtar tarayıcıya gönderilmez. Modelin Arapça metni veya kelime sırasını değiştirmesine izin verilmez; cevap mevcut kaynak kelimelerle birebir kontrol edilir. Geçersiz veya eksik sonuç reddedilir ve kaynak ders korunur.

Bu rota temel ezber deneyiminin çalışması için gerekli değildir. Mevcut sade arayüz teknik API durum mesajlarını kullanıcıya göstermez.

## 13. Hata önleme yaklaşımı

Proje aşağıdaki durumlara karşı koruma içerir:

- geçersiz sure ve ayet aralığı,
- 20 ayetten büyük tek istek,
- eksik veya sırası bozuk sağlayıcı yanıtı,
- geç kalan eski isteğin yeni seçimi ezmesi,
- bozuk cihaz önbelleği,
- bütün görünüm katmanlarının kapanması,
- aynı içeriği yeniden seçerken ilerlemenin sıfırlanması,
- eski ses geri çağırmalarının yeni ses oturumunu durdurması,
- Arapça konuşma sesi bulunmayan cihazlar,
- yanlış çevrimdışı sayfanın başka sure için açılması,
- boşluk doldurmada aynı görünen seçeneklerin tekrarlanması.

## 14. Test ve doğrulama durumu

Mevcut otomatik test paketi 47 test içerir. Kapsam; ezber aşamaları, zincirleme kareleri, boşluk doldurma seçenekleri, gölgeleme ses sırası, veri sağlayıcı yedekleri, istek zaman aşımı, önbellek doğrulama, çalışma durumunun geri yüklenmesi ve Arapça sunum kurallarını içerir.

Son doğrulamada:

- TypeScript kontrolü geçti.
- 47 otomatik testin tamamı geçti.
- Üretim derlemesi tamamlandı.
- Fâtiha görünümü 320, 390, 600, 768, 1024 ve 1440 piksel genişliklerde yatay taşma olmadan kontrol edildi.
- Standart, zincirleme, boşluk doldurma, kelime açma ve zor kelime işaretleme akışları tarayıcıda çalıştırıldı.

Sağlayıcı testlerinin bir bölümü fixture verisiyle yapılır; bu sonuçlar her harici servisin her an erişilebilir olduğunu garanti etmez. Fiziksel iOS/Android cihazlar, bütün tarayıcı kombinasyonları ve eksiksiz dinî redaksiyon bu test kapsamına dahil değildir.

## 15. Bilinen sınırlar ve önerilen kullanım

- Kelime düzeyinde güvenilir Türkçe okunuş bulunmayan ayetlerde uygulama yanlış tahmin üretmek yerine ifade grubunu birlikte gizler.
- Dua seslendirmesi cihazın Arapça konuşma sesine bağlıdır ve profesyonel kıraat kaydı sayılmaz.
- İlerleme yalnız mevcut tarayıcıda tutulur; tarayıcı verileri silinirse ilerleme de silinir.
- İlk defa açılan tam sureler ve çevrimiçi tilavet internet bağlantısı gerektirir.
- Metin ve meal kaynaklara dayansa da proje dinî metin uzmanının son redaksiyonundan geçmiş bir yayın olarak değerlendirilmemelidir.

En uygun kullanım biçimi, önce **Kodlama** aşamasında ayeti dinleyip okumak; ardından **Ayet Sonu**, **Anahtar Kelimeler** ve **Okunuş İpucu** aşamalarından geçmek; son olarak **Aktif Hatırlama** veya **Boşluk Doldur** ile kontrol yapmaktır. Uzun içeriklerde zincirleme moduyla ayetleri küçük gruplar halinde birleştirmek ve zorlanılan kelimeleri sonraki oturumlarda yeniden çalışmak uygulamanın tasarlanan öğrenme akışıdır.
