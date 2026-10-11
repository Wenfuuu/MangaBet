import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getMangaDetail } from '$lib/services/manga';
import { getChapterCount } from '$lib/services/chapter';
import { isRateLimitError, isUpstreamError } from '$lib/services/errors';
import { buildUpstreamCookieHeader } from '$lib/server/mangabatsCookies';
import type { MangaPreviewDTO } from '$lib/types';

export const GET: RequestHandler = async ({ params, cookies }) => {
	const cookieHeader = buildUpstreamCookieHeader(cookies);
	try {
		const [detail, chapterCount] = await Promise.all([
			getMangaDetail(params.slug, cookieHeader),
			getChapterCount(params.slug, cookieHeader),
		]);
		return json(
			{
				rating: detail.rating,
				chapterCount,
				views: detail.views,
				lastUpdated: detail.lastUpdated.toISOString(),
				status: detail.status,
			} satisfies MangaPreviewDTO,
			{ headers: { 'Cache-Control': 'private, max-age=300' } },
		);
	} catch (err) {
		if (isRateLimitError(err)) error(429, 'Upstream rate limited - retry shortly');
		if (isUpstreamError(err)) error(503, 'Upstream temporarily unavailable - retry shortly');
		throw err;
	}
};
