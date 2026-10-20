// Promo toasts (sign in, connect MAL) are nudges, not onboarding: at most one per page
// load, and each one rests for a week after it has been shown on this device.
const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

let shownThisLoad = false;

export function claimPromo(name: string): boolean {
	if (shownThisLoad) return false;
	const key = `mangabet:promo:${name}`;
	try {
		const last = Number(localStorage.getItem(key));
		if (last && Date.now() - last < COOLDOWN_MS) return false;
		localStorage.setItem(key, String(Date.now()));
	} catch {
		// storage blocked: fall back to once per load
	}
	shownThisLoad = true;
	return true;
}

export function isQuietPath(pathname: string): boolean {
	return (
		pathname.startsWith('/login') ||
		pathname.startsWith('/register') ||
		pathname.includes('/chapter/')
	);
}
