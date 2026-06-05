'use client';

import { adminUserBatchAction } from '@/actions/user';
import { Button, TextInput } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function BatchUploadStepThree() {
	const [buildTeamSlug, setBuildTeamSlug] = useState('');
	const router = useRouter();

	return (
		<>
			<TextInput
				label="BuildTeam Slug"
				placeholder="de"
				value={buildTeamSlug}
				onChange={(e) => setBuildTeamSlug(e.target.value)}
			/>
			<Button
				mt="md"
				fullWidth
				onClick={() =>
					adminUserBatchAction(null, { step: 'finish', data: { slug: buildTeamSlug } }).then((res) => {
						if (res.status === 'success') {
							alert(`Batch operation completed successfully.`);
							router.push('?step=1');
						} else {
							alert(`Error completing batch operation: ${res.error}`);
						}
					})
				}
			>
				Trigger Batch Operation
			</Button>
		</>
	);
}
