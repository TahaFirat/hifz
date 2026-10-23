import type { Lesson } from './types';
function prayer(rows: string[]): Lesson {
    const words = rows.map(row => { const [arabic, reading, meaning] = row.split('|'); return { arabic, reading, meaning }; });
    return { source: 'Geleneksel namaz duaları. Anlam bütünlüğüne göre kelime grupları.', verses: [{ number: 1, words, arabic: words.map(w => w.arabic).join(' '), reading: words.map(w => w.reading).join(' '), meaning: words.map(w => w.meaning).join(' ') }] };
}
export const prayers: Record<string, Lesson> = {
    subhaneke: prayer([
        'سُبْحَانَكَ اللَّهُمَّ|Sübhânekellâhümme|Allah’ım, seni her türlü eksiklikten tenzih ederim.',
        'وَبِحَمْدِكَ|Ve bi hamdik.|Seni överim.',
        'وَتَبَارَكَ اسْمُكَ|Ve tebârekesmük.|Senin adın mübarektir.',
        'وَتَعَالَى جَدُّكَ|Ve teâlâ ceddük.|Senin şanın yücedir.',
        'وَلَا إِلَهَ غَيْرُكَ|Ve lâ ilâhe ğayrük.|Senden başka ilâh yoktur.',
    ]),
    tahiyyat: prayer([
        'التَّحِيَّاتُ لِلَّهِ|Ettehiyyâtü lillâhi|Bütün saygılar Allah içindir.',
        'وَالصَّلَوَاتُ وَالطَّيِّبَاتُ|Vessalevâtü vettayyibât.|Dualar ve güzel sözler de O’nadır.',
        'السَّلَامُ عَلَيْكَ أَيُّهَا النَّبِيُّ|Esselâmü aleyke eyyühennebiyyü|Ey Peygamber, selâm sana olsun.',
        'وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ|Ve rahmetullâhi ve berekâtüh.|Allah’ın rahmeti ve bereketi de üzerine olsun.',
        'السَّلَامُ عَلَيْنَا|Esselâmü aleynâ|Selâm bizim üzerimize olsun.',
        'وَعَلَى عِبَادِ اللَّهِ الصَّالِحِينَ|Ve alâ ibâdillâhissâlihîn.|Allah’ın iyi kullarına da olsun.',
        'أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ|Eşhedü en lâ ilâhe illallâh|Şahitlik ederim ki Allah’tan başka ilâh yoktur.',
        'وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ|Ve eşhedü enne Muhammeden abdühû ve resûlüh.|Yine şahitlik ederim ki Muhammed O’nun kulu ve elçisidir.',
    ]),
    salli: prayer([
        'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ|Allâhümme salli alâ Muhammedin|Allah’ım, Muhammed’e rahmet eyle.',
        'وَعَلَى آلِ مُحَمَّدٍ|Ve alâ âli Muhammed.|Muhammed’in ailesine de.',
        'كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ|Kemâ salleyte alâ İbrâhîme|İbrahim’e rahmet ettiğin gibi.',
        'وَعَلَى آلِ إِبْرَاهِيمَ|Ve alâ âli İbrâhîm.|İbrahim’in ailesine de.',
        'إِنَّكَ حَمِيدٌ مَجِيدٌ|İnneke hamîdün mecîd.|Şüphesiz sen övülmeye lâyık ve şanı yüce olansın.',
    ]),
    barik: prayer([
        'اللَّهُمَّ بَارِكْ عَلَى مُحَمَّدٍ|Allâhümme bârik alâ Muhammedin|Allah’ım, Muhammed’e bereket ihsan eyle.',
        'وَعَلَى آلِ مُحَمَّدٍ|Ve alâ âli Muhammed.|Muhammed’in ailesine de.',
        'كَمَا بَارَكْتَ عَلَى إِبْرَاهِيمَ|Kemâ bârekte alâ İbrâhîme|İbrahim’e bereket ihsan ettiğin gibi.',
        'وَعَلَى آلِ إِبْرَاهِيمَ|Ve alâ âli İbrâhîm.|İbrahim’in ailesine de.',
        'إِنَّكَ حَمِيدٌ مَجِيدٌ|İnneke hamîdün mecîd.|Şüphesiz sen övülmeye lâyık ve şanı yüce olansın.',
    ]),
    rabbena: prayer([
        'رَبَّنَا آتِنَا|Rabbenâ âtinâ|Rabbimiz, bize ver:',
        'فِي الدُّنْيَا حَسَنَةً|Fiddünyâ haseneten|Dünyada iyilik.',
        'وَفِي الْآخِرَةِ حَسَنَةً|Ve fil âhireti haseneten|Âhirette de iyilik.',
        'وَقِنَا عَذَابَ النَّارِ|Ve kınâ azâbennâr.|Bizi cehennem azabından koru.',
    ]),
    rabbenagfirli: prayer([
        'رَبَّنَا اغْفِرْ لِي|Rabbenağfirlî|Rabbimiz, beni bağışla.',
        'وَلِوَالِدَيَّ|Ve li vâlideyye|Annemi ve babamı da.',
        'وَلِلْمُؤْمِنِينَ|Ve lil mü’minîne|Müminleri de.',
        'يَوْمَ يَقُومُ الْحِسَابُ|Yevme yekûmül hisâb.|Hesabın görüleceği gün.',
    ]),
    kunut1: prayer([
        'اللَّهُمَّ إِنَّا نَسْتَعِينُكَ|Allâhümme innâ nesteînüke|Allah’ım, senden yardım isteriz.',
        'وَنَسْتَغْفِرُكَ|Ve nestağfirüke|Senden bağışlanma dileriz.',
        'وَنَسْتَهْدِيكَ|Ve nestehdîke|Senden doğru yolu göstermeni isteriz.',
        'وَنُؤْمِنُ بِكَ|Ve nü’minü bike|Sana inanırız.',
        'وَنَتُوبُ إِلَيْكَ|Ve netûbü ileyke|Sana tövbe ederiz.',
        'وَنَتَوَكَّلُ عَلَيْكَ|Ve netevekkelü aleyke|Sana güveniriz.',
        'وَنُثْنِي عَلَيْكَ الْخَيْرَ كُلَّهُ|Ve nüsnî aleykel hayra külleh.|Seni bütün hayırlarla överiz.',
        'نَشْكُرُكَ وَلَا نَكْفُرُكَ|Neşkürüke ve lâ nekfürük.|Sana şükreder, nankörlük etmeyiz.',
        'وَنَخْلَعُ وَنَتْرُكُ مَنْ يَفْجُرُكَ|Ve nahleu ve netrükü men yefcürük.|Sana karşı gelenlerden uzaklaşır, onları terk ederiz.',
    ]),
    kunut2: prayer([
        'اللَّهُمَّ إِيَّاكَ نَعْبُدُ|Allâhümme iyyâke na’büdü|Allah’ım, yalnız sana kulluk ederiz.',
        'وَلَكَ نُصَلِّي وَنَسْجُدُ|Ve leke nüsallî ve nescüd.|Yalnız senin için namaz kılar, secde ederiz.',
        'وَإِلَيْكَ نَسْعَى وَنَحْفِدُ|Ve ileyke nes’â ve nahfid.|Sana yönelir, kulluğun için çabalarız.',
        'نَرْجُو رَحْمَتَكَ|Nercû rahmeteke|Rahmetini umarız.',
        'وَنَخْشَى عَذَابَكَ|Ve nahşâ azâbek.|Azabından korkarız.',
        'إِنَّ عَذَابَكَ بِالْكُفَّارِ مُلْحِقٌ|İnne azâbeke bilküffâri mülhık.|Şüphesiz senin azabın inkârcılara ulaşacaktır.',
    ]),
};
