const NAMED: Record<string, string> = {
	amp: '&',
	lt: '<',
	gt: '>',
	quot: '"',
	apos: "'",
	nbsp: ' ',
	ndash: '–',
	mdash: '—',
	hellip: '…',
	lsquo: '‘',
	rsquo: '’',
	ldquo: '“',
	rdquo: '”',
	middot: '·',
	bull: '•',
	deg: '°',
	tilde: '~',
	times: '×',
	aacute: 'á',
	agrave: 'à',
	acirc: 'â',
	auml: 'ä',
	eacute: 'é',
	egrave: 'è',
	ecirc: 'ê',
	euml: 'ë',
	iacute: 'í',
	icirc: 'î',
	iuml: 'ï',
	oacute: 'ó',
	ocirc: 'ô',
	ouml: 'ö',
	uacute: 'ú',
	ucirc: 'û',
	uuml: 'ü',
	ntilde: 'ñ',
	ccedil: 'ç',
};

export function decodeHtmlEntities(s: string): string {
	return s
		.replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
		.replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
		.replace(/&([a-z]+);/gi, (m, name) => NAMED[name.toLowerCase()] ?? m);
}
