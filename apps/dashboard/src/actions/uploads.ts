'use server';
import { getSession, hasRole } from '@/util/auth';
import { revalidateWebsitePath } from '@/util/data';
import prisma from '@/util/db';
import { revalidatePath } from 'next/cache';

export const adminCheckUpload = async (id: string) => {
	const session = await getSession();

	if (!hasRole(session, 'review-uploads')) {
		throw Error('Unauthorized');
	}

	const upload = await prisma.upload.update({
		where: {
			id,
		},
		data: {
			checked: true,
		},
	});

	revalidatePath('/am/uploads/check');
};

export const adminDeleteUpload = async (id: string) => {
	const session = await getSession();

	if (!hasRole(session, 'review-uploads')) {
		throw Error('Unauthorized');
	}

	const upload = await prisma.upload.delete({
		where: {
			id,
		},
	});

	revalidatePath('/am/uploads/check');
	revalidateWebsitePath('/gallery');
};

export const adminApproveShowcase = async (id: string) => {
	const session = await getSession();

	if (!hasRole(session, 'review-uploads')) {
		throw Error('Unauthorized');
	}

	const showcase = await prisma.showcase.update({
		where: {
			id,
		},
		data: {
			approved: true,
		},
	});
};
