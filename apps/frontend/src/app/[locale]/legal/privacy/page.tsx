import Wrapper from '@/components/layout/Wrapper'
import directus from '@/util/directus'
import { getLanguageAlternates, getLocalizedUrl } from '@/util/seo'
import { readItems } from '@directus/sdk'
import { Typography } from '@mantine/core'
import { SafeHtml } from '@repo/shared'
import { Metadata } from 'next'
import { Locale } from 'next-intl'
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server'

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
	const locale = (await params).locale
	const t = (await getTranslations({ locale, namespace: 'common.links' })) as (key: 'privacy') => string

	return {
		title: t('privacy'),
		alternates: {
			canonical: getLocalizedUrl(locale, '/legal/privacy'),
			languages: getLanguageAlternates('/legal/privacy'),
		},
	}
}

export default async function Page({ params }: { params: Promise<{ locale: Locale }> }) {
	const locale = (await params).locale
	setRequestLocale(locale)
	const t = await getTranslations('common.links')
	const f = await getFormatter()

	const data: { content: string; date_updated: string }[] = await directus
		.request(readItems('privacy_policy'))
		.then((data: any) => {
			if (locale == 'en') return [data]

			return directus
				.request(
					readItems('privacy_policy_translations', {
						filter: {
							privacy_policy_id: {
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
				title: t('privacy'),
				src: '/thumbs/9.webp',
			}}
			offsetHeader={false}
		>
			<Typography>
				<p>
					Last updated:{' '}
					{f.dateTime(new Date(data[0].date_updated), {
						year: 'numeric',
						month: 'numeric',
						day: 'numeric',
						hour: 'numeric',
						minute: 'numeric',
						timeZoneName: 'short',
					})}
				</p>
				<SafeHtml html={data[0].content} />
			</Typography>
		</Wrapper>
	)
}
