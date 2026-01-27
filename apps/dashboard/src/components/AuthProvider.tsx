'use client';

import type { Session } from 'next-auth';
import { SessionProvider, signOut } from 'next-auth/react';
import { useEffect } from 'react';

export default function AuthProvider({ session, children }: { session: Session | null; children: React.ReactNode }) {
	useEffect(() => {
		// Force logout if session has error or no user data when it should
		if (session?.error === 'ForceLogout' || (session && !session.user)) {
			console.log('AuthProvider: Forcing logout due to invalid session');
			signOut({ callbackUrl: '/auth/signin', redirect: true });
		}
	}, [session]);

	if (session?.error === 'ForceLogout' || (session && !session.user)) {
		return null;
	}

	return <SessionProvider session={session}>{children}</SessionProvider>;
}
