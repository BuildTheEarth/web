import { createClaim, deleteClaim, getPersonalClaims, saveClaim } from '@/actions/claimEditor';
import { modals } from '@mantine/modals';
import { showNotification, updateNotification } from '@mantine/notifications';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { IconCheck, IconX } from '@tabler/icons-react';
import {
	SnapDirectSelect,
	SnapLineMode,
	SnapModeDrawStyles,
	SnapPointMode,
	SnapPolygonMode,
} from 'mapbox-gl-draw-snap-mode';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { SelectBuildTeamModal } from './interactivity';

type ClaimEditorClaim = Awaited<ReturnType<typeof getPersonalClaims>>[0];
interface ClaimEditorState {
	// Draw instance
	drawInstance?: any;
	// The currently selected claim ID
	selectedClaimId: string | null;
	// Coordinates to zoom into (center of claim)
	coordinates: [number, number] | null;
	// All claims of the current user
	claims: ClaimEditorClaim[];
	// Allowed build team IDs for the current user
	allowedBuildTeamIds?: string[] | null;
	// The user ID of the current user
	userId: string | null;
	// Whether the claim editor is dirty (unsaved changes)
	isDirty: boolean;
	// Whether the claim editor is loading
	isLoading: boolean;
	// Any error message
	error: string | null;
	// Set the selected claim by ID (uses Draw feature properties)
	setSelectedClaim: (claimId: string | null, opts?: { keepPosition?: boolean }) => boolean;
	// Change the selected claim and ask for confirmation if the editor is dirty
	switchClaim: (claimId: string | null, opts?: { keepPosition?: boolean }) => Promise<boolean>;
	// Update the selected claim information and set the editor to dirty
	updateClaim: (claim: Partial<Omit<ClaimEditorClaim, 'id'>>) => void;
	// Save the changes of the current claim only if the editor is dirty
	saveChanges: () => void;
	// Create a new claim shell (empty claim) and set the draw mode to true
	createClaimShell: (feature: any) => void;
	// Set the draw instance (used for drawing new claims)
	setDrawInstance: (drawInstance: any) => void;
	// Delete the currently selected claim
	delete: () => void;
	// Set the claims of the current user
	setClaims: (claims: ClaimEditorClaim[]) => void;
	// Set the allowed build team IDs for the current user
	setAllowedBuildTeamIds: (allowedBuildTeamIds: string[] | null) => void;
	// Set the user ID of the current user
	setUserId: (userId: string | null) => void;
	// Set the editor to dirty once changes are made
	setDirty: (dirty: boolean) => void;
	// Set the loading state
	setLoading: (loading: boolean) => void;
	// Set potential error messages
	setError: (error: string | null) => void;
}

