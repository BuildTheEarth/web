'use client';

import { getAllowedBuildTeams, getPersonalClaims } from '@/actions/claimEditor';
import { Box, Divider } from '@mantine/core';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import EditorMap from './editorMap';
import { SaveButtonGroup } from './interactivity';
import { useClaimEditorStore } from './store';

export default function Page() {
	const session = useSession();
	const editorStore = useClaimEditorStore();

	// Set personal claims in editor store
	useEffect(() => {
		if (!session?.data?.user.id) return;
		if (editorStore.claims.length > 0) return;

		const setInitialData = async () => {
			const claims = await getPersonalClaims(session?.data?.user.id || 'XXXXX');
			const allowedBuildTeamIds = await getAllowedBuildTeams(session?.data?.user.id || 'XXXXX');
			editorStore.setClaims(claims);
			editorStore.setAllowedBuildTeamIds(allowedBuildTeamIds);
			editorStore.setUserId(session?.data?.user.id || 'XXXXX');
		};

		setInitialData();
	}, [session?.data?.user.id, editorStore]);

	return (
		<Box w="100%" h="calc(100vh - var(--app-shell-header-height) - 4 * var(--mantine-spacing-md) - 5px)">
			<SaveButtonGroup />
			<Divider />
			<div style={{ height: '100%', display: 'flex', flexDirection: 'row' }}>
				<EditorMap userId={session?.data?.user.id || 'XXXXX'} />
				{/* <EditorDetails /> */}
			</div>
		</Box>
	);
}
