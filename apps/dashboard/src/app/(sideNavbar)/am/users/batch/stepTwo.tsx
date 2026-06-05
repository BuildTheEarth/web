import Anchor from '@/components/core/Anchor';
import prisma from '@/util/db';
import { StepTwoTable } from './interactivity';

export async function BatchUploadStepTwo() {
	const data = (await prisma.jsonStore.findFirst({
		where: { id: 'batchUserData' },
	})) as {
		id: string;
		data: {
			users: { id: string; ssoId: string; discordId: string; username: string; found: boolean }[];
			total: number;
			foundCount: number;
		};
	};

	if (!data || !data.data || !data.data.users) {
		return <p>No data loaded. Please go back to step 1 and load a file first.</p>;
	}

	return (
		<>
			<h2>Preview Loaded Data</h2>
			<p>
				Input Data: {data.data.total} <br />
				Found Users: {data.data.foundCount} <br />
				Not Found: {data.data.total - data.data.foundCount} <br />
				Review data before proceeding. Potentially remove wrong entries from the original file and{' '}
				<Anchor href="?step=1">reload</Anchor> if needed.
			</p>
			<StepTwoTable users={data.data.users} />
		</>
	);
}
