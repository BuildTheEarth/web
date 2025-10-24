import Wrapper from '@/components/layout/Wrapper';
import prisma from '@/util/db';
import { BarChart, PieChart } from '@mantine/charts';
import { Badge, Box, Code, Container, Grid, GridCol, Text, Title } from '@mantine/core';
// import { PrismaClient } from '@prisma/client';
import { Metadata } from 'next';
import { Locale } from 'next-intl';
import { getFormatter, getTranslations } from 'next-intl/server';
import { Bar } from 'recharts';

export const metadata: Metadata = {
	title: 'Project Statistics',
	description:
		'Explore detailed statistics and insights about our projects, including progress, contributions, and more.',
};

export default async function Page({ params }: { params: Promise<{ locale: Locale }> }) {
	const t = await getTranslations('statistics');
	const formatter = await getFormatter();
	const counts = await prisma.$transaction([
		prisma.user.count({ where: { joinedBuildTeams: { some: {} } } }),
		prisma.claim.count({ where: { active: true } }),
		prisma.claim.aggregate({ _sum: { buildings: true }, where: { active: true, finished: true } }),
	]);
	const claims = await prisma.$transaction([
		prisma.claim.count({ where: { active: true, finished: true } }),
		prisma.claim.aggregate({ _sum: { buildings: true }, where: { active: true } }),
		prisma.claim.aggregate({ _sum: { size: true }, where: { active: true } }),
		prisma.claim.aggregate({ _sum: { size: true }, where: { active: true, finished: true } }),
		prisma.claim.count(),
		prisma.claim.aggregate({ _sum: { buildings: true } }),
		prisma.claim.aggregate({ _sum: { size: true } }),
	]);

	const leaderboard = await prisma.$transaction([
		prisma.claim.findMany({
			orderBy: { buildings: 'desc' },
			where: { active: true, finished: true },
			take: 5,
		}),
		prisma.claim.findMany({
			orderBy: { size: 'desc' },
			where: { active: true, finished: true },

			take: 5,
		}),
		prisma.user.findMany({
			orderBy: { claims: { _count: 'desc' } },
			take: 10,
			select: { username: true, _count: { select: { claims: true } } },
		}),
		prisma.buildTeam.findMany({
			orderBy: { claims: { _count: 'desc' } },
			take: 10,
			select: { name: true, _count: { select: { claims: true } } },
		}),
	]);

	const buildTeams = await prisma.$transaction([
		prisma.buildTeam.findMany({
			orderBy: { members: { _count: 'desc' } },
			select: { name: true, slug: true, color: true, _count: { select: { members: true } } },
		}),
	]);

	return (
		<Wrapper offsetHeader={false} head={{ title: t('title'), src: '/placeholders/home.png' }} padded={false}>
			<Container
				style={{ border: 'var(--debug-border) solid red' }}
				mt="calc(var(--mantine-spacing-xl) * 3)"
				mb="calc(var(--mantine-spacing-xl) * 4)"
				size="responsive"
				w="80%"
			>
				<Grid>
					<GridCol span={12}>
						<Title order={2}>At a Glance</Title>
						<div className="heading-underline" />
					</GridCol>

					<GridCol span={10} offset={1}>
						<Box
							style={{
								backgroundColor: 'var(--mantine-color-dark-6)',
								borderRadius: 0,
								boxShadow: 'var(--mantine-shadow-block)',
								display: 'flex',
							}}
							p="xl"
							mt="calc(var(--mantine-spacing-xl) * 2)"
						>
							<Box
								style={{
									flex: 1,
								}}
								mr="md"
							>
								<Text fz={36} lh={1} fw={700} mb="md">
									{formatter.number(counts[0])}
								</Text>
								<Text tt="uppercase" fw={700}>
									Users
								</Text>
								<Text c="dimmed" fz="sm" mt={5}>
									are helping Building the Earth in Minecraft.
								</Text>
							</Box>
							<Box
								style={{
									flex: 1,
								}}
							>
								<Text fz={36} lh={1} fw={700} mb="md">
									{formatter.number(counts[2]._sum.buildings || 0, { maximumSignificantDigits: 4 })}+
								</Text>
								<Text tt="uppercase" fw={700}>
									Buildings
								</Text>
								<Text c="dimmed" fz="sm" mt={5}>
									have already been constructed on the entire globe.
								</Text>
							</Box>
							<Box
								style={{
									flex: 1,
								}}
								ml="md"
							>
								<Text fz={36} lh={1} fw={700} mb="md">
									{formatter.number(counts[1], { maximumSignificantDigits: 4 })}+
								</Text>
								<Text tt="uppercase" fw={700}>
									Claims
								</Text>
								<Text c="dimmed" fz="sm" mt={5}>
									are beeing build or are already finished.
								</Text>
							</Box>
						</Box>
					</GridCol>

					<GridCol span={12}>
						<Title order={2} mt="calc(var(--mantine-spacing-xl) * 3)">
							Claims
						</Title>
						<div className="heading-underline" />
					</GridCol>

					<GridCol span={12} mt="calc(var(--mantine-spacing-md) * 2)">
						<Box
							style={{
								backgroundColor: 'var(--mantine-color-dark-6)',
								borderRadius: 0,
								boxShadow: 'var(--mantine-shadow-block)',
								display: 'flex',
							}}
							p="xl"
						>
							<Box
								style={{
									flex: 1,
								}}
								mr="md"
							>
								<Text fz={36} lh={1} fw={700} mb="md">
									{formatter.number(claims[4])}
								</Text>
								<Text tt="uppercase" fw={700}>
									Total Claims
								</Text>
								<Text c="dimmed" fz="sm" mt={5}>
									haven been created.
								</Text>
							</Box>
							<Box
								style={{
									flex: 1,
								}}
								mr="md"
							>
								<Text fz={36} lh={1} fw={700} mb="md">
									{formatter.number(counts[1])}
								</Text>
								<Text tt="uppercase" fw={700}>
									Active Claims
								</Text>
								<Text c="dimmed" fz="sm" mt={5}>
									are currently visible on our map.
								</Text>
							</Box>
							<Box
								style={{
									flex: 1,
								}}
							>
								<Text fz={36} lh={1} fw={700} mb="md">
									{formatter.number(claims[0])}
								</Text>
								<Text tt="uppercase" fw={700}>
									Finished Claims
								</Text>
								<Text c="dimmed" fz="sm" mt={5}>
									have already been fully built.
								</Text>
							</Box>
							<Box
								style={{
									flex: 1,
								}}
								ml="md"
							>
								<Text fz={36} lh={1} fw={700} mb="md">
									{formatter.number(counts[1] - claims[0])}
								</Text>
								<Text tt="uppercase" fw={700}>
									Unfinished Claims
								</Text>
								<Text c="dimmed" fz="sm" mt={5}>
									are still under construction.
								</Text>
							</Box>
						</Box>
					</GridCol>

					<GridCol span={10 / 3} mt="calc(var(--mantine-spacing-md) * 2)">
						{(() => {
							const finished = claims[0];
							const unfinished = counts[1] - claims[0];
							const total = counts[1];
							return (
								<Box
									style={{
										backgroundColor: 'var(--mantine-color-dark-6)',
										borderRadius: 0,
										boxShadow: 'var(--mantine-shadow-block)',
									}}
									p="xl"
								>
									<Title order={3} fz="md" tt="uppercase" mb="xl">
										Finished vs. Unfinished <br />
										(Count)
									</Title>
									<Box style={{ width: '100%', height: '150px', overflow: 'hidden' }} mb="md">
										<PieChart
											data={[
												{ name: 'Finished', value: finished, color: 'green.6' },
												{ name: 'Unfinished', value: unfinished, color: 'gray.6' },
											]}
											startAngle={180}
											endAngle={0}
											size={300}
											w="100%"
										/>
									</Box>
									<table style={{ margin: 0, padding: 0 }}>
										<tbody>
											<tr>
												<td>
													<Badge size="lg" color="green" variant="dot" bg="transparent" bd="none">
														Finished
													</Badge>
												</td>
												<td>
													<Code>{formatter.number(finished)}</Code>
												</td>
												<td style={{ fontSize: 'var(--mantine-font-size-xs)' }}>/</td>
												<td>
													<Code>{formatter.number((finished / total) * 100, { maximumFractionDigits: 1 })}%</Code>
												</td>
											</tr>
											<tr>
												<td>
													<Badge size="lg" color="gray" variant="dot" bg="transparent" bd="none">
														Unfinished
													</Badge>
												</td>
												<td>
													<Code>{formatter.number(unfinished)}</Code>
												</td>
												<td style={{ fontSize: 'var(--mantine-font-size-xs)' }}>/</td>
												<td>
													<Code>
														{formatter.number((unfinished / total) * 100, {
															maximumFractionDigits: 1,
														})}
														%
													</Code>
												</td>
											</tr>
										</tbody>
									</table>
								</Box>
							);
						})()}
					</GridCol>
					<GridCol span={10 / 3} offset={1} mt="calc(var(--mantine-spacing-md) * 2)">
						{(() => {
							const total = claims[1]._sum.buildings || 0;
							const finished = counts[2]._sum.buildings || 0;
							const unfinished = total - finished;
							return (
								<Box
									style={{
										backgroundColor: 'var(--mantine-color-dark-6)',
										borderRadius: 0,
										boxShadow: 'var(--mantine-shadow-block)',
									}}
									p="xl"
								>
									<Title order={3} fz="md" tt="uppercase" mb="xl">
										Finished vs. Unfinished <br />
										(Buildings)
									</Title>
									<Box style={{ width: '100%', height: '150px', overflow: 'hidden' }} mb="md">
										<PieChart
											data={[
												{ name: 'Finished', value: finished, color: 'green.6' },
												{ name: 'Unfinished', value: unfinished, color: 'gray.6' },
											]}
											startAngle={180}
											endAngle={0}
											size={300}
											w="100%"
										/>
									</Box>
									<table style={{ margin: 0, padding: 0 }}>
										<tbody>
											<tr>
												<td>
													<Badge size="lg" color="green" variant="dot" bg="transparent" bd="none">
														Finished
													</Badge>
												</td>
												<td>
													<Code>{formatter.number(finished)}</Code>
												</td>
												<td style={{ fontSize: 'var(--mantine-font-size-xs)' }}>/</td>
												<td>
													<Code>{formatter.number((finished / total) * 100, { maximumFractionDigits: 1 })}%</Code>
												</td>
											</tr>
											<tr>
												<td>
													<Badge size="lg" color="gray" variant="dot" bg="transparent" bd="none">
														Unfinished
													</Badge>
												</td>
												<td>
													<Code>{formatter.number(unfinished)}</Code>
												</td>
												<td style={{ fontSize: 'var(--mantine-font-size-xs)' }}>/</td>
												<td>
													<Code>
														{formatter.number((unfinished / total) * 100, {
															maximumFractionDigits: 1,
														})}
														%
													</Code>
												</td>
											</tr>
										</tbody>
									</table>
								</Box>
							);
						})()}
					</GridCol>
					<GridCol span={10 / 3} offset={1} mt="calc(var(--mantine-spacing-md) * 2)">
						{(() => {
							const total = claims[2]._sum.size || 0;
							const finished = claims[3]._sum.size || 0;
							const unfinished = total - finished;
							return (
								<Box
									style={{
										backgroundColor: 'var(--mantine-color-dark-6)',
										borderRadius: 0,
										boxShadow: 'var(--mantine-shadow-block)',
									}}
									p="xl"
								>
									<Title order={3} fz="md" tt="uppercase" mb="xl">
										Finished vs. Unfinished <br />
										(Area)
									</Title>
									<Box style={{ width: '100%', height: '150px', overflow: 'hidden' }} mb="md">
										<PieChart
											data={[
												{ name: 'Finished', value: finished, color: 'green.6' },
												{ name: 'Unfinished', value: unfinished, color: 'gray.6' },
											]}
											startAngle={180}
											endAngle={0}
											size={300}
											w="100%"
										/>
									</Box>
									<table style={{ margin: 0, padding: 0 }}>
										<tbody>
											<tr>
												<td>
													<Badge size="lg" color="green" variant="dot" bg="transparent" bd="none">
														Finished
													</Badge>
												</td>
												<td>
													<Code>
														{formatter.number(finished / 1000000, { maximumFractionDigits: 3 })} km<sup>2</sup>
													</Code>
												</td>
												<td style={{ fontSize: 'var(--mantine-font-size-xs)' }}>/</td>
												<td>
													<Code>{formatter.number((finished / total) * 100, { maximumFractionDigits: 1 })}%</Code>
												</td>
											</tr>
											<tr>
												<td>
													<Badge size="lg" color="gray" variant="dot" bg="transparent" bd="none">
														Unfinished
													</Badge>
												</td>
												<td>
													<Code>
														{formatter.number(unfinished / 1000000, { maximumFractionDigits: 3 })} km<sup>2</sup>
													</Code>
												</td>
												<td style={{ fontSize: 'var(--mantine-font-size-xs)' }}>/</td>
												<td>
													<Code>
														{formatter.number((unfinished / total) * 100, {
															maximumFractionDigits: 1,
														})}
														%
													</Code>
												</td>
											</tr>
										</tbody>
									</table>
								</Box>
							);
						})()}
					</GridCol>

					<GridCol span={12} mt="calc(var(--mantine-spacing-xl) * 2)">
						<Box
							style={{
								backgroundColor: 'var(--mantine-color-dark-6)',
								borderRadius: 0,
								boxShadow: 'var(--mantine-shadow-block)',
								display: 'flex',
							}}
							p="xl"
						>
							<Box
								style={{
									flex: 1,
								}}
								mr="md"
							>
								<Text fz={36} lh={1} fw={700} mb="md">
									{formatter.number(claims[5]._sum.buildings || 0)}
								</Text>
								<Text tt="uppercase" fw={700}>
									Total Buildings
								</Text>
								<Text c="dimmed" fz="sm" mt={5}>
									haven been created.
								</Text>
							</Box>
							<Box
								style={{
									flex: 1,
								}}
								mr="md"
							>
								<Text fz={36} lh={1} fw={700} mb="md">
									{formatter.number(claims[1]._sum.buildings || 0)}
								</Text>
								<Text tt="uppercase" fw={700}>
									Active Buildings
								</Text>
								<Text c="dimmed" fz="sm" mt={5}>
									are currently visible on our map.
								</Text>
							</Box>
							<Box
								style={{
									flex: 1,
								}}
							>
								<Text fz={36} lh={1} fw={700} mb="md">
									{formatter.number(counts[2]._sum.buildings || 0)}
								</Text>
								<Text tt="uppercase" fw={700}>
									Finished Buildings
								</Text>
								<Text c="dimmed" fz="sm" mt={5}>
									have already been fully built.
								</Text>
							</Box>
							<Box
								style={{
									flex: 1,
								}}
								ml="md"
							>
								<Text fz={36} lh={1} fw={700} mb="md">
									{formatter.number((claims[1]._sum.buildings || 0) - (counts[2]._sum.buildings || 0))}
								</Text>
								<Text tt="uppercase" fw={700}>
									Unfinished Buildings
								</Text>
								<Text c="dimmed" fz="sm" mt={5}>
									are still under construction.
								</Text>
							</Box>
						</Box>
					</GridCol>

					<GridCol span={10 / 3} mt="calc(var(--mantine-spacing-md) * 2)">
						<Box
							style={{
								backgroundColor: 'var(--mantine-color-dark-6)',
								borderRadius: 0,
								boxShadow: 'var(--mantine-shadow-block)',
							}}
							p="xl"
						>
							<Text fz={36} lh={1} fw={700} mb="md">
								{formatter.number((claims[6]._sum.size || 0) / 1000000, { maximumFractionDigits: 3 })} km<sup>2</sup>
							</Text>
							<Text tt="uppercase" fw={700}>
								Total Area
							</Text>
						</Box>
					</GridCol>
					<GridCol span={10 / 3} offset={1} mt="calc(var(--mantine-spacing-md) * 2)">
						<Box
							style={{
								backgroundColor: 'var(--mantine-color-dark-6)',
								borderRadius: 0,
								boxShadow: 'var(--mantine-shadow-block)',
							}}
							p="xl"
						>
							<Text fz={36} lh={1} fw={700} mb="md">
								{formatter.number((claims[2]._sum.size || 0) / 1000000, { maximumFractionDigits: 3 })} km<sup>2</sup>
							</Text>
							<Text tt="uppercase" fw={700}>
								Active Area
							</Text>
						</Box>
					</GridCol>
					<GridCol span={10 / 3} offset={1} mt="calc(var(--mantine-spacing-md) * 2)">
						<Box
							style={{
								backgroundColor: 'var(--mantine-color-dark-6)',
								borderRadius: 0,
								boxShadow: 'var(--mantine-shadow-block)',
							}}
							p="xl"
						>
							<Text fz={36} lh={1} fw={700} mb="md">
								{formatter.number((claims[3]._sum.size || 0) / 1000000, { maximumFractionDigits: 3 })} km<sup>2</sup>
							</Text>
							<Text tt="uppercase" fw={700}>
								Finished Area
							</Text>
						</Box>
					</GridCol>

					<GridCol span={12}>
						<Title order={3} mt="calc(var(--mantine-spacing-xl) * 2)">
							Leaderboard
						</Title>
					</GridCol>

					<GridCol span={5.5} mt="calc(var(--mantine-spacing-md) * 2)">
						{(() => {
							let data: { [key: string]: number | string }[] = [{ name: '' }];
							const colors = ['pink', 'violet', 'blue', 'teal', 'orange'];

							leaderboard[0].forEach((claim) => {
								data[0][claim.name] = claim.buildings;
							});

							return (
								<Box
									style={{
										backgroundColor: 'var(--mantine-color-dark-6)',
										borderRadius: 0,
										boxShadow: 'var(--mantine-shadow-block)',
									}}
									p="xl"
								>
									<Title order={3} fz="md" tt="uppercase" mb="xl">
										Largest Finished Claim <br />
										(By Buildings)
									</Title>
									<BarChart
										h={300}
										data={data}
										dataKey="name"
										series={leaderboard[0].map((c, i) => ({ name: c.name, color: colors[i] + '.6' }))}
										tickLine="y"
										withTooltip={false}
									></BarChart>
									<table style={{ margin: 0, padding: 0, width: '100%' }}>
										<tbody>
											{leaderboard[0].map((claim, i) => (
												<tr key={i}>
													<td>
														<Badge size="lg" color={colors[i]} variant="dot" bg="transparent" bd="none">
															{claim.name} {claim.city && `(${claim.city})`}
														</Badge>
													</td>
													<td>
														<Code>{formatter.number(claim.buildings)}</Code>
													</td>
													<td style={{ fontSize: 'var(--mantine-font-size-xs)' }}>/</td>
													<td>
														<Code>{i + 1}.</Code>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</Box>
							);
						})()}
					</GridCol>
					<GridCol span={5.5} offset={1} mt="calc(var(--mantine-spacing-md) * 2)">
						{(() => {
							let data: { [key: string]: number | string }[] = [{ name: '' }];
							const colors = ['pink', 'violet', 'blue', 'teal', 'orange'];

							leaderboard[1].forEach((claim) => {
								data[0][claim.name] = claim.size;
							});

							return (
								<Box
									style={{
										backgroundColor: 'var(--mantine-color-dark-6)',
										borderRadius: 0,
										boxShadow: 'var(--mantine-shadow-block)',
									}}
									p="xl"
								>
									<Title order={3} fz="md" tt="uppercase" mb="xl">
										Largest Finished Claim <br />
										(By Area)
									</Title>
									<BarChart
										h={300}
										data={data}
										dataKey="name"
										series={leaderboard[1].map((c, i) => ({ name: c.name, color: colors[i] + '.6' }))}
										withTooltip={false}
									></BarChart>
									<table style={{ margin: 0, padding: 0, width: '100%' }}>
										<tbody>
											{leaderboard[1].map((claim, i) => (
												<tr key={i}>
													<td>
														<Badge size="lg" color={colors[i]} variant="dot" bg="transparent" bd="none">
															{claim.name} {claim.city && `(${claim.city})`}
														</Badge>
													</td>
													<td>
														<Code>
															{formatter.number(claim.size / 1000000, {
																maximumFractionDigits: 3,
																minimumFractionDigits: 3,
															})}{' '}
															km<sup>2</sup>
														</Code>
													</td>
													<td style={{ fontSize: 'var(--mantine-font-size-xs)' }}>/</td>
													<td>
														<Code>{i + 1}.</Code>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</Box>
							);
						})()}
					</GridCol>

					<GridCol span={12} mt="calc(var(--mantine-spacing-md) * 2)">
						{(() => {
							let data: { [key: string]: number | string }[] = [{ name: '' }];
							const colors = ['pink', 'violet', 'blue', 'teal', 'lime', 'yellow', 'orange'];

							leaderboard[2].forEach((user) => {
								data[0][user.username || ''] = user._count.claims;
							});

							return (
								<Box
									style={{
										backgroundColor: 'var(--mantine-color-dark-6)',
										borderRadius: 0,
										boxShadow: 'var(--mantine-shadow-block)',
									}}
									p="xl"
								>
									<Title order={3} fz="md" tt="uppercase" mb="xl">
										Most Claims <br />
										(By User)
									</Title>
									<BarChart
										h={400}
										data={data}
										dataKey="name"
										series={leaderboard[2].map((u, i) => ({
											name: u.username || '',
											color: colors[i % colors.length] + '.6',
										}))}
										withTooltip={false}
									></BarChart>
									<table style={{ margin: 0, padding: 0, width: '100%' }}>
										<tbody>
											{leaderboard[2].map((user, i) => (
												<tr key={i}>
													<td>
														<Badge size="lg" color={colors[i % colors.length]} variant="dot" bg="transparent" bd="none">
															{user.username}
														</Badge>
													</td>
													<td>
														<Code>{formatter.number(user._count.claims)}</Code>
													</td>
													<td style={{ fontSize: 'var(--mantine-font-size-xs)' }}>/</td>
													<td>
														<Code>{i + 1}.</Code>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</Box>
							);
						})()}
					</GridCol>
					<GridCol span={12} mt="calc(var(--mantine-spacing-md) * 2)">
						{(() => {
							let data: { [key: string]: number | string }[] = [{ name: '' }];
							const colors = ['pink', 'violet', 'blue', 'teal', 'lime', 'yellow', 'orange'];

							leaderboard[3].forEach((bt) => {
								data[0][bt.name || ''] = bt._count.claims;
							});

							return (
								<Box
									style={{
										backgroundColor: 'var(--mantine-color-dark-6)',
										borderRadius: 0,
										boxShadow: 'var(--mantine-shadow-block)',
									}}
									p="xl"
								>
									<Title order={3} fz="md" tt="uppercase" mb="xl">
										Most Claims <br />
										(By BuildTeam)
									</Title>
									<BarChart
										h={400}
										data={data}
										dataKey="name"
										series={leaderboard[3].map((bt, i) => ({
											name: bt.name || '',
											color: colors[i % colors.length] + '.6',
										}))}
										withTooltip={false}
									></BarChart>
									<table style={{ margin: 0, padding: 0, width: '100%' }}>
										<tbody>
											{leaderboard[3].map((bt, i) => (
												<tr key={i}>
													<td>
														<Badge size="lg" color={colors[i % colors.length]} variant="dot" bg="transparent" bd="none">
															{bt.name}
														</Badge>
													</td>
													<td>
														<Code>{formatter.number(bt._count.claims)}</Code>
													</td>
													<td style={{ fontSize: 'var(--mantine-font-size-xs)' }}>/</td>
													<td>
														<Code>{i + 1}.</Code>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</Box>
							);
						})()}
					</GridCol>

					<GridCol span={12}>
						<Title order={2} mt="calc(var(--mantine-spacing-xl) * 3)">
							BuildTeams
						</Title>
						<div className="heading-underline" />
					</GridCol>

					<GridCol span={12} mt="calc(var(--mantine-spacing-md) * 2)">
						{(() => {
							let data: { [key: string]: number | string }[] = [{ name: '' }];
							const colors = ['pink', 'violet', 'blue', 'teal', 'lime', 'yellow', 'orange'];

							buildTeams[0].forEach((bt) => {
								data[0][bt.name || ''] = bt._count.members;
							});

							return (
								<Box
									style={{
										backgroundColor: 'var(--mantine-color-dark-6)',
										borderRadius: 0,
										boxShadow: 'var(--mantine-shadow-block)',
									}}
									p="xl"
								>
									<Title order={3} fz="md" tt="uppercase" mb="xl">
										Most Claims <br />
										(By BuildTeam)
									</Title>
									<BarChart
										h={400}
										data={data}
										dataKey="name"
										series={buildTeams[0].map((bt, i) => ({
											name: bt.name || '',
											color: bt.color,
										}))}
										withTooltip={false}
									/>
									<table style={{ margin: 0, padding: 0, width: '100%' }}>
										<tbody>
											{buildTeams[0].map((bt, i) => (
												<tr key={i}>
													<td>
														<Badge size="lg" color={bt.color} variant="dot" bg="transparent" bd="none">
															{bt.name}
														</Badge>
													</td>
													<td>
														<Code>{formatter.number(bt._count.members)}</Code>
													</td>
													<td style={{ fontSize: 'var(--mantine-font-size-xs)' }}>/</td>
													<td>
														<Code>{i + 1}.</Code>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</Box>
							);
						})()}
					</GridCol>
				</Grid>
			</Container>
		</Wrapper>
	);
}
