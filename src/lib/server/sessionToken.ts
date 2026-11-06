const MAX_TOKEN_LENGTH = 4096;
const PRINTABLE_ASCII = /^[\x21-\x7e]+$/;

export function parseSessionToken(input: string): string | null {
	const pasted = input.trim();
	const value = pasted.match(/(?:^|;\s*)token=([^;]*)/)?.[1] ?? pasted;

	let token: string;
	try {
		token = decodeURIComponent(value);
	} catch {
		return null;
	}

	if (token.length > MAX_TOKEN_LENGTH || !PRINTABLE_ASCII.test(token)) return null;
	return token;
}
