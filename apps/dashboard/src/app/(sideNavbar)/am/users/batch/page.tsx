import { Title } from '@mantine/core';

import ContentWrapper from '@/components/core/ContentWrapper';
import LinkButton from '@/components/core/LinkButton';
import { Protection } from '@/components/Protection';
import { Metadata } from 'next';
import { BatchUploadStepOne } from './stepOne';
import { BatchUploadStepThree } from './stepThree';
import { BatchUploadStepTwo } from './stepTwo';

export const metadata: Metadata = {
	title: 'Website Users',
};

export default async function Page({ searchParams }: { searchParams: Promise<{ step?: string; query?: string }> }) {
	const { step } = await searchParams;

	return (
		<Protection requiredRole="edit-users">
			<ContentWrapper maw="90vw">
				<Title order={1} mt="xl" mb="md">
					Batch User Administration
				</Title>
				{step == null && (
					<>
						<p>
							Be careful of what you are doing here. You can cause a lot of damage if you don't know exactly what you
							are doing. Click button below to start or jump back to a already started batch operation.
							<br />
							<b>For now you can only add users to a BuildTeam</b>
						</p>
						<LinkButton href="?step=1" mt="md" fullWidth>
							Step 1: Upload Data
						</LinkButton>
						<LinkButton href="?step=2" mt="md" fullWidth>
							Step 2: Preview Users
						</LinkButton>
					</>
				)}
				{step == '1' && <BatchUploadStepOne />}
				{step == '2' && <BatchUploadStepTwo />}
				{step == '3' && <BatchUploadStepThree />}
			</ContentWrapper>
		</Protection>
	);
}
