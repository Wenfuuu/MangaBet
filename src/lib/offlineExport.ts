import { PDFDocument, type PDFImage } from 'pdf-lib';
import { Zip, ZipPassThrough } from 'fflate';
import { OFFLINE_CACHE } from '$lib/offlineCache';
import type { SaveProgress, SavedChapter } from '$lib/types';

const IMAGE_PATH = '/api/image';
const JPEG_QUALITY = 0.92;
// Acrobat and most phone viewers reject pages larger than this, which tall webtoon strips exceed.
const MAX_PDF_PAGE_UNITS = 14400;
// The source cuts tall manga pages into strips of exactly this height; a strip that
// is full-height means the page continues in the next image of the same width.
const SOURCE_SLICE_HEIGHT = 1500;
const SEAM_OVERLAP_UNITS = 1;

type ProgressHandler = (progress: SaveProgress) => void;

const isJpeg = (bytes: Uint8Array) => bytes[0] === 0xff && bytes[1] === 0xd8;
const isPng = (bytes: Uint8Array) =>
	bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;

function sanitizeName(name: string): string {
	return name
		.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '')
		.trim()
		.replace(/[. ]+$/, '');
}

function folderName(entry: SavedChapter): string {
	return sanitizeName(entry.mangaName) || entry.mangaSlug;
}

export function chapterFileName(chapterNumber: number): string {
	const [whole, fraction] = String(chapterNumber).split('.');
	return `Ch ${whole.padStart(3, '0')}${fraction ? `.${fraction}` : ''}.pdf`;
}

function triggerDownload(blob: Blob, fileName: string): void {
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = fileName;
	document.body.append(link);
	link.click();
	link.remove();
	setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

async function transcodeToJpeg(blob: Blob): Promise<Uint8Array> {
	const bitmap = await createImageBitmap(blob);
	const canvas = document.createElement('canvas');
	canvas.width = bitmap.width;
	canvas.height = bitmap.height;

	const context = canvas.getContext('2d');
	if (!context) throw new Error('Canvas is unavailable in this browser');
	context.fillStyle = '#fff';
	context.fillRect(0, 0, canvas.width, canvas.height);
	context.drawImage(bitmap, 0, 0);
	bitmap.close();

	const jpeg = await new Promise<Blob | null>((resolve) =>
		canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY)
	);
	if (!jpeg) throw new Error('Could not convert a page image for the PDF');
	return new Uint8Array(await jpeg.arrayBuffer());
}

async function embedImage(pdf: PDFDocument, blob: Blob): Promise<PDFImage> {
	const bytes = new Uint8Array(await blob.arrayBuffer());
	return isPng(bytes)
		? pdf.embedPng(bytes)
		: pdf.embedJpg(isJpeg(bytes) ? bytes : await transcodeToJpeg(blob));
}

function addStackedPage(pdf: PDFDocument, slices: PDFImage[]): void {
	const width = slices[0].width;
	const height = slices.reduce((sum, slice) => sum + slice.height, 0);
	const scale = Math.min(1, MAX_PDF_PAGE_UNITS / Math.max(width, height));
	const page = pdf.addPage([width * scale, height * scale]);

	let top = height * scale;
	for (const [index, slice] of slices.entries()) {
		const sliceHeight = slice.height * scale;
		top -= sliceHeight;
		// Each slice overlaps the next by a hair, which is painted over, so antialiasing
		// at the seam cannot leave a visible line.
		const overlap = index < slices.length - 1 ? SEAM_OVERLAP_UNITS : 0;
		page.drawImage(slice, { x: 0, y: top - overlap, width: width * scale, height: sliceHeight + overlap });
	}
}

async function buildChapterPdf(entry: SavedChapter, onProgress?: ProgressHandler): Promise<Uint8Array> {
	const cache = await caches.open(OFFLINE_CACHE);
	const imageUrls = entry.urls.filter((url) => url.startsWith(IMAGE_PATH));
	const pdf = await PDFDocument.create();

	let slices: PDFImage[] = [];
	const flush = () => {
		if (slices.length) addStackedPage(pdf, slices);
		slices = [];
	};

	for (const [index, url] of imageUrls.entries()) {
		const res = await cache.match(url);
		if (!res) {
			throw new Error(`Page ${index + 1} of Ch. ${entry.chapterNumber} is missing from the offline cache`);
		}
		const image = await embedImage(pdf, await res.blob());

		const previous = slices.at(-1);
		const continuesPrevious =
			previous && previous.height === SOURCE_SLICE_HEIGHT && previous.width === image.width;
		if (!continuesPrevious) flush();
		slices.push(image);

		onProgress?.({ done: index + 1, total: imageUrls.length });
	}
	flush();

	return pdf.save();
}

export async function exportChapterPdf(entry: SavedChapter, onProgress?: ProgressHandler): Promise<void> {
	const bytes = await buildChapterPdf(entry, onProgress);
	triggerDownload(
		new Blob([bytes as BlobPart], { type: 'application/pdf' }),
		`${folderName(entry)} - ${chapterFileName(entry.chapterNumber)}`
	);
}

export async function exportMangaZip(entries: SavedChapter[], onProgress?: ProgressHandler): Promise<void> {
	if (!entries.length) return;

	const sorted = [...entries].sort((a, b) => a.chapterNumber - b.chapterNumber);
	const folder = folderName(sorted[0]);
	const chunks: Uint8Array[] = [];
	let zipError: Error | null = null;

	const zip = new Zip((err, chunk) => {
		if (err) zipError = err;
		else chunks.push(chunk);
	});

	onProgress?.({ done: 0, total: sorted.length });
	for (const [index, entry] of sorted.entries()) {
		const pdf = await buildChapterPdf(entry);
		// PDFs of already-compressed images gain nothing from deflate.
		const file = new ZipPassThrough(`${folder}/${chapterFileName(entry.chapterNumber)}`);
		zip.add(file);
		file.push(pdf, true);
		onProgress?.({ done: index + 1, total: sorted.length });
	}
	zip.end();

	if (zipError) throw zipError;
	triggerDownload(new Blob(chunks as BlobPart[], { type: 'application/zip' }), `${folder}.zip`);
}
