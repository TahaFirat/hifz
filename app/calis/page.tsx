import HifzWorkshop from '@/components/HifzWorkshop';
export default async function PracticePage({ searchParams }: {
    searchParams: Promise<{
        kategori?: string;
        icerik?: string;
    }>;
}) {
    const params = await searchParams;
    const category = params.kategori === 'prayers' || params.kategori === 'all' ? params.kategori : 'basics';
    return <HifzWorkshop initialCategory={category} initialKey={typeof params.icerik === 'string' ? params.icerik : undefined}/>;
}
