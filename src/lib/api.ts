export const API_BASE = 'https://api.mangabet.example.com/v1';

export const ENDPOINTS = {
	search: (q: string) => `${API_BASE}/manga?q=${encodeURIComponent(q)}`,
	mangaDetail: (id: string) => `${API_BASE}/manga/${id}`,
	chapters: (id: string) => `${API_BASE}/manga/${id}/chapters`,
	pages: (id: string, chapter: number) => `${API_BASE}/manga/${id}/chapter/${chapter}/pages`,
} as const;
