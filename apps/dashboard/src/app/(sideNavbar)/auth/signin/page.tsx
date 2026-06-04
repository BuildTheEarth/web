'use client';

import ErrorDisplay from '@/components/core/ErrorDisplay';
import { Button } from '@mantine/core';
import { signIn, useSession } from 'next-auth/react';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SigninPage() {
	const router = useRouter();
	const { status } = useSession();

	useEffect(() => {
		if (status === 'unauthenticated') {
			void signIn('keycloak', { callbackUrl: '/', redirect: true });
		} else if (status === 'authenticated') {
			void router.push('/');
		}
	}, [status, router]);

	return (
		<>
			<ErrorDisplay
				title="You are beeing redirected..."
				message="If you are still on this page after 5 seconds, please click the button below."
				showBackButton={false}
			/>
			<Button size="sm" ml="md" mt="lg" onClick={() => void signIn('keycloak', { callbackUrl: '/', redirect: true })}>
				Sign In with Keycloak
			</Button>
		</>
	);
}
