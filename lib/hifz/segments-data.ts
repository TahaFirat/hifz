export type SegmentPlan = {end: number; anchor: string; reading: string; meaning: string};
// Word offsets count Arabic words only, never standalone Quranic annotation signs.
// These are study phrases; original Arabic and its signs are retained verbatim.
export const quranSegments: Record<string, SegmentPlan[]> = {
 '1:7': [
  {end:4,anchor:'Lütuf Yolu',reading:'Sırâtallezîne en‘amte aleyhim.',meaning:'Kendilerine lütuf ve ikramda bulunduğun kimselerin yolunu;'},
  {end:9,anchor:'Sapmadan İlerle',reading:'Ğayril mağdûbi aleyhim veleddâllîn.',meaning:'Gazaba uğramışların ve sapmışların yolunu değil!'},
 ],
 '2:255': [
  {end:7,anchor:'Tevhid',reading:'Allâhü lâ ilâhe illâ hüvel hayyül kayyûm.',meaning:'Allah, O’ndan başka tanrı yoktur; O, hayydir, kayyumdur.'},
  {end:12,anchor:'Uyku Tutmaz',reading:'Lâ te’huzühû sinetün velâ nevm.',meaning:'Kendisine ne uyku gelir ne de uyuklama.'},
  {end:19,anchor:'Mülk O’nun',reading:'Lehû mâ fissemâvâti vemâ fil’ard.',meaning:'Göklerde ve yerdekilerin hepsi O’nundur.'},
  {end:26,anchor:'Şefaat İzni',reading:'Men zellezî yeşfeu indehû illâ biiznih.',meaning:'İzni olmadan O’nun katında kim şefaat edebilir?'},
  {end:32,anchor:'Mutlak İlim',reading:'Ya‘lemü mâ beyne eydîhim vemâ halfehüm.',meaning:'O, kullarının yaptıklarını ve yapacaklarını bilir. O’na hiçbir şey gizli kalmaz.'},
  {end:40,anchor:'İlimden Nasip',reading:'Velâ yuhîtûne bişey’in min ilmihî illâ bimâ şâe.',meaning:'O’nun bildirdiklerinin dışında insanlar O’nun ilminden hiçbir şeyi tam olarak bilemezler.'},
  {end:44,anchor:'Kürsü’nün Genişliği',reading:'Vesia kürsiyyühüssemâvâti vel’ard.',meaning:'O’nun kürsüsü gökleri ve yeri içine alır.'},
  {end:47,anchor:'Korumak Yormaz',reading:'Velâ yeûdühû hıfzuhümâ.',meaning:'Onları koruyup gözetmek kendisine zor gelmez.'},
  {end:50,anchor:'Yüce ve Azîm',reading:'Vehüvel aliyyül azîm.',meaning:'O, yücedir, büyüktür.'},
 ],
 '2:285': [
  {end:8,anchor:'İman',reading:'Âmenerrasûlü bimâ ünzile ileyhi mir rabbihî velmü’minûn.',meaning:'Peygamber, Rabbi tarafından kendisine indirilene iman etti, müminler de iman ettiler.'},
  {end:14,anchor:'İmanın Esasları',reading:'Küllün âmene billâhi vemelâiketihî vekütübihî verusülih.',meaning:'Her biri Allah’a, meleklerine, kitaplarına, peygamberlerine iman ettiler.'},
  {end:20,anchor:'Elçileri Ayırmayız',reading:'Lâ nüferriku beyne ehadim mir rusülih.',meaning:'Allah’ın peygamberlerinden hiçbiri arasında ayırım yapmayız.'},
  {end:23,anchor:'İşittik ve Uyduk',reading:'Vekâlû semi‘nâ veeta‘nâ.',meaning:'İşittik, itaat ettik, dediler.'},
  {end:27,anchor:'Af ve Dönüş',reading:'Ğufrâneke rabbenâ veileykelmesîr.',meaning:'Ey Rabbimiz, affına sığındık! Dönüş sanadır.'},
 ],
 '2:286': [
  {end:6,anchor:'Gücümüz Kadar',reading:'Lâ yükellifüllâhü nefsen illâ vus‘ahâ.',meaning:'Allah her şahsı, ancak gücünün yettiği ölçüde mükellef kılar.'},
  {end:12,anchor:'Amelin Karşılığı',reading:'Lehâ mâ kesebet vealeyhâ mektesebet.',meaning:'Herkesin kazandığı hayır kendine, yapacağı şer de kendinedir.'},
  {end:19,anchor:'Hatalarımızı Bağışla',reading:'Rabbenâ lâ tüâhiznâ in nesînâ ev ahta’nâ.',meaning:'Rabbimiz! Unutursak veya hataya düşersek bizi sorumlu tutma.'},
  {end:30,anchor:'Ağır Yükler',reading:'Rabbenâ velâ tahmil aleynâ isran kemâ hameltehû alellezîne min kablinâ.',meaning:'Ey Rabbimiz! Bizden öncekilere yüklediğin gibi bize de ağır bir yük yükleme.'},
  {end:38,anchor:'Takatimiz Yetmez',reading:'Rabbenâ velâ tühammilnâ mâ lâ tâkate lenâ bih.',meaning:'Ey Rabbimiz! Bize gücümüzün yetmediği işler de yükleme!'},
  {end:43,anchor:'Af ve Rahmet',reading:'Va‘fü annâ, vagfir lenâ, verhamnâ.',meaning:'Bizi affet! Bizi bağışla. Bize acı!'},
  {end:49,anchor:'Mevlâmız ve Yardım',reading:'Ente mevlânâ fensurnâ alelkavmilkâfirîn.',meaning:'Sen bizim Mevlâmızsın. Kâfirler topluluğuna karşı bize yardım et.'},
 ],
 '59:22': [
  {end:7,anchor:'Tek İlâh',reading:'Hüvellâhüllezî lâ ilâhe illâ hû.',meaning:'O, öyle Allah’tır ki, O’ndan başka tanrı yoktur.'},
  {end:13,anchor:'İlim ve Rahmet',reading:'Âlimül gaybi veşşehâdeh. Hüverrahmânürrahîm.',meaning:'Görülmeyeni ve görüleni bilendir. O, esirgeyendir, bağışlayandır.'},
 ],
 '59:23': [
  {end:7,anchor:'Tek İlâh',reading:'Hüvellâhüllezî lâ ilâhe illâ hû.',meaning:'O, öyle Allah’tır ki, kendisinden başka hiçbir tanrı yoktur.'},
  {end:11,anchor:'Esenlik ve Güven',reading:'Elmelikül kuddûsüs selâmül mü’min.',meaning:'O, mülkün sahibidir, eksiklikten münezzehtir, selamet verendir, emniyete kavuşturandır.'},
  {end:15,anchor:'Kudret ve Azamet',reading:'Elmüheyminül azîzül cebbârul mütekebbir.',meaning:'Gözetip koruyandır, üstündür, istediğini zorla yaptıran, büyüklükte eşi olmayandır.'},
  {end:19,anchor:'Ortaklardan Münezzeh',reading:'Sübhânellâhi ammâ yüşrikûn.',meaning:'Allah, müşriklerin ortak koştukları şeylerden münezzehtir.'},
 ],
 '59:24': [
  {end:5,anchor:'Yaratan ve Şekillendiren',reading:'Hüvellâhül hâlikul bâriül müsavvir.',meaning:'O, yaratan, var eden, şekil veren Allah’tır.'},
  {end:8,anchor:'En Güzel İsimler',reading:'Lehül esmâül husnâ.',meaning:'En güzel isimler O’nundur.'},
  {end:14,anchor:'Her Şeyin Tesbihi',reading:'Yüsebbihu lehû mâ fissemâvâti vel’ard.',meaning:'Göklerde ve yerde olanlar O’nun şanını yüceltmektedirler.'},
  {end:17,anchor:'İzzet ve Hikmet',reading:'Vehüvel azîzül hakîm.',meaning:'O, galiptir, hikmet sahibidir.'},
 ],
};
// End offsets refer to the existing, aligned prayer phrase rows, not individual words.
export const prayerSegments: Record<string, {end:number;anchor:string}[]> = {
 subhaneke:[{end:3,anchor:'Tesbih ve Hamd'},{end:5,anchor:'Yücelik ve Tevhid'}],
 tahiyyat:[{end:2,anchor:'Saygı ve Dua'},{end:4,anchor:'Peygambere Selâm'},{end:6,anchor:'Kullara Selâm'},{end:7,anchor:'Tevhid Şahitliği'},{end:8,anchor:'Resûle Şahitlik'}],
 salli:[{end:2,anchor:'Muhammed’e Salât'},{end:4,anchor:'İbrahim’e Salât'},{end:5,anchor:'Hamd ve Şan'}],
 barik:[{end:2,anchor:'Muhammed’e Bereket'},{end:4,anchor:'İbrahim’e Bereket'},{end:5,anchor:'Hamd ve Şan'}],
 rabbena:[{end:2,anchor:'Dünyada İyilik'},{end:4,anchor:'Âhiret ve Korunma'}],
 rabbenagfirli:[{end:3,anchor:'Herkese Bağışlanma'},{end:4,anchor:'Hesap Günü'}],
 kunut1:[{end:3,anchor:'Yardım ve Hidayet'},{end:6,anchor:'İman ve Tevekkül'},{end:7,anchor:'Hayırla Övgü'},{end:8,anchor:'Şükür'},{end:9,anchor:'Kötülükten Uzaklaşma'}],
 kunut2:[{end:1,anchor:'Yalnız Sana Kulluk'},{end:2,anchor:'Namaz ve Secde'},{end:3,anchor:'Sana Yöneliş'},{end:5,anchor:'Ümit ve Korku'},{end:6,anchor:'Azabın Gerçeği'}],
};
