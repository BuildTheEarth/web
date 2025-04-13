export function PluralSingular(props: { count: number; singular: string; plural?: string }) {
	return <>{pluralSingluar(props.count, props.singular, props.plural)}</>;
}

export function pluralSingluar(count: number, singular: string, plural?: string) {
	const usedPlural = plural || singular + 's';
	return `${count} ${count === 1 ? singular : usedPlural}`;
}
