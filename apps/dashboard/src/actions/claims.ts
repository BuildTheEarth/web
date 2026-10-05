'use server'
import { getSession, hasRole } from '@/util/auth'
import prisma from '@/util/db'
import { revalidatePath } from 'next/cache'

export const adminEditClaim = async (data: {
	id: string
	name?: string
	city?: string | null
	description?: string | null
	size?: number
	buildings?: number
	osmName?: string | null
	externalId?: string | null
	active?: boolean
	finished?: boolean
}) => {
	const session = await getSession()
	if (!hasRole(session, 'edit-claims')) {
		throw new Error('Unauthorized')
	}

	const claim = await prisma.claim.update({
		where: {
			id: data.id,
		},
		data: {
			name: data.name ?? undefined,
			city: data.city || null,
			description: data.description || null,
			size: data.size !== undefined ? Number(data.size) : undefined,
			buildings: data.buildings !== undefined ? Number(data.buildings) : undefined,
			osmName: data.osmName || null,
			externalId: data.externalId || null,
			active: data.active !== undefined ? Boolean(data.active) : undefined,
			finished: data.finished !== undefined ? Boolean(data.finished) : undefined,
		},
	})

	revalidatePath('/am/claims')
	revalidatePath(`/am/claims/${claim.id}`)
	return claim
}

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

	revalidatePath('/am/claims')
	revalidatePath(`/am/claims/${claim.id}`)
	return claim
}

export const adminDeleteClaim = async (data: { claimId: string } | string) => {
	const session = await getSession()
	if (!hasRole(session, 'edit-claims')) {
		throw new Error('Unauthorized')
	}

	const claimId = typeof data === 'string' ? data : data.claimId

	const claim = await prisma.claim.delete({
		where: {
			id: claimId,
		},
	})

	revalidatePath('/am/claims')
	revalidatePath(`/am/claims/${claim.id}`)

	return claim
}
