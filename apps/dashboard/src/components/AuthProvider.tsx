'use client';

import type { Session } from 'next-auth';
import { SessionProvider, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthProvider({ session, children }: { session: Session | null; children: React.ReactNode }) {
	const pathname = usePathname();

	useEffect(() => {
		if (session?.error === 'ForceLogout' || (!session && !pathname?.startsWith('/auth'))) {
			signOut();
		}
	}, [session]);
	if (session?.error === 'ForceLogout') {
		return null;
	}

	return <SessionProvider session={session}>{children}</SessionProvider>;
}
