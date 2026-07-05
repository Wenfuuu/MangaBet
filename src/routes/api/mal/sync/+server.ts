import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isMalConnected, getValidAccessToken } from '$lib/server/mal/oauth';
import { resolveMalIdWithFallback, crossCheckOneshotMapping } from '$lib/server/mal/mapping';
import { getMangaStatus, updateMangaListStatus } from '$lib/server/mal/api';
import { isRateLimitError } from '$lib/services/errors';
import type { MalSyncResult } from '$lib/types';

export const POST: RequestHandler = async ({ request, cookies }) => {
	if (!isMalConnected(cookies)) error(401, 'MAL not connected');

	const body = (await request.json().catch(() => null)) as {
		slug?: string;
		/** display title — enables the Jikan title-search fallback when the slug is unmapped */
		title?: string;
		chapter?: number;
		malId?: number;
		/** true only for user-corrected mappings — they skip the suspect-oneshot guard */
		trusted?: boolean;
		planToRead?: boolean;
	} | null;
	const slug = body?.slug;
	const title = typeof body?.title === 'string' && body.title.trim() ? body.title.trim() : undefined;
	const planToRead = body?.planToRead === true;
	const trusted = body?.trusted === true && body?.malId !== undefined;
	// MAL only accepts whole chapters — floor the 10.5-style extras.
	const chapter = Math.floor(Number(body?.chapter));
	const providedMalId = body?.malId;
	if (!planToRead && (!Number.isFinite(chapter) || chapter < 1)) error(400, 'Invalid chapter');
	if (providedMalId !== undefined && (!Number.isInteger(providedMalId) || providedMalId < 1)) {
		error(400, 'Invalid malId');
	}
	if (providedMalId === undefined && (!slug || typeof slug !== 'string')) {
		error(400, 'Missing slug or malId');
	}

	try {
		// Client-provided IDs (override or cached) skip the mapping lookup entirely.
		let malId = providedMalId ?? (await resolveMalIdWithFallback(slug!, title)).malId;
		if (malId === null) {
			return json({ synced: false, reason: 'unmapped' } satisfies MalSyncResult);
		}

		const token = await getValidAccessToken(cookies);
		if (!token) error(401, 'MAL session expired');

		let manga = await getMangaStatus(malId, token);

		// Nothing read yet: put it on the list as Plan to Read, but never touch an
		// entry that is already on the list in any status.
		if (planToRead) {
			if (manga.my_list_status) {
				return json({
					synced: true,
					unchanged: true,
					progress: manga.my_list_status.num_chapters_read ?? 0,
					malId,
				} satisfies MalSyncResult);
			}
			await updateMangaListStatus(malId, { status: 'plan_to_read' }, token);
			return json({ synced: true, progress: 0, malId } satisfies MalSyncResult);
		}

		// Auto-mapped to a 1-chapter entry while reading chapter 2+? Almost certainly a
		// oneshot that shares its title with the serialization — try redirecting to the
		// serialization; if that fails, don't write, flag it.
		if (!trusted && manga.num_chapters === 1 && chapter >= 2) {
			const corrected = title ? await crossCheckOneshotMapping(malId, title, true) : null;
			if (!corrected) {
				return json({ synced: false, reason: 'suspect_oneshot', malId } satisfies MalSyncResult);
			}
			malId = corrected.malId;
			manga = await getMangaStatus(malId, token);
			// The redirect target should never be a oneshot itself, but never write
			// chapter counts to one if it somehow is.
			if (manga.num_chapters === 1 && chapter >= 2) {
				return json({ synced: false, reason: 'suspect_oneshot', malId } satisfies MalSyncResult);
			}
		}

		const currentProgress = manga.my_list_status?.num_chapters_read ?? 0;
		if (currentProgress >= chapter) {
			return json({ synced: true, unchanged: true, progress: currentProgress, malId } satisfies MalSyncResult);
		}

		const status = manga.num_chapters >= 1 && chapter >= manga.num_chapters ? 'completed' : 'reading';
		const updated = await updateMangaListStatus(malId, { num_chapters_read: chapter, status }, token);

		return json({
			synced: true,
			progress: updated.num_chapters_read ?? chapter,
			malId,
		} satisfies MalSyncResult);
	} catch (err) {
		if (isRateLimitError(err)) error(429, 'Rate limited — retry in a moment');
		throw err;
	}
};
