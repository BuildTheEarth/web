import { Button, Menu, MenuProps, Portal } from '@mantine/core';
import React, { useCallback, useEffect, useState } from 'react';

interface ContextMenuInfo {
	x: number;
	y: number;
	opened: boolean;
}

export function useContextMenu({
	disableEventPosition = false,
	offset,
}: {
	disableEventPosition?: boolean;
	offset?: {
		x: number;
		y: number;
	};
}): [ContextMenuInfo, React.Dispatch<React.SetStateAction<ContextMenuInfo>>, React.MouseEventHandler] {
	const [info, setInfo] = useState<ContextMenuInfo>({ x: 0, y: 0, opened: false });

	const contextMenuHandler = useCallback<React.MouseEventHandler>(
		(e) => {
			e.preventDefault();
			if (!disableEventPosition) {
				setInfo({ x: e.clientX + (offset ? offset.x : 0), y: e.clientY + (offset ? offset.y : 0), opened: true });
			} else {
				setInfo({ ...info, opened: true });
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[setInfo, disableEventPosition, info],
	);

	return [info, setInfo, contextMenuHandler];
}

export interface ContextMenuProps extends MenuProps {
	contextMenuInfo: ContextMenuInfo;
	setContextMenuInfo: (i: ContextMenuInfo) => void;
}

export function ContextMenu({ contextMenuInfo, setContextMenuInfo, children, ...other }: ContextMenuProps) {
	const onClose = useCallback(
		() => setContextMenuInfo({ ...contextMenuInfo, opened: false }),
		[contextMenuInfo, setContextMenuInfo],
	);

	const [opened, setOpened] = useState<boolean>(false);

	useEffect(() => setOpened(contextMenuInfo.opened), [contextMenuInfo.opened]);

	return (
		<Menu
			{...other}
			opened={opened}
			onClose={onClose}
			offset={0}
			middlewares={{ shift: true, flip: false }}
			styles={{ dropdown: { zIndex: 999 } }}
			position="right-start"
		>
			<Portal>
				<Menu.Target>
					<Button
						unstyled
						loading={false}
						style={{
							position: 'absolute',
							width: 0,
							height: 0,
							padding: 0,
							border: 0,
							left: contextMenuInfo.x,
							top: contextMenuInfo.y,
							visibility: 'hidden',
						}}
					/>
				</Menu.Target>
				<Menu.Dropdown>{children}</Menu.Dropdown>
			</Portal>
		</Menu>
	);
}
