'use client';

import { QueryPagination } from '@/components/core/Pagination';
import { AspectRatio, Avatar, Badge, Box, Button, Card, Grid, GridCol, Group, Stack, Text, Title } from '@mantine/core';
import * as motion from 'motion/react-client';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

export type GalleryShowcase = {
	id: string;
	title: string;
	city: string;
	createdAt: string;
	imageSrc: string;
	imageWidth: number | null;
	imageHeight: number | null;
	imageHash: string | null;
	buildTeamName: string | null;
	buildTeamSlug: string | null;
	buildTeamIcon: string | null;
};

export default function GalleryClient({
	locale,
	approvedShowcases,
	allShowcases,
}: {
	locale: string;
	approvedShowcases: GalleryShowcase[];
	allShowcases: GalleryShowcase[];
}) {
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const showAll = searchParams.get('all') === '1';
	const visibleShowcases = showAll ? allShowcases : approvedShowcases;
	const pageSize = 25;
	const rawPage = Number(searchParams.get('page') || '1');
	const currentPage = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
	const pagedShowcases = visibleShowcases.slice((currentPage - 1) * pageSize, currentPage * pageSize);
	const eagerImageCount = 6;
	const formatter = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' });
	const [firstShowcase, ...remainingShowcases] = pagedShowcases;
	const blocks = Array.from({ length: Math.ceil(remainingShowcases.length / 6) }, (_, blockIndex) =>
		remainingShowcases.slice(blockIndex * 6, blockIndex * 6 + 6),
	);

	const params = new URLSearchParams(searchParams.toString());
	params.delete('page');
	if (showAll) {
		params.set('all', '0');
	} else {
		params.set('all', '1');
	}
	const toggleHref = `${pathname}${params.toString() ? `?${params.toString()}` : ''}`;

	const renderShowcaseCard = (showcase: GalleryShowcase, index: number, sizes: string, fillHeight = false) => (
		<motion.div
			initial={{ opacity: 0 }}
			whileInView={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.15) }}
			viewport={{ once: true, margin: '200px' }}
			style={fillHeight ? { display: 'flex', height: '100%', width: '100%' } : undefined}
		>
			<Card
				className="gallery-card"
				withBorder={false}
				radius={0}
				p={0}
				h={fillHeight ? '100%' : undefined}
				style={{
					overflow: 'hidden',
					position: 'relative',
					display: 'flex',
					flexDirection: 'column',
					flex: fillHeight ? 1 : undefined,
					minHeight: 0,
					lineHeight: 0,
					width: '100%',
				}}
			>
				{fillHeight ? (
					<Box pos="relative" w="100%" h="100%" mih={0} style={{ flex: 1, minHeight: 0, zIndex: 0 }}>
						<Image
							alt={`${showcase.title}, ${showcase.city}`}
							src={showcase.imageSrc}
							fill
							unoptimized
							sizes={sizes}
							loading={index < eagerImageCount ? 'eager' : 'lazy'}
							fetchPriority={index < eagerImageCount ? 'high' : 'auto'}
							priority={index < eagerImageCount}
							style={{ objectFit: 'cover' }}
							placeholder={showcase.imageHash ? 'blur' : 'empty'}
							blurDataURL={showcase.imageHash || undefined}
						/>
					</Box>
				) : (
					<AspectRatio ratio={16 / 9}>
						<Box pos="relative" w="100%" h="100%">
							<Image
								src={showcase.imageSrc}
								alt={`${showcase.title}, ${showcase.city}`}
								width={showcase.imageWidth || 1920}
								height={showcase.imageHeight || 1080}
								unoptimized
								sizes={sizes}
								loading={index < eagerImageCount ? 'eager' : 'lazy'}
								fetchPriority={index < eagerImageCount ? 'high' : 'auto'}
								priority={index < eagerImageCount}
								style={{ objectFit: 'cover', width: '100%', height: '100%' }}
								placeholder={showcase.imageHash ? 'blur' : 'empty'}
								blurDataURL={showcase.imageHash || undefined}
							/>
						</Box>
					</AspectRatio>
				)}
				<div
					className="gallery-overlay"
					style={{
						height: '100%',
						width: '100%',
						background: 'linear-gradient(160deg, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0,0.8))',
						position: 'absolute',
						inset: 0,
						pointerEvents: 'none',
						zIndex: 1,
					}}
				>
					<div
						style={{
							position: 'absolute',
							bottom: 0,
							right: 0,
							margin: 'var(--mantine-spacing-lg)',
							textAlign: 'right',
							zIndex: 50,
						}}
					>
						<Text
							style={{ color: 'var(--mantine-color-white)', textShadow: '0px 0px 28px #000', userSelect: 'none' }}
							fw="bold"
							fz="xl"
						>
							{showcase.title}, {showcase.city}
						</Text>
						<Group style={{ flexDirection: 'row-reverse' }}>
							<Badge variant="gradient" style={{ userSelect: 'none' }} size="sm">
								{formatter.format(new Date(showcase.createdAt))}
							</Badge>
							{showcase.buildTeamName && (
								<Avatar src={showcase.buildTeamIcon || undefined} size={18} alt={showcase.buildTeamName + ' Logo'}>
									{showcase.buildTeamName[0]}
								</Avatar>
							)}
						</Group>
					</div>
				</div>
			</Card>
		</motion.div>
	);

	return (
		<>
			<Group justify="flex-end" align="end" mb="xl" wrap="wrap" gap="md">
				<Button component={Link} href={toggleHref} variant="light" radius={0}>
					{showAll ? 'Show approved only' : 'Show all images'}
				</Button>
			</Group>

			{firstShowcase && (
				<Box mb="lg" visibleFrom="lg">
					{renderShowcaseCard(firstShowcase, 0, '(min-width: 75em) 90vw, (min-width: 48em) 90vw, 100vw')}
				</Box>
			)}
			<Stack gap="lg" visibleFrom="lg">
				{blocks.map((block, blockIndex) => {
					const [featured, sideTop, sideBottom, ...rowItems] = block;
					if (!featured) return null;

					const featuredOnRight = blockIndex % 2 === 1;
					const blockStart = blockIndex * 6 + 1;

					return (
						<Box key={`gallery-block-${featured.id}`}>
							<Grid gutter="lg" mb={rowItems.length > 0 ? 'lg' : 0} align="stretch">
								{!featuredOnRight && (
									<GridCol span={8} style={{ display: 'flex' }}>
										{renderShowcaseCard(
											featured,
											blockStart,
											'(min-width: 75em) 66vw, (min-width: 48em) 66vw, 100vw',
											true,
										)}
									</GridCol>
								)}
								<GridCol span={4}>
									<Stack gap="lg" style={{ height: '100%' }}>
										{sideTop &&
											renderShowcaseCard(
												sideTop,
												blockStart + 1,
												'(min-width: 75em) 33vw, (min-width: 48em) 50vw, 100vw',
											)}
										{sideBottom &&
											renderShowcaseCard(
												sideBottom,
												blockStart + 2,
												'(min-width: 75em) 33vw, (min-width: 48em) 50vw, 100vw',
											)}
									</Stack>
								</GridCol>
								{featuredOnRight && (
									<GridCol span={8} style={{ display: 'flex' }}>
										{renderShowcaseCard(
											featured,
											blockStart,
											'(min-width: 75em) 66vw, (min-width: 48em) 66vw, 100vw',
											true,
										)}
									</GridCol>
								)}
							</Grid>

							{rowItems.length > 0 && (
								<Grid gutter="lg">
									{rowItems.map((item, rowItemIndex) => (
										<GridCol key={item.id} span={4}>
											{renderShowcaseCard(
												item,
												blockStart + 3 + rowItemIndex,
												'(min-width: 75em) 33vw, (min-width: 48em) 50vw, 100vw',
											)}
										</GridCol>
									))}
								</Grid>
							)}
						</Box>
					);
				})}
			</Stack>

			<Grid gutter="lg" hiddenFrom="lg">
				{pagedShowcases.map((showcase, index) => (
					<GridCol key={showcase.id} span={{ base: 12, sm: index === 0 ? 12 : 6 }}>
						{renderShowcaseCard(showcase, index, '(min-width: 48em) 50vw, 100vw')}
					</GridCol>
				))}
			</Grid>

			{visibleShowcases.length > pageSize && (
				<Group justify="center" mt="xl">
					<QueryPagination itemCount={visibleShowcases.length} pageSize={pageSize} paramName="page" />
				</Group>
			)}
		</>
	);
}
