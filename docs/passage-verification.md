# Hazır ezber bölümleri — doğrulama kapsamı

13 hazır seçim, 43 benzersiz ayeti kapsar. Âyetel Kürsî, Âmenerrasûlü ve Hüvallahüllezi'nin mevcut anahtarları korunur. Yeni seçimler: Elif Lâm Mîm; İnne lil-müttakîne (Nebe 31–40); İnnel-müttakîne (Duhân 51–59); Lekad Câeküm; Lev Enzelnâ; Lâ Yestevî; Kulillâhümme; Lekad Sadakallâh; Efehasibtüm; Muhammedün Resûlullah.

- **Canlı test edildi:** `scripts/prepare-passages.mjs`, 43 ayetin Arapça kaynaklarını Quran.com ve AlQuran Cloud üzerinden karşılaştırdı. Karşılaştırmada Unicode gösterim, hareke ve durak işaretleri ayıklanır; saklanan Arapça metin değiştirilmez. Bu kontrol hareke doğruluğunun bağımsız uzman onayı değildir.
- **Canlı test edildi:** `scripts/audit-corpus.mjs`, 6.236 okunuş kaydının tamamını `tr.transliteration` (Muhammet Abay) ile birebir eşleştirdi. 6.235 meal `tr.vakfi` ile birebir eşleşti.
- **Belgelenmiş kaynak eksikliği:** AlQuran Cloud, Bakara 286 mealinin sonunu eksik döndürüyor. Mevcut tam meal korunur; son dualar Diyanet'in yayımladığı *EZBERLENECEK AŞR-I ŞERİFLER* belgesinden kontrol edildi. Kaynak ve SHA-256 kaydı `lib/hifz/passage-source-notes.json` içindedir. Veri yenileme betiği bu tam metni eksik API yanıtıyla değiştirmez.
- **Fixture testleri:** arama varyantları, sure/ayet sınırları, eski bağlantı anahtarları, bölümün tamamının açılması, gömülü metinlerin SHA-256 bütünlüğü ve korpus denetimi test edilir.
- **Tarayıcıda test edildi:** “innelil müttegın” → Nebe 31–40 (10 tam ayet); “amenarrasulu” → Bakara 285–286 (2 tam ayet). Seçim adresi sayfa yenilemede korunur.

`passage-provenance.json` ayet bazında kaynak URL'lerini, zaman damgasını ve metin özetlerini; `corpus-audit.json` tüm Türkçe korpus denetimini saklar. Yeni ayetlerin okunuş ve mealleri kaynak veriden alınır; üretilmez. Mevcut çeviriyazıda yalnızca uygulamanın önceden kullandığı tipografik dönüşüm uygulanır.

Kaynakla birebir eşleşme, kaynağın dilbilimsel veya dinî bakımdan mutlak hatasız olduğunu kanıtlamaz. Tüm Kur'an Arapçasının bağımsız uzman kontrolü, tüm cihazlarda fiziksel test ve tüm tilavet dosyalarının canlı oynatımı bu çalışmada yapılmadı. Tam veri yenileme/audit betikleri ağ bağlantısı gerektirir; normal testler ağa bağımlı değildir.

Fontları da indiren tam `fetch-hifz.mjs` yenilemesi bu turda çalıştırılmadı; bu betiğin sözdizimi kontrol edildi. Bölüm hazırlama ve korpus denetimi betikleri canlı çalıştırıldı.
