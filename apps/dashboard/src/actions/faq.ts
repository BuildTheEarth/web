'use server';
import { getSession, hasRole } from '@/util/auth';
import { revalidateWebsitePath } from '@/util/data';
import prisma from '@/util/db';
import { revalidatePath } from 'next/cache';

export const adminAddFaqQuestion = async (data: { question: string; answer: string }) => {
	const session = await getSession();
	if (!hasRole(session, 'edit-faq')) {
		throw new Error('Unauthorized');
	}

	const { question, answer } = data;

	const faq = await prisma.fAQQuestion.create({
		data: {
			question,
			answer,
		},
	});

	revalidatePath('/am/faq');
	revalidateWebsitePath('/faq');
	return faq;
};

export const adminEditFaqQuestion = async (data: { question: string; answer: string; id: string }) => {
	const session = await getSession();
	if (!hasRole(session, 'edit-faq')) {
		throw new Error('Unauthorized');
	}

	const faq = await prisma.fAQQuestion.update({
		where: {
			id: data.id,
		},
		data: {
			question: data.question,
			answer: data.answer,
		},
	});

	revalidatePath('/am/faq');
	revalidateWebsitePath('/faq');
	return faq;
};

export const adminDeleteFaqQuestion = async (id: any) => {
	const session = await getSession();
	if (!hasRole(session, 'edit-faq')) {
		throw new Error('Unauthorized');
	}

	const faq = await prisma.fAQQuestion.delete({
		where: {
			id,
		},
	});

	revalidatePath('/am/faq');
	revalidateWebsitePath('/faq');
	return faq;
};