export const useClaimEditorStore = create<ClaimEditorState>()(
	subscribeWithSelector((set, get) => ({
		drawInstance: new MapboxDraw({
			displayControlsDefault: false,
			modes: {
				...MapboxDraw.modes,
				draw_point: SnapPointMode,
				draw_polygon: SnapPolygonMode,
				draw_line_string: SnapLineMode,
				direct_select: SnapDirectSelect,
			},
			// Styling guides
			styles: SnapModeDrawStyles,
			userProperties: true, //@ts-ignore
			snap: false,
			snapOptions: {
				snapPx: 20,
				snapToMidPoints: false,
				snapVertexPriorityDistance: 0.0025,
			},
			guides: false,
		}),
		selectedClaimId: null,
		coordinates: null,
		claims: [],
		userId: null,
		isDirty: false,
		isLoading: false,
		error: null,

		setSelectedClaim: (claimId, opts) => {
			const draw = get().drawInstance;
			if (!draw) return false;
			if (!claimId) {
				set({ selectedClaimId: null, isDirty: false, coordinates: null });
				return true;
			}

			const feature = draw.get(claimId);
			const claim = get().claims.find((c) => c.id === claimId);

			if (claim || feature.properties?.new == true) {
				set({
					selectedClaimId: claimId,
					isDirty: feature.properties?.new == true ? true : false,
					coordinates: opts?.keepPosition
						? undefined
						: (() => {
								return claim && claim.center ? (claim.center.split(', ').map(Number) as [number, number]) : null;
							})(),
				});
				draw.changeMode('simple_select', { featureIds: [claimId] });
				return true;
			} else {
				showNotification({
					title: 'Claim not found',
					message: 'The claim you are trying to edit does not exist.',
					color: 'red',
				});
				return false;
			}
		},
		switchClaim: (claimId, opts) => {
			return new Promise<boolean>((resolve) => {
				if (claimId == get().selectedClaimId) return resolve(true);
				if (get().isDirty) {
					modals.openConfirmModal({
						title: 'Unsaved Changes',
						children: 'You have unsaved changes. Do you want to save them before switching?',
						labels: { confirm: 'Save', cancel: 'Discard' },
						onConfirm: () => {
							get().saveChanges();
							resolve(get().setSelectedClaim(claimId, opts));
						},
						onCancel: () => {
							resolve(get().setSelectedClaim(claimId, opts));
						},
						closeOnConfirm: true,
						closeOnCancel: true,
					});
				} else {
					resolve(get().setSelectedClaim(claimId, opts));
				}
			});
		},

		updateClaim: (claim) => {
			const draw = get().drawInstance;
			const id = get().selectedClaimId;
			if (draw && id) {
				Object.entries(claim).forEach(([key, value]) => {
					draw.setFeatureProperty(id, key, value);
				});
				set({ isDirty: true });
			}
		},

		saveChanges: async () => {
			const draw = get().drawInstance;
			const id = get().selectedClaimId;
			const userId = get().userId;

			if (draw && id && userId && get().isDirty) {
				set({ isLoading: true });
				get().updateClaim;
				const feature = draw.get(id);
				const props = feature?.properties || {};
				const isNew = props.new == true;

				const notifyId = showNotification({
					title: isNew ? 'Creating Claim' : 'Saving Changes',
					loading: true,
					autoClose: false,
					withCloseButton: false,
					color: 'blue',
					message: isNew ? 'Your claim is being created...' : 'Your changes are being saved...',
				});

				try {
					if (isNew) {
						const selectBuildTeam = async () =>
							new Promise<string | false>((resolve) => {
								modals.open({
									title: 'Create new Claim',
									centered: true,
									children: (
										<SelectBuildTeamModal
											allowedBuildTeamIds={get().allowedBuildTeamIds}
											continue={(result) => {
												modals.closeAll();
												resolve(result);
											}}
										/>
									),
									onClose: () => resolve(false),
								});
							});

						const buildTeamId = await selectBuildTeam();

						if (buildTeamId === false) {
							updateNotification({
								id: notifyId,
								title: 'Cancelled',
								message: 'Claim creation was cancelled.',
								color: 'yellow',
								loading: false,
								autoClose: 2000,
								icon: <IconX size={18} />,
							});
							set({ isLoading: false });
							return;
						}

						await createClaim({
							id,
							userId,
							area: props.area,
							buildTeamId: buildTeamId,
						});
					} else {
						await saveClaim({
							id,
							userId,
							area: props.area,
						});
					}

					updateNotification({
						id: notifyId,
						title: isNew ? 'Claim Created' : 'Changes Saved',
						message: isNew ? 'Your claim has been created.' : 'Your claim has been successfully saved.',
						color: 'green',
						loading: false,
						autoClose: 2000,
						icon: <IconCheck size={18} />,
					});

					set({ isDirty: false });
				} catch (e) {
					updateNotification({
						id: notifyId,
						title: 'Error',
						message: `${e instanceof Error ? e.message : 'Unknown error'}`,
						color: 'red',
						loading: false,
						autoClose: 5000,
						icon: <IconX size={18} />,
					});
				}
				set({ isLoading: false });
			} else {
				showNotification({
					title: 'No Claim selected',
					message: 'Please select a claim to save changes.',
					color: 'red',
				});
			}
		},

		delete: async () => {
			const draw = get().drawInstance;
			const id = get().selectedClaimId;
			if (!id || get().userId == null) {
				showNotification({
					title: 'No Claim selected',
					message: 'Please select a claim to delete.',
					color: 'red',
				});
				return;
			}

			const confirmDeletion = async () =>
				new Promise<boolean>((resolve) => {
					modals.openConfirmModal({
						title: 'Delete Claim',
						centered: true,
						children: `Are you sure you want to delete the claim "${
							draw.get(id).properties.name
						}"? This action cannot be undone.`,
						labels: { confirm: 'Delete', cancel: 'Cancel' },
						onConfirm: () => resolve(true),
						onCancel: () => resolve(false),
						closeOnConfirm: true,
						closeOnCancel: true,
						onClose: () => resolve(false),
					});
				});

			const confirmed = await confirmDeletion();

			if (!confirmed) {
				showNotification({
					title: 'Deletion Cancelled',
					message: 'The claim deletion was cancelled.',
					color: 'yellow',
				});
				return;
			}

			set({ isLoading: true });
			const notifyId = showNotification({
				title: 'Deleting Claim',
				loading: true,
				autoClose: false,
				withCloseButton: false,
				color: 'blue',
				message: 'Your claim is being deleted...',
			});

			try {
				await deleteClaim({ userId: get().userId || 'xxx', id });
				updateNotification({
					id: notifyId,
					title: 'Claim Deleted',
					message: 'Your claim has been successfully deleted.',
					color: 'green',
					loading: false,
					autoClose: 2000,
					icon: <IconCheck size={18} />,
				});

				set({ isDirty: false, selectedClaimId: null });
				draw.delete(id);
			} catch (e) {
				updateNotification({
					id: notifyId,
					title: 'Error',
					message: `${e instanceof Error ? e.message : 'Unknown error'}`,
					color: 'red',
					loading: false,
					autoClose: 5000,
					icon: <IconX size={18} />,
				});
			}
			set({ isLoading: false });
		},

		createClaimShell: (feature: any) => {
			const uuid = crypto.randomUUID();
			const draw = get().drawInstance;
			if (!draw) return;

			// Clone the feature and assign the new UUID as its id
			const newFeature = {
				...feature,
				id: uuid,
				properties: {
					...feature.properties,
					id: uuid,
					new: true,
					area: feature.geometry.coordinates[0].map((c: [number, number]) => c.join(', ')),
				},
			};

			draw.add(newFeature);
			draw.delete(feature.id);
		},
		setDrawInstance: (drawInstance) => set({ drawInstance }),
		setAllowedBuildTeamIds: (allowedBuildTeamIds) => set({ allowedBuildTeamIds }),
		setClaims: (claims) => set({ claims }),
		setUserId: (userId) => set({ userId }),
		setDirty: (dirty) => set({ isDirty: dirty }),
		setLoading: (loading) => set({ isLoading: loading }),
		setError: (error) => set({ error }),
	})),
);
