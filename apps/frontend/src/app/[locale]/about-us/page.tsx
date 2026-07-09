import Wrapper from '@/components/layout/Wrapper'
import prisma from '@/util/db'
import directus from '@/util/directus'
import { getLanguageAlternates } from '@/util/seo'
import { readItems } from '@directus/sdk'
import { Text, Title, Box, Stack, Grid, GridCol, Image, Flex } from '@mantine/core'
import { IconChevronRight, IconCornerRightUp } from '@tabler/icons-react'
import { Metadata } from 'next'
import { Locale } from 'next-intl'
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server'
import LinkButton from '@/components/core/LinkButton'
import AppearAnimation from '@/components/animations/AppearAnimation'

export const dynamic = 'force-static'
export const revalidate = 86400 // 24h

interface ProjectTimelineItem {
	id: string
	date: string
	title: string
	content: string
	link?: string
	date_display: 'year' | 'month' | 'day'
}

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
	const locale = (await params).locale
	const t = (await getTranslations({ locale, namespace: 'about-us.seo' })) as (key: 'title' | 'description') => string

	return {
		title: t('title'),
		description: t('description'),
		alternates: {
			languages: getLanguageAlternates('/about-us'),
		},
	}
}

// depending on the display type, format the date
const formatDate = (
	dateStr: string,
	dateDisplay: 'year' | 'month' | 'day',
	formatter: Awaited<ReturnType<typeof getFormatter>>,
) => {
	const parts = dateStr.split(/[- :]/)
	const year = parseInt(parts[0], 10)
	const month = parts[1] ? parseInt(parts[1], 10) - 1 : 0
	const day = parts[2] ? parseInt(parts[2], 10) : 1
	const date = new Date(Date.UTC(year, month, day))

	if (isNaN(date.getTime())) return dateStr

	if (dateDisplay === 'year') {
		return formatter.dateTime(date, { year: 'numeric', timeZone: 'UTC' })
	} else if (dateDisplay === 'month') {
		return formatter.dateTime(date, { year: 'numeric', month: 'long', timeZone: 'UTC' })
	} else {
		return formatter.dateTime(date, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
	}
}

export default async function Page({ params }: { params: Promise<{ locale: Locale }> }) {
	const locale = (await params).locale
	setRequestLocale(locale)
	const t = await getTranslations('about-us')
	const formatter = await getFormatter()

	const timelineItems = (await directus.request(
		readItems('project_timeline', { limit: 99, sort: 'date' }),
	)) as unknown as ProjectTimelineItem[]

	const showcaseImages = await prisma.showcase.findMany({
		where: { approved: true },
		orderBy: { createdAt: 'desc' },
		select: {
			id: true,
			title: true,
			city: true,
			image: { select: { name: true } },
		},
	})

	return (
		<Wrapper offsetHeader={false} head={{ title: t('seo.title'), src: '/thumbs/1.webp' }}>
			<Stack gap={100} mt="xl" w="100%">
				{timelineItems.map((item, index) => {
					const isEven = index % 2 === 0
					const showcase = showcaseImages.length > 0 ? showcaseImages[index % showcaseImages.length] : null

					const textCol = (
						<GridCol span={{ base: 12, md: 6 }} key="text">
							<AppearAnimation component="div" delay={0.05}>
								<Title order={2}>{item.title}</Title>
								<div className="heading-underline" style={{ marginBottom: 'var(--mantine-spacing-md)' }} />

								<Text size="xs" c="dimmed" mb="xs" fw={500}>
									{formatDate(item.date, item.date_display, formatter)}
								</Text>

								<Text
									maw="100%"
									component="div"
									style={{ lineHeight: 1.6 }}
									dangerouslySetInnerHTML={{ __html: item.content }}
								/>

								{item.link && (
									<LinkButton
										variant="filled"
										href={item.link}
										target="_blank"
										color="indigo"
										rightSection={<IconChevronRight size={12} />}
										mt="md"
									>
										{t('link')}
									</LinkButton>
								)}
							</AppearAnimation>
						</GridCol>
					)

					const imageCol = showcase ? (
						<GridCol span={{ base: 12, md: 6 }} key="image">
							<AppearAnimation component="div" delay={0.1}>
								<Box style={{ position: 'relative' }}>
									<Image
										style={{ aspectRatio: '16 / 9' }}
										src={`${process.env.NEXT_PUBLIC_CDN_URL}/uploads/${showcase.image.name}`}
										w="100%"
										alt={`${showcase.title}, ${showcase.city}`}
									/>
									<Flex justify="flex-end" align="center" mt="xs" mr="xs">
										<Text
											fw="bold"
											fz="sm"
											style={{ color: 'var(--mantine-color-dimmed)', textShadow: '0px 0px 28px #000' }}
										>
											{`${showcase.title}, ${showcase.city}`}
										</Text>
										<IconCornerRightUp size={24} color="var(--mantine-color-dimmed)" style={{ paddingBottom: '4px' }} />
									</Flex>
								</Box>
							</AppearAnimation>
						</GridCol>
					) : null

					return (
						<Grid key={item.id} w="100%" align="center" gutter={60}>
							{isEven ? [textCol, imageCol] : [imageCol, textCol]}
						</Grid>
					)
				})}
			</Stack>
		</Wrapper>
	)
}
