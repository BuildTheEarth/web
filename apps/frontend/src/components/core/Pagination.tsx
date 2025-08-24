'use client';
import { useRouter } from '@/i18n/navigation';
import { Pagination as MPagination, PaginationProps } from '@mantine/core';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

export default function Pagination() {
	return MPagination;
}

function QueryPaginationInner({
	itemCount,
	pageSize = 10,
	paramName = 'page',
	...props
}: { itemCount: number; pageSize?: number; paramName?: string } & Omit<
	PaginationProps,
	'total' | 'value' | 'onChange'
>) {
	const router = useRouter();
	const searchParams = useSearchParams();

	const totalPages = Math.ceil(itemCount / pageSize);
	const currentPage = Number(searchParams.get(paramName)) || 1;

	const getHref = (page: number) => {
		const params = new URLSearchParams(searchParams.toString());
		if (page === 1) {
			params.delete(paramName);
		} else {
			params.set(paramName, String(page));
		}
		return `?${params.toString()}`;
	};

	return (
		<MPagination
			total={totalPages}
			value={currentPage}
			withEdges
			onChange={(page) => router.push(getHref(page))}
			getItemProps={(page) => ({
				component: 'a',
				href: getHref(page),
				'aria-current': page === currentPage ? 'page' : undefined,
			})}
			getControlProps={(control) => {
				let page: number | undefined;
				if (control === 'first') page = 1;
				if (control === 'last') page = totalPages;
				if (control === 'next') page = Math.min(currentPage + 1, totalPages);
				if (control === 'previous') page = Math.max(currentPage - 1, 1);
				if (page) {
					return {
						component: 'a',
						href: getHref(page),
						'aria-current': page === currentPage ? 'page' : undefined,
						'aria-label':
							control === 'first'
								? 'First page'
								: control === 'last'
									? 'Last page'
									: control === 'next'
										? 'Next page'
										: 'Previous page',
					};
				}
				return {};
			}}
			{...props}
		/>
	);
}

export function QueryPagination(
	props: { itemCount: number; pageSize?: number; paramName?: string } & Omit<
		PaginationProps,
		'total' | 'value' | 'onChange'
	>,
) {
	return (
		<Suspense>
			<QueryPaginationInner {...props} />
		</Suspense>
	);
}
