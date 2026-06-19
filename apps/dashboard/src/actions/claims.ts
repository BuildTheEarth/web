'use server'
import { getSession, hasRole } from '@/util/auth'
import prisma from '@/util/db'
import { revalidatePath } from 'next/cache'

export const adminChangeTeam = async (data: { claimId: string; teamId: string }) => {
	const session = await getSession()
	if (!hasRole(session, 'edit-claims')) {
		throw new Error('Unauthorized')
	}

	console.log('changeTeam', data)
	const claim = await prisma.claim.update({
		where: {
			id: data.claimId,
		},
		data: {
			buildTeam: { connect: { id: data.teamId } },
		},
	})

	revalidatePath(`/am/claims/${claim.id}`)
	return claim
}

export const adminDeleteClaim = async (data: { claimId: string }) => {
	const session = await getSession()
	if (!hasRole(session, 'edit-claims')) {
		throw new Error('Unauthorized')
	}

	const claim = await prisma.claim.delete({
		where: {
			id: data.claimId,
		},
	})

	revalidatePath(`/am/claims/${claim.id}`)

	return claim
}
