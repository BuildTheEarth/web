import AppLayout from '@/components/layout';
import { getSession } from '@/util/auth';
import prisma from '@/util/db';
import { Metadata } from 'next';
import EditorNavbar from './navbar';

export const metadata: Metadata = {
	title: 'Claim Editor',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
	const session = await getSession();
	const claims = (
		await prisma.claim.findMany({
			where: { owner: { ssoId: session?.user.id } },
			include: { images: { select: { src: true } } },
		})
	).map((c) => ({ ...c, imgSrc: c.images[0]?.src, images: undefined }));
	return (
		<AppLayout hideNavbar customNavbar={<EditorNavbar claims={claims} />} p={0}>
			{children}
		</AppLayout>
	);
}
