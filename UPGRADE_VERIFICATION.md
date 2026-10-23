# Kelime kartları ve beş metot yükseltmesi

## Uygulanan davranış

- `displayWords` her ayet/duayı bağımsız Arapça kelimelere dönüştürür. İfade gruplama geri dönüşü kaldırıldı. Hazır okunuş, eşit sayılı kaynak bölümü ve deterministik Arapça çözümleyici sıralaması uygulanır. Kelime anlamı yoksa tam ifade anlamı kopyalanmaz. Hesaplanan okunuş † ile belirtilir; tecvit uzmanı redaksiyonu sayılmaz.
- 3+3+2 Hafız koçu, ters ayet/kelime zinciri, ilk-son kelime köprüleri, dört ipucu kademesi ve üç seçenekli kelime dizme aynı kelime durumunu kullanır. Yanlış cevap doğru kelimeyi açar ve zor kelimelere ekler. Koç ilerlemesi geri yüklenir.
- Semâ-Arz beklemesi açıkça 4 saniyeye ayarlı; ilk harf/hece ve süre çubuğu gösterilir. Kullanıcı ses kaydı yapılmaz. Eski ses iptali ve sağlayıcı yedekleri korunur.
- Eski v1 ifade indisleri yeni kelimelere uygulanmaz. Kayıtlar silinmeden v2 çalışma/işaretleme alanına geçilir; görüntü ayarları ve son içerik korunur. Shell önbelleği v9.

## Gerçekleşen kontroller

- **fixture-tested:** 55 otomatik test: 156 gömülü ayet + 8 duanın kelime sayısı/okunuş/idempotansı; Fâtiha tek ifade sağlayıcı geri dönüşü; şedde, med, kısa/uzun ünlü, tenvin, elif-i vasla ve huruf; 3+3+2 ve bitiş; ters zincir/köprü/maske; koç geri yükleme; 4 saniyelik ses arası; önceki istek/önbellek/sağlayıcı regresyonları.
- **live-tested local production browser:** Fâtiha 4 bağımsız ilk ayet kartı; 3 yüzünden → 3 bakmadan → ikinci ayet → rabt 1+2, yenilemeyle rabt geri yükleme. Ters zincir 7 → 6+7. Köprüde ilk/son açık, orta gizli ve 6 geçiş köprüsü. Kelimeleri ters açmada yalnız son gizli kelime etkin. Yanlış quiz seçimi ilk kelimeyi açıp işaretledi; zor filtre yalnız o kelimeyi gizledi. Âyetel Kürsî 50, Sübhaneke 10 kart.
- **live-tested local production browser:** Âyetel Kürsî için 320, 390, 600, 768, 1024, 1440 genişliklerde belge taşması ve Arapça kelime kırpılması yok. En büyük yazıda 320, 390, 768 için aynı kontrol geçti. Bunlar fiziksel cihaz testleri değildir.
- **live-tested local production with real provider flow:** Yâsîn 1–5 başarıyla yüklendi; kart sayıları sırasıyla 1, 2, 3, 3, 3. Tek kelimelik `يسٓ` ayeti doğal olarak tek karttır. Âyetel Kürsî'de ters kelime açma yalnız 50. kelimeyi etkinleştirdi; ilerleme o kelimeyi açıp ilk kelimeyi gizli tuttu.
- TypeScript kontrolü, 55 test ve son üretim derlemesi başarılı.
- **skipped:** tüm 6236 ayetin canlı sağlayıcı üzerinden tek tek yüklenmesi, bütün MP3'lerin dinlenmesi, fiziksel iOS/Android ve çevrimdışı uçak modu testleri. Tam Türkçe korpus ve ortak kelime dönüştürme yolu testlidir; her hesaplanan okunuşun dinî redaksiyonu yapılmış değildir.

## Açıklama metinleri

Kullanıcı talebindeki doğrulanmamış 3x/4x hız veya doğrudan sinaps garantileri eklenmedi. Geri çağırma ve sesli üretim açıklamaları ölçülü tutuldu. İlgili birincil araştırmalar: https://pubmed.ncbi.nlm.nih.gov/16507066/ ve https://pubmed.ncbi.nlm.nih.gov/20438265/ .
