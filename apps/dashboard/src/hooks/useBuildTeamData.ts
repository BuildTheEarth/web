'use client';

import { getUserBuildTeams } from '@/actions/user';
import { useLocalStorage } from '@mantine/hooks';
import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useMemo } from 'react';
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

	const [activeBuildTeamId, setActiveBuildTeamId] = useLocalStorage<string>({
		key: 'bte-active-build-team',
		defaultValue: '',
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

	useEffect(() => {
		if (buildteams.length === 0) {
			if (activeBuildTeamId !== '') {
				setActiveBuildTeamId('');
			}
			return;
		}

		const isActiveValid = buildteams.some((team) => team.id === activeBuildTeamId);
		if (!isActiveValid) {
			setActiveBuildTeamId(buildteams[0].id);
		}
	}, [buildteams, activeBuildTeamId, setActiveBuildTeamId]);

	const activeBuildTeam = useMemo(
		() => buildteams.find((team) => team.id === activeBuildTeamId),
		[buildteams, activeBuildTeamId],
	);

	const selectBuildTeam = useCallback(
		(id: string) => {
			if (id !== activeBuildTeamId && buildteams.some((team) => team.id === id)) {
				setActiveBuildTeamId(id);
			}
		},
		[buildteams, activeBuildTeamId, setActiveBuildTeamId],
	);

	return [buildteams, activeBuildTeam, selectBuildTeam] as const;
}
