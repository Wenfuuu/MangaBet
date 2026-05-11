import type { Manga, Chapter } from '$lib/types';

export const COVER_PALETTES: [string, string, string][] = [
	['#3a2419', '#1a0f08', '#5c3a24'],
	['#2a1d12', '#0f0805', '#4a2f1c'],
	['#4a2818', '#1c0e07', '#6b3d24'],
	['#1f1610', '#0a0604', '#3d2818'],
	['#3d251a', '#180d07', '#5a3722'],
	['#2d1e14', '#120a05', '#4d3220'],
	['#452a1c', '#1a0e07', '#604028'],
	['#241810', '#0c0604', '#3a2718'],
];

export const MANGA_LIBRARY: Manga[] = [
	{
		id: 'lantern-bearer',
		title: 'The Lantern Bearer',
		author: 'Kenji Aramaki',
		year: 2021,
		status: 'Ongoing',
		genres: ['Fantasy', 'Adventure', 'Drama'],
		rating: 4.8,
		chapters: 128,
		summary:
			"A wandering lamplighter inherits a flame that remembers every path he's walked. As the cities he visits begin to forget their own names, he must trace the route back to the night his light was first lit.",
		cover: 0,
		mood: 'fantasy',
	},
	{
		id: 'house-of-paper-cranes',
		title: 'House of Paper Cranes',
		author: 'Mira Sato',
		year: 2019,
		status: 'Completed',
		genres: ['Slice of Life', 'Romance'],
		rating: 4.6,
		chapters: 64,
		summary:
			"Two estranged siblings reopen their late grandmother's origami shop and discover she folded a crane for every secret she ever kept.",
		cover: 1,
		mood: 'slice',
	},
	{
		id: 'salt-and-cinder',
		title: 'Salt and Cinder',
		author: 'Hideo Tanaka',
		year: 2022,
		status: 'Ongoing',
		genres: ['Historical', 'Action'],
		rating: 4.9,
		chapters: 87,
		summary:
			"A blacksmith's daughter forges weapons from meteoric iron for a queen who has forgotten how to mourn.",
		cover: 2,
		mood: 'action',
	},
	{
		id: 'kettle-on-the-hill',
		title: 'The Kettle on the Hill',
		author: 'Yuna Park',
		year: 2020,
		status: 'Ongoing',
		genres: ['Slice of Life', 'Comedy'],
		rating: 4.4,
		chapters: 42,
		summary: "A teahouse perched on a misty hilltop serves only travelers who don't know where they're going.",
		cover: 3,
		mood: 'cozy',
	},
	{
		id: 'wolves-of-the-archive',
		title: 'Wolves of the Archive',
		author: 'Caro Vance',
		year: 2023,
		status: 'Ongoing',
		genres: ['Mystery', 'Supernatural'],
		rating: 4.7,
		chapters: 31,
		summary: "In a library where every book breathes, the new junior archivist learns which shelves bite back.",
		cover: 4,
		mood: 'mystery',
	},
	{
		id: 'glassblower-of-meridia',
		title: 'The Glassblower of Meridia',
		author: 'Lior Hakim',
		year: 2018,
		status: 'Completed',
		genres: ['Fantasy', 'Romance'],
		rating: 4.5,
		chapters: 96,
		summary:
			"In a desert city carved from a single dune, an apprentice glassblower captures wishes in goblets that sing the wisher's name.",
		cover: 5,
		mood: 'fantasy',
	},
	{
		id: 'iron-quartet',
		title: 'Iron Quartet',
		author: 'Ren Kobayashi',
		year: 2021,
		status: 'Ongoing',
		genres: ['Action', 'Sci-fi'],
		rating: 4.8,
		chapters: 73,
		summary: "Four siblings inherit four mechanical hearts. Only three of them know.",
		cover: 6,
		mood: 'action',
	},
	{
		id: 'last-tide',
		title: 'The Last Tide',
		author: 'Aria Whitlock',
		year: 2024,
		status: 'Ongoing',
		genres: ['Drama', 'Adventure'],
		rating: 4.6,
		chapters: 18,
		summary: "A retired lighthouse keeper takes one more shift and finds the sea has been waiting for the chance.",
		cover: 7,
		mood: 'drama',
	},
	{
		id: 'orchard-of-bells',
		title: 'Orchard of Bells',
		author: 'Seo-yun Cho',
		year: 2017,
		status: 'Completed',
		genres: ['Slice of Life', 'Drama'],
		rating: 4.7,
		chapters: 110,
		summary: "Every tree in the orchard rings on the day someone leaves home for good.",
		cover: 0,
		mood: 'slice',
	},
	{
		id: 'cartographers-debt',
		title: "The Cartographer's Debt",
		author: 'Felix Moreau',
		year: 2022,
		status: 'Ongoing',
		genres: ['Mystery', 'Historical'],
		rating: 4.5,
		chapters: 56,
		summary: "Every map he draws comes true. Every map he burns un-happens.",
		cover: 1,
		mood: 'mystery',
	},
	{
		id: 'thirteen-letters',
		title: 'Thirteen Letters Home',
		author: 'Inez Calder',
		year: 2020,
		status: 'Completed',
		genres: ['Romance', 'Drama'],
		rating: 4.4,
		chapters: 13,
		summary: "Thirteen letters, one for each year she was gone. None of them are addressed.",
		cover: 2,
		mood: 'romance',
	},
	{
		id: 'storm-on-the-pier',
		title: 'Storm on the Pier',
		author: 'Tomas Reyes',
		year: 2023,
		status: 'Ongoing',
		genres: ['Action', 'Drama'],
		rating: 4.6,
		chapters: 44,
		summary: "A retired boxer comes back to a coastal town that has too many storms and not enough doors.",
		cover: 3,
		mood: 'action',
	},
];

