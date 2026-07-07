import { routing } from '@/i18n/routing'
import prisma from '@/util/db'
import { getTranslations } from 'next-intl/server'
import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const alt = 'BuildTheEarth'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export function generateStaticParams() {
	return routing.locales.map((locale) => ({ locale }))
}

function toPercent(value: number, total: number) {
	if (!total || total <= 0) {
		return 0
	}

	return Math.max(0, Math.min(100, (value / total) * 100))
}

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
	const cairoBlackFont = await readFile(join(process.cwd(), 'public/fonts/Cairo-Black.ttf'))
	const cairoMediumFont = await readFile(join(process.cwd(), 'public/fonts/Cairo-Medium.ttf'))

	const locale = (await params).locale

	const t = (await getTranslations({ locale, namespace: 'seo.og' })) as (key: 'title' | 'subtitle') => string

	const totalClaims = await prisma.claim.aggregate({
		_sum: { size: true },
		where: { active: true, finished: true },
	})
	const earthTotalAreaKm2 = 510_100_000

	const percent = toPercent((totalClaims._sum.size || 0) / 1_000_000, earthTotalAreaKm2)

	return new ImageResponse(
		(
			<div
				style={{
					height: '100%',
					width: '100%',
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
					position: 'relative',
					backgroundImage: `url("${process.env.NEXT_PUBLIC_CDN_URL}/static/opengraph-base.png")`,
					backgroundSize: 'cover',
					backgroundPosition: 'center',
					padding: '40px',
				}}
			>
				<div
					style={{
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						backgroundColor: 'rgba(0, 0, 0, 0.6)',
					}}
				/>
				<div
					style={{
						position: 'relative',
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						gap: '8px',
					}}
				>
					<div
						style={{
							fontSize: 64,
							lineHeight: 1,
							fontWeight: 900,
							color: 'white',
							textAlign: 'center',
							fontFamily: 'Cairo',
							display: 'flex',
						}}
					>
						{percent.toFixed(4)}%
					</div>
					<div
						style={{
							fontSize: 24,
							lineHeight: 1.1,
							fontWeight: 400,
							color: 'white',
							fontFamily: 'Cairo',
							display: 'flex',
						}}
					>
						{new Intl.NumberFormat(locale).format(Math.floor((totalClaims._sum.size || 0) / 1_000_000)) + ' '} km² of
						Earth&apos;s total surface.
					</div>
				</div>
			</div>
		),
		{
			...size,
			fonts: [
				{ name: 'Cairo', data: cairoBlackFont, weight: 900, style: 'normal' },
				{ name: 'Cairo', data: cairoMediumFont, weight: 400, style: 'normal' },
			],
		},
	)
}
