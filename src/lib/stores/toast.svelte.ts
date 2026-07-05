const AUTO_DISMISS_MS = 4000;
const MAX_TOASTS = 4;

type Toast = { id: number; message: string };

let toasts = $state<Toast[]>([]);
let seq = 0;
const timers = new Map<number, ReturnType<typeof setTimeout>>();

export function getToasts(): Toast[] {
	return toasts;
}

export function showToast(message: string): void {
	const id = ++seq;
	toasts.push({ id, message });
	while (toasts.length > MAX_TOASTS) {
		dismissToast(toasts[0].id);
	}
	timers.set(
		id,
		setTimeout(() => dismissToast(id), AUTO_DISMISS_MS),
	);
}

export function dismissToast(id: number): void {
	const timer = timers.get(id);
	if (timer) clearTimeout(timer);
	timers.delete(id);
	toasts = toasts.filter((t) => t.id !== id);
}
