import {
	createClaim as createClaimAction,
	deleteClaim as deleteClaimAction,
	getPersonalClaims,
	saveClaim as saveClaimAction,
} from '@/actions/claimEditor'
import { modals } from '@mantine/modals'
import { showNotification, updateNotification } from '@mantine/notifications'
import { IconCheck, IconX } from '@tabler/icons-react'
import { TerraDraw } from 'terra-draw'
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { CreateClaimModal } from './interactivity'

export type ClaimEditorClaim = Awaited<ReturnType<typeof getPersonalClaims>>[0]

function ensureClosedCoordinates(coords: number[][]): number[][] {
	if (!coords || coords.length === 0) return coords
	const first = coords[0]
	const last = coords[coords.length - 1]
	if (first[0] !== last[0] || first[1] !== last[1]) {
		return [...coords, [first[0], first[1]]]
	}
	return coords
}

interface ClaimEditorState {
	drawInstance: TerraDraw | null
	selectedClaimId: string | null
	coordinates: [number, number] | null
	claims: ClaimEditorClaim[]
	isInitialized: boolean
	allowedBuildTeamIds: string[] | null
	userId: string | null
	isDirty: boolean
	isLoading: boolean

	setDrawInstance: (drawInstance: TerraDraw | null) => void
	setClaims: (claims: ClaimEditorClaim[]) => void
	setAllowedBuildTeamIds: (allowedBuildTeamIds: string[] | null) => void
	setUserId: (userId: string | null) => void
	setSelectedClaim: (
		claimId: string | null,
		opts?: { keepPosition?: boolean; fromMapClick?: boolean; feature?: any },
	) => boolean
	switchClaim: (
		claimId: string | null,
		opts?: { keepPosition?: boolean; fromMapClick?: boolean; feature?: any },
	) => Promise<boolean>
	updateClaimGeometry: (area: string[]) => void
	saveGeometry: () => Promise<void>
	updateClaimDetails: (data: {
		name?: string
		description?: string
		city?: string
		active?: boolean
		finished?: boolean
	}) => Promise<void>
	createClaim: (data: {
		id: string
		area: string[]
		buildTeamId: string
		name?: string
		description?: string
		city?: string
	}) => Promise<void>
	deleteSelectedClaim: () => Promise<void>
	onShapeDrawn: (featureId: string) => void
}

