import { useTransition } from 'react';

/**
 * Creates a form action with support of a loading state.
 * @param action A React Server Action
 * @returns A tuple of a boolean that represents the status of the action's execution and an action that will execute
 */
export function useFormAction(action: (...data: any[]) => Promise<any>): [(...data: any[]) => Promise<void>, boolean] {
	const [isPending, startTransition] = useTransition();

	const actionWithStatus = async (...data: any[]) => {
		startTransition(async () => {
			await action(...data);
		});
	};

	return [actionWithStatus, isPending];
}

/**
 * Creates multiple form actions with support of a single loading state.
 * @param actions A Array of React Server Actions
 * @returns A tuple of a boolean that represents the status of the action's execution and an array of actions that will execute
 */
export function useFormActions(
	actions: Array<(...data: any[]) => Promise<any>>,
): [Array<(...data: any[]) => Promise<void>>, boolean] {
	const [isPending, startTransition] = useTransition();

	const actionsWithStatus = actions.map((action) => async (...data: any[]) => {
		startTransition(async () => {
			await action(...data);
		});
	});

	return [actionsWithStatus, isPending];
}
