import type {Content} from './types';
export type PassageSearch={key:string;aliases:string[]};
// Tolerant lookup is confined to search labels, never sacred source text.
export const normalizeSearch=(s:string)=>s.toLocaleLowerCase('tr').normalize('NFD').replace(/[\u0300-\u036f\u064b-\u065f\u0670]/gu,'').replace(/ı/g,'i').replace(/[^a-z0-9\u0600-\u06ff]/gu,'');
export function searchContents(catalog:Content[],query:string,passages:PassageSearch[],chapters:{id:number;name:string;arabicName:string}[]):Content[]{
 const q=normalizeSearch(query);if(!q)return catalog;
 if(/^\d+$/u.test(query.trim()))return catalog.filter(c=>String(c.chapter)===query.trim());
 return catalog.filter(c=>{
  const chapter=c.kind==='surah'?chapters.find(s=>s.id===c.chapter):undefined;
  const labels=[c.name,...(passages.find(p=>p.key===c.key)?.aliases||[]),...(chapter?[chapter.name,chapter.arabicName,`${chapter.name} ${c.start} ${c.end}`,`${c.chapter}:${c.start}-${c.end}`]:[])];
  return labels.some(label=>normalizeSearch(label).includes(q))||String(c.chapter)===query.trim();
 });
}
