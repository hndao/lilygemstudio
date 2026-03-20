import type en from '@/dictionaries/en.json';

export type Dictionary = typeof en;

const dictionaries: Record<string, () => Promise<Dictionary>> = {
  en: () => import('@/dictionaries/en.json').then((mod) => mod.default),
  vi: () => import('@/dictionaries/vi.json').then((mod) => mod.default),
};

export async function getDictionary(locale: string): Promise<Dictionary> {
  const loader = dictionaries[locale] ?? dictionaries['vi'];
  return loader();
}
