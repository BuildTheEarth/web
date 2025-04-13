'use server';
import { revalidateWebsitePath } from '@/util/data';
import prisma from '@/util/db';
import { revalidatePath } from 'next/cache';

export const adminAddFaqQuestion = async (data: { question: string; answer: string }) => {
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
	const faq = await prisma.fAQQuestion.delete({
		where: {
			id,
		},
	});

	revalidatePath('/am/faq');
	revalidateWebsitePath('/faq');
	return faq;
};
