import { deleteClaim, saveAdvancedClaim, transferClaim } from '@/actions/claimEditor';
import { modals } from '@mantine/modals';
import { showNotification, updateNotification } from '@mantine/notifications';
import { Prisma } from '@repo/db';
import { IconCheck, IconX } from '@tabler/icons-react';
import { redirect } from 'next/navigation';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export type AdvancedClaimEditorClaim = Prisma.ClaimGetPayload<{
	include: {
		owner: { select: { ssoId: true; username: true; id: true } };
		builders: { select: { ssoId: true; username: true; id: true } };
		buildTeam: { select: { id: true; slug: true; name: true; icon: true } };
	};
}>;
interface ClaimEditorState {
	claim: AdvancedClaimEditorClaim | null;
	// The user ID of the current user
	userId: string | null;
	// Whether the claim editor is dirty (unsaved changes)
	isDirty: boolean;
	// Whether the claim editor is loading
	isLoading: boolean;
	// Any error message
	error: string | null;
	// Update the selected claim information and set the editor to dirty
	updateClaim: (claim: Partial<Omit<AdvancedClaimEditorClaim, 'id'>>) => void;
	setClaim: (claim: AdvancedClaimEditorClaim | null) => void;
	// Save the changes of the current claim only if the editor is dirty
	saveChanges: () => void;
	// Transfer ownership of the claim to a new user
	transferOwnership: (newOwner: { id: string; username: string }) => void;
	// Delete the currently selected claim
	delete: () => void;
	// Set the user ID of the current user
	setUserId: (userId: string | null) => void;
	// Set the editor to dirty once changes are made
	setDirty: (dirty: boolean) => void;
	// Set the loading state
	setLoading: (loading: boolean) => void;
	// Set potential error messages
	setError: (error: string | null) => void;
}

export const useAdvancedClaimEditorStore = create<ClaimEditorState>()(
	subscribeWithSelector((set, get) => ({
		claim: null,
		isDirty: false,
		isLoading: false,
		error: null,
		userId: null,

		updateClaim: (claim) => {
			const c = get().claim;
			if (!c) {
				return;
			}
			const updatedClaim = {
				...c,
				...claim,
			};
			set({ claim: updatedClaim, isDirty: true });
		},

		saveChanges: async () => {
			const claim = get().claim;
			const userId = get().userId;

			if (claim && userId) {
				set({ isLoading: true });

				const notifyId = showNotification({
					title: 'Saving Changes',
					loading: true,
					autoClose: false,
					withCloseButton: false,
					color: 'blue',
					message: 'Your changes are being saved...',
				});

				try {
					if (get().isDirty) {
						await saveAdvancedClaim({
							userId,
							id: claim.id,
							name: claim.name ?? undefined,
							description: claim.description ?? undefined,
							city: claim.city ?? undefined,
							active: claim.active ?? undefined,
							finished: claim.finished ?? undefined,
							builders: claim.builders?.map((b) => ({ id: b.id })) || [],
						});
					}

					updateNotification({
						id: notifyId,
						title: 'Changes Saved',
						message: 'Your claim has been successfully saved.',
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

		transferOwnership: async (newOwner: { id: string; username: string }) => {
			const claim = get().claim;
			if (!claim || get().userId == null) {
				showNotification({
					title: 'No Claim selected',
					message: 'Please select a claim to delete.',
					color: 'red',
				});
				return;
			}

			const confirmTransfer = async () =>
				new Promise<boolean>((resolve) => {
					modals.openConfirmModal({
						title: 'Transfer Claim',
						centered: true,
						children: `Are you sure you want to transfer the claim "${claim.name}" to ${newOwner.username}? This action cannot be undone.`,
						labels: { confirm: 'Transfer', cancel: 'Cancel' },
						onConfirm: () => resolve(true),
						onCancel: () => resolve(false),
						closeOnConfirm: true,
						closeOnCancel: true,
						onClose: () => resolve(false),
					});
				});

			const confirmed = await confirmTransfer();

			if (!confirmed) {
				return;
			}

			set({ isLoading: true });
			const notifyId = showNotification({
				title: 'Transferring Claim',
				loading: true,
				autoClose: false,
				withCloseButton: false,
				color: 'blue',
				message: 'Your claim is being transferred...',
			});

			try {
				await transferClaim({ userId: get().userId || 'xxx', id: claim.id, newUserId: newOwner.id });
				updateNotification({
					id: notifyId,
					title: 'Claim Transferred',
					message: 'Your claim has been successfully transferred.',
					color: 'green',
					loading: false,
					autoClose: 2000,
					icon: <IconCheck size={18} />,
				});

				set({ claim: null, isDirty: false, isLoading: false });
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
			} finally {
				set({ isLoading: false });
				redirect('/editor');
			}
		},

		delete: async () => {
			const claim = get().claim;
			if (!claim || get().userId == null) {
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
						children: `Are you sure you want to delete the claim "${claim.name}"? This action cannot be undone.`,
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
				await deleteClaim({ userId: get().userId || 'xxx', id: claim.id });
				updateNotification({
					id: notifyId,
					title: 'Claim Deleted',
					message: 'Your claim has been successfully deleted.',
					color: 'green',
					loading: false,
					autoClose: 2000,
					icon: <IconCheck size={18} />,
				});

				set({ claim: null, isDirty: false, isLoading: false });
				redirect('/editor');
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

		setDirty: (dirty) => set({ isDirty: dirty }),
		setLoading: (loading) => set({ isLoading: loading }),
		setError: (error) => set({ error }),
		setUserId: (userId) => set({ userId }),
		setClaim: (claim) => set({ claim }),
	})),
);
