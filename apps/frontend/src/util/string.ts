export function snakeCaseToStartCase(string: string): string {
	return string.replace(/_/g, ' ').replace(/^\w|\s\w/g, (l) => l.toUpperCase());
}
export function capitalize(string: string): string {
	return string.charAt(0).toUpperCase() + string.slice(1);
}
