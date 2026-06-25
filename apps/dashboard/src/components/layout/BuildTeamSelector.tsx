'use client'

import { BuildTeamDisplay } from '@/components/data/BuildTeam'
import useSelectableBuildTeams from '@/hooks/useBuildTeamData'
import {
	Box,
	Combobox,
	ComboboxDropdown,
	ComboboxOption,
	ComboboxOptions,
	ComboboxTarget,
	Divider,
	Group,
	InputBase,
	InputPlaceholder,
	Text,
	useCombobox,
} from '@mantine/core'
import { IconSelector } from '@tabler/icons-react'

const BuildTeamSelector = () => {
	const [buildteams, activeBuildTeam, selectBuildTeam] = useSelectableBuildTeams()
	const combobox = useCombobox({
		onDropdownClose: () => combobox.resetSelectedOption(),
	})

	const options = buildteams.map((team) => (
		<ComboboxOption value={team.id} key={team.id} py="xs">
			<BuildTeamDisplay team={team} noAnchor />
		</ComboboxOption>
	))

	if (buildteams.length === 0) return null

	return (
		<>
			<Combobox
				store={combobox}
				withinPortal={false}
				onOptionSubmit={(val) => {
					selectBuildTeam(val)
					combobox.closeDropdown()
				}}
			>
				<ComboboxTarget>
					<InputBase
						component="button"
						style={{
							display: 'block',
							padding: 'var(--mantine-spacing-md)',
							borderBottom: ' 1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))',
						}}
						type="button"
						pointer
						onClick={() => combobox.toggleDropdown()}
						rightSectionPointerEvents="none"
						rightSection={''}
						multiline
						variant="unstyled"
					>
						{activeBuildTeam ? (
							// <Box py="xs">
							<BuildTeamDisplay team={activeBuildTeam} noAnchor />
						) : (
							// </Box>
							<InputPlaceholder>
								{' '}
								<Group>
									<div style={{ flex: 1 }}>
										<Text size="sm" fw={500}>
											Select BuildTeam
										</Text>
									</div>

									<IconSelector size={14} stroke={1.5} />
								</Group>
							</InputPlaceholder>
						)}
					</InputBase>
				</ComboboxTarget>

				<ComboboxDropdown>
					<ComboboxOptions>{options}</ComboboxOptions>
				</ComboboxDropdown>
			</Combobox>
			<Divider orientation="vertical" />
		</>
	)
}

export default BuildTeamSelector