const CHAPTER_TITLES = [
	'The Lamp at the Edge of the Road',
	'A Quiet Snow',
	'Rust on the Hinges',
	'Names in the Rain',
	'Tea for One',
	'The Last Lit Window',
	'Inkwell',
	'A House Without Mirrors',
	'The Bridge that Forgot',
	'Coal and Honey',
	'Letters from the Hill',
	'The Knife Made of Glass',
	'Crows on the Wire',
	'A Sunday Without Bells',
	'Salt in the Lantern',
	'The Map Folds Inward',
	'Stove-Light',
	'A Wolf at the Window',
	'Cinder Stitch',
	'The Long Walk Home',
	'Stones for the River',
	'Brass and Soft Wood',
	'A Cup of Memory',
	'The Kettle Speaks',
	'Threadbare',
	'A Door That Opens Both Ways',
];

export function generateChapters(count: number): Chapter[] {
	const out: Chapter[] = [];
	const today = new Date();
	for (let i = count; i >= 1; i--) {
		const t = CHAPTER_TITLES[(i - 1) % CHAPTER_TITLES.length];
		const daysAgo = (count - i) * 6 + Math.floor(((i * 7) % 5));
		const d = new Date(today);
		d.setDate(d.getDate() - daysAgo);
		out.push({
			number: i,
			title: t,
			pages: 18 + ((i * 3) % 14),
			date: d,
			isNew: daysAgo < 14,
		});
	}
	return out;
}

export function fmtDate(d: Date): string {
	const today = new Date();
	const days = Math.floor((today.getTime() - d.getTime()) / 86400000);
	if (days === 0) return 'Today';
	if (days === 1) return 'Yesterday';
	if (days < 7) return `${days}d ago`;
	if (days < 30) return `${Math.floor(days / 7)}w ago`;
	if (days < 365) return `${Math.floor(days / 30)}mo ago`;
	return `${Math.floor(days / 365)}y ago`;
}
