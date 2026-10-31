'use client'

import Anchor from '@/components/core/Anchor'
import { Text, TextProps } from '@mantine/core'

export const PRIVACY_URL = 'https://buildtheearth.net/legal/privacy'
export const TERMS_URL = 'https://buildtheearth.net/legal/terms-of-service'

export function LegalConsent({ prefix = 'By continuing you agree to our', ...props }: TextProps & { prefix?: string }) {
	return (
		<Text c="dimmed" fz="xs" {...props}>
			{prefix}{' '}
			<Anchor href={TERMS_URL} target="_blank" fz="xs">
				Terms of Service
			</Anchor>{' '}
			and{' '}
			<Anchor href={PRIVACY_URL} target="_blank" fz="xs">
				Privacy Policy
			</Anchor>
			.
		</Text>
	)
}
