'use client';

import { Button } from '@mantine/core';
import { signIn, useSession } from 'next-auth/react';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SigninPage() {
	const router = useRouter();
	const { status } = useSession();

	useEffect(() => {
		if (status === 'unauthenticated') {
			console.log('No JWT');
			console.log(status);
			void signIn('keycloak', { callbackUrl: '/', redirect: true });
		} else if (status === 'authenticated') {
			void router.push('/');
		}
	}, [status, router]);

	return (
		<Button onClick={() => void signIn('keycloak', { callbackUrl: '/', redirect: true })}>Sign In with Keycloak</Button>
	); // TODO: Add button to trigger sign-in manually
}
