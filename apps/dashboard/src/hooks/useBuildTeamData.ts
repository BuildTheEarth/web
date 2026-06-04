'use client';

import { getUserBuildTeams } from '@/actions/user';
import { useLocalStorage } from '@mantine/hooks';
import { useSession } from 'next-auth/react';
import { useCallback } from 'react';
import useSWR from 'swr';

type BuildTeam = {
	id: string;
	slug: string;
	name: string;
	icon: string;
};

export default function useSelectableBuildTeams() {
	const { data: session } = useSession();
	const userId = session?.user.id;

	const [activeBuildTeam, setActiveBuildTeam] = useLocalStorage<BuildTeam>({
		key: 'bte-active-build-team',
	});

	const { data: buildteams = [] } = useSWR<BuildTeam[], Error, readonly [string, string] | null>(
		userId ? (['user-build-teams', userId] as const) : null,
		([, id]: readonly [string, string]) => getUserBuildTeams(id),
		// ([, id]: readonly [string, string]) => [],
		{
			revalidateOnFocus: false,
			dedupingInterval: 10 * 60 * 1000,
		},
	);

	const selectBuildTeam = useCallback(
		(id: string) => {
			if (id !== activeBuildTeam.id) {
				const team = buildteams.find((buildTeam) => buildTeam.id === id);
				if (team) {
					setActiveBuildTeam(team);
				}
			}
		},
		[buildteams, activeBuildTeam, setActiveBuildTeam],
	);

	return [buildteams, activeBuildTeam, selectBuildTeam] as const;
}

export function useActiveBuildTeam() {
	const [activeBuildTeam] = useLocalStorage<BuildTeam>({
		key: 'bte-active-build-team',
	});

	return activeBuildTeam;
}
