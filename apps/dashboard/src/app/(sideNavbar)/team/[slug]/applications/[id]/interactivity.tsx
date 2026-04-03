'use client';
import { addApplicationResponseTemplate, reviewApplication } from '@/actions/buildTeams';
import {
	ActionIcon,
	Button,
	ButtonGroup,
	Group,
	Menu,
	MenuDropdown,
	MenuItem,
	MenuTarget,
	rem,
	Select,
	Text,
	TextInput,
} from '@mantine/core';
import { useClipboard } from '@mantine/hooks';
import { openConfirmModal } from '@mantine/modals';
import { showNotification } from '@mantine/notifications';
import { RichTextEditor, useRichTextEditorContext } from '@mantine/tiptap';
import { Application, ApplicationResponseTemplate, ApplicationStatus } from '@repo/db';
import { IconCheck, IconDots, IconId, IconTemplate, IconX } from '@tabler/icons-react';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import SubScript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Fragment } from 'react';
import { Markdown } from 'tiptap-markdown';

export function EditMenu({ application }: { application: Application }) {
	const clipboard = useClipboard({ timeout: 500 });

	return (
		<Menu>
			<MenuTarget>
				<ActionIcon size="lg" variant="subtle" color="gray" aria-label="More Actions">
					<IconDots style={{ width: '70%', height: '70%' }} stroke={1.5} />
				</ActionIcon>
			</MenuTarget>
			<MenuDropdown>
				<MenuItem
					leftSection={<IconId style={{ width: rem(14), height: rem(14) }} />}
					aria-label="Copy ID"
					onClick={() => clipboard.copy(application.id)}
				>
					Copy ID
				</MenuItem>
			</MenuDropdown>
		</Menu>
	);
}

export function ResponseEditor({
	application,
	templates,
	userId,
	buildTeamSlug,
}: {
	application: Application;
	templates: Omit<Omit<ApplicationResponseTemplate, 'buildteam'>, 'buildteamId'>[];
	userId: string;
	buildTeamSlug: string;
}) {
	const responseEditor = useEditor({
		extensions: [
			StarterKit,
			Underline,
			Link,
			Superscript,
			SubScript,
			Highlight,
			TextAlign.configure({ types: ['heading', 'paragraph'] }),
			Placeholder.configure({ placeholder: 'This is a placeholder' }),
			Markdown,
		],
		immediatelyRender: false,
	});

	return (
		<Fragment key="application-response-editor">
			<RichTextEditor editor={responseEditor} mb="md" mih="200px">
				<RichTextEditor.Toolbar sticky stickyOffset={60}>
					<RichTextEditor.ControlsGroup>
						<InsertReviewTemplateControl templates={templates} />
					</RichTextEditor.ControlsGroup>

					<RichTextEditor.ControlsGroup>
						<RichTextEditor.Bold />
						<RichTextEditor.Italic />
						<RichTextEditor.Underline />
						<RichTextEditor.Strikethrough />
						<RichTextEditor.ClearFormatting />
						<RichTextEditor.Code />
						<RichTextEditor.BulletList />
					</RichTextEditor.ControlsGroup>

					<RichTextEditor.ControlsGroup>
						<RichTextEditor.H1 />
						<RichTextEditor.H2 />
						<RichTextEditor.H3 />
						<RichTextEditor.H4 />
					</RichTextEditor.ControlsGroup>

					<RichTextEditor.ControlsGroup>
						<RichTextEditor.Link />
						<RichTextEditor.Unlink />
					</RichTextEditor.ControlsGroup>

					<RichTextEditor.ControlsGroup>
						<RichTextEditor.Undo />
						<RichTextEditor.Redo />
					</RichTextEditor.ControlsGroup>
				</RichTextEditor.Toolbar>

				<RichTextEditor.Content />
			</RichTextEditor>
			<Group justify="space-between">
				<ButtonGroup>
					<Button
						leftSection={<IconCheck />}
						onClick={() =>
							reviewApplication({
								userId,
								buildTeamSlug,
								applicationId: application.id,
								reason: responseEditor?.storage.markdown.getMarkdown(),
								status: ApplicationStatus.ACCEPTED,
							}).then(() => {
								showNotification({
									message: `Application accepted successfully.`,
									title: 'Application Reviewed',
									color: 'green',
								});
							})
						}
						color="green"
					>
						Accept
					</Button>
					<Button
						leftSection={<IconX />}
						onClick={() =>
							reviewApplication({
								userId,
								buildTeamSlug,
								applicationId: application.id,
								reason: responseEditor?.storage.markdown.getMarkdown(),
								status: ApplicationStatus.DECLINED,
							}).then(() => {
								showNotification({
									message: `Application declined successfully.`,
									title: 'Application Reviewed',
									color: 'green',
								});
							})
						}
						color="red"
					>
						Decline
					</Button>
				</ButtonGroup>
				<Button
					leftSection={<IconTemplate />}
					onClick={() => {
						let name = '';
						openConfirmModal({
							title: 'New Template Response',
							centered: true,
							children: (
								<>
									<Text size="sm">You need to give the template a name to be able to reference it later.</Text>
									<TextInput
										placeholder="My new Template"
										label="Name"
										mt="md"
										onChange={(e) => (name = e.target.value)}
									/>
								</>
							),
							labels: { confirm: 'Create Template', cancel: 'Cancel' },
							onCancel: () =>
								showNotification({
									message: `Template was not declined.`,
									title: 'Cancelled creation',
									color: 'yellow',
								}),
							onConfirm: () =>
								addApplicationResponseTemplate({
									userId,
									buildTeamSlug,
									name,
									content: responseEditor?.getHTML() || '',
								}).then(() => {
									showNotification({
										message: `Template ${name} was created successfully.`,
										title: 'Template Created',
										color: 'green',
									});
								}),
						});
					}}
					variant="outline"
				>
					Save as Template
				</Button>
			</Group>
		</Fragment>
	);
}

function InsertReviewTemplateControl({ templates }: { templates: { name: string; id: string; content: string }[] }) {
	const { editor } = useRichTextEditorContext();
	return (
		<RichTextEditor.Control aria-label="Insert response template" title="Insert response template">
			<Select
				size="xs"
				placeholder="Custom Template"
				variant="unstyled"
				leftSection={<IconTemplate stroke={1.5} size="1rem" />}
				data={[
					{
						group: 'Response Templates',
						items: templates
							.sort((a: any, b: any) => a.name.localeCompare(b.name))
							.map((t) => ({ label: t.name, value: t.id })),
					},
				]}
				onChange={(_value, option) => {
					if (option) {
						editor?.commands.setContent(templates.find((t) => t.id == option.value)?.content || '-');
					} else {
						editor?.commands.setContent('');
					}
				}}
				// renderOption={({ option, checked }) => (
				// 	<Group flex="1" gap="xs">
				// 		{checked && (
				// 			<IconCheck
				// 				style={{ marginInlineStart: 'auto' }}
				// 				stroke={1.5}
				// 				color="currentColor"
				// 				opacity={0.6}
				// 				size={18}
				// 			/>
				// 		)}
				// 		{option && option.label} -d
				// 	</Group>
				// )}
			/>
		</RichTextEditor.Control>
	);
}