export const useClaimEditorStore = create<ClaimEditorState>()(
	subscribeWithSelector((set, get) => ({
		drawInstance: null,
		selectedClaimId: null,
		coordinates: null,
		claims: [],
		isInitialized: false,
		allowedBuildTeamIds: null,
		userId: null,
		isDirty: false,
		isLoading: false,

		setDrawInstance: (drawInstance) => set({ drawInstance }),
		setClaims: (claims) => set({ claims, isInitialized: true }),
		setAllowedBuildTeamIds: (allowedBuildTeamIds) => set({ allowedBuildTeamIds }),
		setUserId: (userId) => set({ userId }),

		setSelectedClaim: (claimId, opts) => {
			const draw = get().drawInstance
			if (!draw) return false

			const prevSelectedId = get().selectedClaimId
			if (prevSelectedId && prevSelectedId !== claimId && draw.hasFeature(prevSelectedId)) {
				try {
					draw.removeFeatures([prevSelectedId])
				} catch (e) {
					console.warn(e)
				}
			}

			if (!claimId) {
				set({ selectedClaimId: null, isDirty: false, coordinates: null })
				return true
			}

			const claim = get().claims.find((c) => c.id === claimId)
			let feature = draw.hasFeature(claimId) ? draw.getSnapshotFeature(claimId) : null

			if (!feature) {
				if (opts?.feature) {
					let geom = opts.feature.geometry
					if (geom && geom.type === 'Polygon' && geom.coordinates?.[0]) {
						geom = {
							...geom,
							coordinates: [ensureClosedCoordinates(geom.coordinates[0])],
						}
					}
					const f = {
						...opts.feature,
						id: claimId,
						geometry: geom,
						properties: {
							...opts.feature.properties,
							id: claimId,
							mode: 'polygon',
						},
					}
					draw.addFeatures([f])
					feature = draw.hasFeature(claimId) ? draw.getSnapshotFeature(claimId) : null
				} else if (claim && claim.area && claim.area.length >= 3) {
					const coords = ensureClosedCoordinates(claim.area.map((str: string) => str.split(', ').map(Number)))
					const f = {
						id: claimId,
						type: 'Feature' as const,
						geometry: {
							type: 'Polygon' as const,
							coordinates: [coords],
						},
						properties: {
							id: claimId,
							name: claim.name,
							finished: claim.finished,
							active: claim.active,
							mode: 'polygon',
						},
					}
					draw.addFeatures([f])
					feature = draw.hasFeature(claimId) ? draw.getSnapshotFeature(claimId) : null
				}
			}

			const userId = get().userId
			const props = (feature?.properties || {}) as Record<string, any>
			const isOwner =
				(userId && (props.owner?.ssoId === userId || props.owner?.id === userId)) ||
				Boolean(claim) ||
				props.new === true

			if (isOwner) {
				let centerCoords: [number, number] | null = null
				if (claim?.center) {
					centerCoords = claim.center.split(', ').map(Number) as [number, number]
				} else if (props.center && typeof props.center === 'string') {
					centerCoords = props.center.split(', ').map(Number) as [number, number]
				} else if (feature?.geometry && feature.geometry.type === 'Polygon' && feature.geometry.coordinates?.[0]?.[0]) {
					const first = feature.geometry.coordinates[0][0]
					centerCoords = [first[0], first[1]]
				}

				set({
					selectedClaimId: claimId,
					isDirty: false, // Initially false when selecting
					coordinates: opts?.keepPosition ? get().coordinates : centerCoords,
				})

				if (draw.hasFeature(claimId)) {
					try {
						if (draw.getMode() !== 'select') {
							draw.setMode('select')
						}
						draw.selectFeature(claimId)
					} catch (e) {
						console.warn('Failed to select feature in TerraDraw:', e)
					}
				}
				return true
			} else {
				if (feature && draw.hasFeature(claimId)) {
					draw.removeFeatures([claimId])
				}
				showNotification({
					title: 'Permission Denied',
					message: 'You do not have permission to edit this claim.',
					color: 'red',
				})
				return false
			}
		},

		switchClaim: async (claimId, opts) => {
			const currentSelected = get().selectedClaimId
			if (claimId === currentSelected) return true

			const draw = get().drawInstance
			const currentFeature =
				draw && currentSelected && draw.hasFeature(currentSelected) ? draw.getSnapshotFeature(currentSelected) : null
			const isCurrentNew = currentFeature?.properties?.new === true

			if (!currentSelected || isCurrentNew) {
				if (
					isCurrentNew &&
					claimId !== currentSelected &&
					draw &&
					currentSelected &&
					draw.hasFeature(currentSelected)
				) {
					draw.removeFeatures([currentSelected])
				}
				return get().setSelectedClaim(claimId, opts)
			}

			if (get().isDirty) {
				return new Promise<boolean>((resolve) => {
					modals.openConfirmModal({
						title: 'Unsaved Changes',
						children: 'You have unsaved changes to this claim boundary. Do you want to save them before switching?',
						labels: { confirm: 'Save', cancel: 'Discard' },
						onConfirm: async () => {
							await get().saveGeometry()
							resolve(get().setSelectedClaim(claimId, opts))
						},
						onCancel: () => {
							// Discard unsaved changes by clearing feature from draw so it will reload cleanly
							if (draw && currentSelected && draw.hasFeature(currentSelected)) {
								draw.removeFeatures([currentSelected])
							}
							set({ isDirty: false })
							resolve(get().setSelectedClaim(claimId, opts))
						},
						closeOnConfirm: true,
						closeOnCancel: true,
					})
				})
			}

			return get().setSelectedClaim(claimId, opts)
		},

		updateClaimGeometry: (area: string[]) => {
			const id = get().selectedClaimId
			if (id) {
				set({ isDirty: true })
			}
		},

		saveGeometry: async () => {
			const draw = get().drawInstance
			const id = get().selectedClaimId
			if (!draw || !id || !get().isDirty) return

			if (!draw.hasFeature(id)) return
			const feature = draw.getSnapshotFeature(id)
			if (!feature) return

			const props = (feature.properties || {}) as Record<string, any>
			const area =
				feature.geometry?.type === 'Polygon'
					? feature.geometry.coordinates[0].map((c: any) => `${c[0]}, ${c[1]}`)
					: (props.area as string[]) || []

			set({ isLoading: true })
			const notifyId = showNotification({
				title: 'Saving Area',
				loading: true,
				autoClose: false,
				withCloseButton: false,
				color: 'blue',
				message: 'Saving updated claim boundaries...',
			})

			try {
				await saveClaimAction({ id, area })

				// Update personal claims in store with new area
				const updatedClaims = await getPersonalClaims()
				set({ claims: updatedClaims, isDirty: false })

				updateNotification({
					id: notifyId,
					title: 'Area Saved',
					message: 'Claim boundaries have been successfully saved.',
					color: 'green',
					loading: false,
					autoClose: 2000,
					icon: <IconCheck size={18} />,
				})
			} catch (e) {
				updateNotification({
					id: notifyId,
					title: 'Error',
					message: `${e instanceof Error ? e.message : 'Failed to save claim'}`,
					color: 'red',
					loading: false,
					autoClose: 5000,
					icon: <IconX size={18} />,
				})
			} finally {
				set({ isLoading: false })
			}
		},

		updateClaimDetails: async (data) => {
			const id = get().selectedClaimId
			const draw = get().drawInstance
			if (!id) return

			set({ isLoading: true })
			const notifyId = showNotification({
				title: 'Saving Details',
				loading: true,
				autoClose: false,
				withCloseButton: false,
				color: 'blue',
				message: 'Updating claim information...',
			})

			try {
				await saveClaimAction({ id, ...data })

				if (draw && draw.hasFeature(id)) {
					draw.updateFeatureProperties(id, {
						...(data.name !== undefined ? { name: data.name } : {}),
						...(data.city !== undefined ? { city: data.city } : {}),
						...(data.description !== undefined ? { description: data.description } : {}),
						...(data.active !== undefined ? { active: data.active } : {}),
						...(data.finished !== undefined ? { finished: data.finished } : {}),
					})
				}

				const updatedClaims = await getPersonalClaims()
				set({ claims: updatedClaims })

				updateNotification({
					id: notifyId,
					title: 'Claim Updated',
					message: 'Claim details have been updated.',
					color: 'green',
					loading: false,
					autoClose: 2000,
					icon: <IconCheck size={18} />,
				})
			} catch (e) {
				updateNotification({
					id: notifyId,
					title: 'Error',
					message: `${e instanceof Error ? e.message : 'Failed to update claim'}`,
					color: 'red',
					loading: false,
					autoClose: 5000,
					icon: <IconX size={18} />,
				})
			} finally {
				set({ isLoading: false })
			}
		},

		createClaim: async (data) => {
			const draw = get().drawInstance
			if (!draw) return

			set({ isLoading: true })
			const notifyId = showNotification({
				title: 'Creating Claim',
				loading: true,
				autoClose: false,
				withCloseButton: false,
				color: 'blue',
				message: 'Creating claim...',
			})

			try {
				await createClaimAction(data)

				if (draw.hasFeature(data.id)) {
					draw.updateFeatureProperties(data.id, {
						new: false,
						...(data.name ? { name: data.name } : {}),
					})
				}

				const updatedClaims = await getPersonalClaims()
				set({ claims: updatedClaims, isDirty: false, selectedClaimId: data.id })

				if (draw.hasFeature(data.id)) {
					try {
						if (draw.getMode() !== 'select') {
							draw.setMode('select')
						}
						draw.selectFeature(data.id)
					} catch (e) {
						console.warn(e)
					}
				}

				updateNotification({
					id: notifyId,
					title: 'Claim Created',
					message: 'Your claim has been created successfully.',
					color: 'green',
					loading: false,
					autoClose: 2000,
					icon: <IconCheck size={18} />,
				})
			} catch (e) {
				updateNotification({
					id: notifyId,
					title: 'Error',
					message: `${e instanceof Error ? e.message : 'Failed to create claim'}`,
					color: 'red',
					loading: false,
					autoClose: 5000,
					icon: <IconX size={18} />,
				})
			} finally {
				set({ isLoading: false })
			}
		},

		deleteSelectedClaim: async () => {
			const draw = get().drawInstance
			const id = get().selectedClaimId
			if (!draw || !id) return

			const feature = draw.hasFeature(id) ? draw.getSnapshotFeature(id) : null
			const claim = get().claims.find((c) => c.id === id)
			const claimName = (feature?.properties?.name as string) || claim?.name || 'this claim'

			modals.openConfirmModal({
				title: 'Delete Claim',
				centered: true,
				children: `Are you sure you want to delete the claim "${claimName}"? This action cannot be undone.`,
				labels: { confirm: 'Delete', cancel: 'Cancel' },
				confirmProps: { color: 'red' },
				onConfirm: async () => {
					set({ isLoading: true })
					const notifyId = showNotification({
						title: 'Deleting Claim',
						loading: true,
						autoClose: false,
						withCloseButton: false,
						color: 'blue',
						message: 'Deleting claim...',
					})

					try {
						await deleteClaimAction({ id })

						if (draw.hasFeature(id)) {
							draw.removeFeatures([id])
						}
						try {
							if (draw.getMode() !== 'select') {
								draw.setMode('select')
							}
						} catch (e) {
							console.warn('Error resetting draw mode after delete:', e)
						}
						const updatedClaims = await getPersonalClaims()
						set({ claims: updatedClaims, selectedClaimId: null, isDirty: false })

						updateNotification({
							id: notifyId,
							title: 'Claim Deleted',
							message: 'The claim has been deleted.',
							color: 'green',
							loading: false,
							autoClose: 2000,
							icon: <IconCheck size={18} />,
						})
					} catch (e) {
						updateNotification({
							id: notifyId,
							title: 'Error',
							message: `${e instanceof Error ? e.message : 'Failed to delete claim'}`,
							color: 'red',
							loading: false,
							autoClose: 5000,
							icon: <IconX size={18} />,
						})
					} finally {
						set({ isLoading: false })
					}
				},
			})
		},

		onShapeDrawn: (drawnFeatureId: string) => {
			const draw = get().drawInstance
			if (!draw) return

			const feature = draw.hasFeature(drawnFeatureId) ? draw.getSnapshotFeature(drawnFeatureId) : null
			if (!feature || feature.geometry.type !== 'Polygon') return

			const area = feature.geometry.coordinates[0].map((c: any) => `${c[0]}, ${c[1]}`)
			draw.updateFeatureProperties(drawnFeatureId, {
				new: true,
				area,
			})

			set({ selectedClaimId: drawnFeatureId, isDirty: false })

			const modalId = 'create-claim-modal'
			let completed = false

			modals.open({
				modalId,
				title: 'Create new Claim',
				centered: true,
				closeOnClickOutside: false,
				closeOnEscape: true,
				children: (
					<CreateClaimModal
						allowedBuildTeamIds={get().allowedBuildTeamIds}
						onSubmit={async (formData) => {
							completed = true
							modals.close(modalId)
							await get().createClaim({
								id: drawnFeatureId,
								area,
								buildTeamId: formData.buildTeamId,
								name: formData.name,
								city: formData.city,
								description: formData.description,
							})
						}}
						onCancel={() => {
							completed = true
							modals.close(modalId)
							if (draw.hasFeature(drawnFeatureId)) {
								draw.removeFeatures([drawnFeatureId])
							}
							set({ selectedClaimId: null, isDirty: false })
							try {
								draw.setMode('select')
							} catch (e) {
								console.warn(e)
							}
							showNotification({
								title: 'Cancelled',
								message: 'Claim creation was cancelled.',
								color: 'yellow',
								autoClose: 2000,
							})
						}}
					/>
				),
				onClose: () => {
					if (!completed) {
						if (draw.hasFeature(drawnFeatureId)) {
							draw.removeFeatures([drawnFeatureId])
						}
						set({ selectedClaimId: null, isDirty: false })
						try {
							draw.setMode('select')
						} catch (e) {
							console.warn(e)
						}
					}
				},
			})
		},
	})),
)
