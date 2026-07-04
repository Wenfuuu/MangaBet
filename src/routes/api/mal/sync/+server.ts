import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isMalConnected, getValidAccessToken } from '$lib/server/mal/oauth';
import { resolveMalId } from '$lib/server/mal/mapping';
import { getMangaStatus, updateMangaProgress } from '$lib/server/mal/api';
import type { MalSyncResult } from '$lib/types';

export const POST: RequestHandler = async ({ request, cookies }) => {
	if (!isMalConnected(cookies)) error(401, 'MAL not connected');

	const body = (await request.json().catch(() => null)) as {
		slug?: string;
		chapter?: number;
		malId?: number;
	} | null;
	const slug = body?.slug;
	// MAL only accepts whole chapters — floor the 10.5-style extras.
	const chapter = Math.floor(Number(body?.chapter));
	const overrideMalId = body?.malId;
	if (!Number.isFinite(chapter) || chapter < 1) error(400, 'Invalid chapter');
	if (overrideMalId !== undefined && (!Number.isInteger(overrideMalId) || overrideMalId < 1)) {
		error(400, 'Invalid malId');
	}
	if (overrideMalId === undefined && (!slug || typeof slug !== 'string')) {
		error(400, 'Missing slug or malId');
	}

	// A user-corrected mapping (from the manga page) beats the crowd-sourced database.
	const malId = overrideMalId ?? (await resolveMalId(slug!));
	if (malId === null) {
		return json({ synced: false, reason: 'unmapped' } satisfies MalSyncResult);
	}

	const token = await getValidAccessToken(cookies);
	if (!token) error(401, 'MAL session expired');

	const manga = await getMangaStatus(malId, token);

	// Auto-mapped to a 1-chapter entry while reading chapter 2+? Almost certainly a
	// oneshot that shares its title with the serialization — don't write, flag it.
	if (overrideMalId === undefined && manga.num_chapters === 1 && chapter >= 2) {
		return json({ synced: false, reason: 'suspect_oneshot', malId } satisfies MalSyncResult);
	}

	const currentProgress = manga.my_list_status?.num_chapters_read ?? 0;
	if (currentProgress >= chapter) {
		return json({ synced: true, unchanged: true, progress: currentProgress, malId } satisfies MalSyncResult);
	}

	const status = manga.num_chapters >= 1 && chapter >= manga.num_chapters ? 'completed' : 'reading';
	const updated = await updateMangaProgress(malId, chapter, status, token);

	return json({
		synced: true,
		progress: updated.num_chapters_read ?? chapter,
		malId,
	} satisfies MalSyncResult);
};
