'use client';

import { BuildTeamDisplay } from '@/components/data/BuildTeam';
import useSelectableBuildTeams from '@/hooks/useBuildTeamData';
import {
	Box,
	Combobox,
	ComboboxDropdown,
	ComboboxOption,
	ComboboxOptions,
	ComboboxTarget,
	Divider,
	InputBase,
	InputPlaceholder,
	useCombobox,
} from '@mantine/core';

interface BuildTeamOption {
	id: string;
	slug: string;
	name: string;
	icon: string;
}

const HeaderBuildTeamSelector = () => {
	const [buildteams, activeBuildTeam, selectBuildTeam] = useSelectableBuildTeams();
	const combobox = useCombobox({
		onDropdownClose: () => combobox.resetSelectedOption(),
	});

	const options = buildteams.map((team) => (
		<ComboboxOption value={team.id} key={team.id} py="xs">
			<BuildTeamDisplay team={team} noAnchor />
		</ComboboxOption>
	));

	if (!activeBuildTeam) return null;

	return (
		<>
			<Combobox
				store={combobox}
				withinPortal={false}
				onOptionSubmit={(val) => {
					selectBuildTeam(val);
					combobox.closeDropdown();
				}}
			>
				<ComboboxTarget>
					<InputBase
						component="button"
						type="button"
						pointer
						rightSection={<Combobox.Chevron />}
						onClick={() => combobox.toggleDropdown()}
						rightSectionPointerEvents="none"
						multiline
						variant="unstyled"
					>
						{activeBuildTeam ? (
							<Box py="xs">
								<BuildTeamDisplay team={activeBuildTeam} noAnchor />
							</Box>
						) : (
							<InputPlaceholder>Pick value</InputPlaceholder>
						)}
					</InputBase>
				</ComboboxTarget>

				<ComboboxDropdown>
					<ComboboxOptions>{options}</ComboboxOptions>
				</ComboboxDropdown>
			</Combobox>
			<Divider orientation="vertical" />
		</>
	);
};

export default HeaderBuildTeamSelector;
