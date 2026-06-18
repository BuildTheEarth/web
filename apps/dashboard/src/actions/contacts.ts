'use server';
import { getSession, hasRole } from '@/util/auth';
import { revalidateWebsitePath } from '@/util/data';
import prisma from '@/util/db';
import { revalidatePath } from 'next/cache';

export const adminAddContact = async (data: { name: string; role: string; email: string; discord: string }) => {
	const session = await getSession();
	if (!hasRole(session, 'edit-contacts')) {
		throw new Error('Unauthorized');
	}

	const contact = await prisma.contact.create({
		data,
	});

	revalidatePath('/am/contacts');
	revalidateWebsitePath('/contact');
	return contact;
};

export const adminEditContact = async (data: {
	id: string;
	name: string;
	role: string;
	email: string;
	discord: string;
}) => {
	const session = await getSession();
	if (!hasRole(session, 'edit-contacts')) {
		throw new Error('Unauthorized');
	}

	const contact = await prisma.contact.update({
		where: {
			id: data.id,
		},
		data: {
			name: data.name,
			role: data.role,
			email: data.email,
			discord: data.discord,
		},
	});

	revalidatePath('/am/contacts');
	revalidateWebsitePath('/contact');
	return contact;
};

export const adminDeleteContact = async (id: any) => {
	const session = await getSession();
	if (!hasRole(session, 'edit-contacts')) {
		throw new Error('Unauthorized');
	}

	const contact = await prisma.contact.delete({
		where: {
			id,
		},
	});

	revalidatePath('/am/contacts');
	revalidateWebsitePath('/contact');
	return contact;
};
