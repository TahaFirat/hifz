import HifzWorkshop from '@/components/HifzWorkshop';
export default async function PracticePage({ searchParams }: {
    searchParams: Promise<{
        kategori?: string;
        icerik?: string;
        baslangic?: string;
        bitis?: string;
        sina?: string;
    }>;
}) {
    const params = await searchParams;
    const category = params.kategori === 'prayers' || params.kategori === 'all' ? params.kategori : 'basics';
    return <HifzWorkshop initialChallenge={params.sina==='1'} initialCategory={category} initialKey={typeof params.icerik === 'string' ? params.icerik : undefined} initialStart={typeof params.baslangic === 'string' ? params.baslangic : undefined} initialEnd={typeof params.bitis === 'string' ? params.bitis : undefined}/>;
}
