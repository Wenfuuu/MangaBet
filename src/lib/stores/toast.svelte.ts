const AUTO_DISMISS_MS = 4000;

type Toast = { id: number; message: string };

let current = $state<Toast | null>(null);
let timer: ReturnType<typeof setTimeout> | undefined;
let seq = 0;

export function getToast(): Toast | null {
	return current;
}

export function showToast(message: string): void {
	clearTimeout(timer);
	current = { id: ++seq, message };
	timer = setTimeout(() => (current = null), AUTO_DISMISS_MS);
}

export function dismissToast(): void {
	clearTimeout(timer);
	current = null;
}
