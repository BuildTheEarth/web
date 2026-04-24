'use server';
import directus from '@/util/directus';
import { Card, CardSection, Group, Image, Text, Tooltip } from '@mantine/core';
import { IconCalendar, IconChevronRight } from '@tabler/icons-react';
import { getFormatter } from 'next-intl/server';
import LinkButton from '../core/LinkButton';

export interface OutreachArticle {
	id: string;
	headline: string;
	content_preview: string;
	thumbnail: string;
	publisher: string;
	link: string;
	date: string;
}

export async function OutreachArticleCard({
	article,
	formatter,
	ctaText,
}: {
	article: OutreachArticle;
	formatter: Awaited<ReturnType<typeof getFormatter>>;
	ctaText?: string;
}) {
	return (
		<Card
			key={article.id + '-lg'}
			withBorder
			maw={{ base: '60vw', sm: '40vw', md: '32vw', xl: '20vw' }}
			radius={0}
			className="anim"
		>
			<CardSection>
				<Image src={`${directus.url}assets/${article.thumbnail}?height=320`} height={160} alt="Thumbnail Image" />
			</CardSection>

			<Text
				fw={700}
				fz="xl"
				mt="md"
				style={{
					display: '-webkit-box',
					WebkitLineClamp: 2,
					lineClamp: 2,
					WebkitBoxOrient: 'vertical',
					overflow: 'hidden',
				}}
			>
				{article.headline}
			</Text>
			<Group wrap="nowrap" gap={10} mt="xs" mb="md">
				<Tooltip label={'Published on ' + formatter.dateTime(new Date(article.date), { dateStyle: 'medium' })}>
					<IconCalendar size={16} />
				</Tooltip>
				<Text size="xs" c="dimmed">
					{formatter.dateTime(new Date(article.date), { dateStyle: 'medium' })} / {article.publisher}
				</Text>
			</Group>
			<Text
				size="sm"
				c="dimmed"
				style={{
					minHeight: '5lh',
					maxHeight: '5lh',
					display: '-webkit-box',
					WebkitLineClamp: 5,
					lineClamp: 5,
					WebkitBoxOrient: 'vertical',
					overflow: 'hidden',
				}}
			>
				{article.content_preview}
			</Text>
			<LinkButton
				href={article.link}
				target="_blank"
				variant="subtle"
				color="indigo"
				rightSection={<IconChevronRight size={12} />}
				mt="md"
			>
				{ctaText || 'Continue reading'}
			</LinkButton>
		</Card>
	);
}
