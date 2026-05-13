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

export function fmtViews(n: number): string {
	if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
	if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
	return String(n);
}