// Bu dosya avatar tanımlarını ve ID -> URL dönüşümünü yönetir.

export interface AvatarPersona {
  id: string;
  name: string;
  description: string;
  seed: string;
  bgStart: string;
  bgEnd: string;
}

export const AVATAR_PERSONAS: AvatarPersona[] = [
  { id: '1', name: 'Klasik', description: 'Sade ve zamansız.', seed: 'Felix', bgStart: '#6366f1', bgEnd: '#a855f7' }, // Indigo-Purple
  { id: '2', name: 'Eleştirmen', description: 'Detaycı ve keskin.', seed: 'Aneka', bgStart: '#ef4444', bgEnd: '#f97316' }, // Red-Orange
  { id: '3', name: 'Bingewatcher', description: 'Bir oturuşta sezon bitiren.', seed: 'Milo', bgStart: '#3b82f6', bgEnd: '#06b6d4' }, // Blue-Cyan
  { id: '4', name: 'Yönetmen', description: 'Vizyoner bakış açısı.', seed: 'Bella', bgStart: '#10b981', bgEnd: '#34d399' }, // Emerald
  { id: '5', name: 'Hipster', description: 'Ana akım olmayanları seven.', seed: 'Leo', bgStart: '#f59e0b', bgEnd: '#fbbf24' }, // Amber
  { id: '6', name: 'Fütürist', description: 'Bilim kurgu tutkunu.', seed: 'Zoe', bgStart: '#8b5cf6', bgEnd: '#d946ef' }, // Violet-Fuchsia
  { id: '7', name: 'Otaku', description: 'Anime ve animasyon aşığı.', seed: 'Max', bgStart: '#ec4899', bgEnd: '#f43f5e' }, // Pink-Rose
  { id: '8', name: 'Dedektif', description: 'Gizem ve suç uzmanı.', seed: 'Lola', bgStart: '#64748b', bgEnd: '#94a3b8' }, // Slate
  { id: '9', name: 'Bağımsız', description: 'Festival filmleri takipçisi.', seed: 'Sam', bgStart: '#14b8a6', bgEnd: '#2dd4bf' }, // Teal
  { id: '10', name: 'Sinefil', description: 'Sinema tarihine hakim.', seed: 'Ray', bgStart: '#f43f5e', bgEnd: '#e11d48' }, // Rose
];

// Veritabanındaki ID'yi (örn: '1') alıp tam URL'e çevirir.
export const getAvatarUrl = (id?: string | null): string => {
  if (!id) return `https://api.dicebear.com/9.x/notionists/svg?seed=${AVATAR_PERSONAS[0].seed}`;
  
  // Eğer eski sistemden kalan bir HTTP linki varsa onu döndür (Backward Compatibility)
  if (id.startsWith('http')) return id;

  const persona = AVATAR_PERSONAS.find(p => p.id === id);
  const seed = persona ? persona.seed : AVATAR_PERSONAS[0].seed; // Bulamazsa varsayılan
  
  return `https://api.dicebear.com/9.x/notionists/svg?seed=${seed}`;
};

// ID'ye göre Persona objesini döndürür
export const getAvatarPersona = (id?: string | null): AvatarPersona => {
    return AVATAR_PERSONAS.find(p => p.id === id) || AVATAR_PERSONAS[0];
};