import Wrapper from '@/components/layout/Wrapper'
import directus from '@/util/directus'
import { getLanguageAlternates, getLocalizedUrl } from '@/util/seo'
import { readItems } from '@directus/sdk'
import { Typography } from '@mantine/core'
import { SafeHtml } from '@repo/shared'
import { Metadata } from 'next'
import { Locale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
	const locale = (await params).locale
	const t = (await getTranslations({ locale, namespace: 'common.links' })) as (key: 'impressum') => string

	return {
		title: t('impressum'),
		alternates: {
			canonical: getLocalizedUrl(locale, '/legal/impressum'),
			languages: getLanguageAlternates('/legal/impressum'),
		},
	}
}

export default async function Page({ params }: { params: Promise<{ locale: Locale }> }) {
	const locale = (await params).locale
	setRequestLocale(locale)
	const t = await getTranslations('common.links')

	const data: { content: string }[] = await directus.request(readItems('impressum')).then((data: any) => {
		if (locale == 'en') return [data]

		return directus
			.request(
				readItems('impressum_translations', {
					filter: {
						impressum_id: {
							_eq: data.id,
						},
						languages_code: {
							_eq: locale + '-' + locale.toUpperCase(),
						},
					},
				}),
			)
			.then((translations) => (translations.length ? translations : [data]))
	})

	return (
		<Wrapper
			head={{
				title: t('impressum'),
				src: '/thumbs/9.webp',
			}}
			offsetHeader={false}
		>
			<Typography>
				<SafeHtml html={data[0].content} />
			</Typography>
		</Wrapper>
	)
}
