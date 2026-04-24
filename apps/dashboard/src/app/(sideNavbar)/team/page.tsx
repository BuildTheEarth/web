'use client';
import { useActiveBuildTeam } from '@/hooks/useBuildTeamData';
import { redirect } from 'next/navigation';

export default function Page() {
	const activeBuildTeam = useActiveBuildTeam();

	if (activeBuildTeam) redirect(`/team/${activeBuildTeam.slug}`);
}
