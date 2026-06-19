'use client'

/* eslint-disable react-hooks/exhaustive-deps */
import { Link, RichTextEditor as MRichTextEditor } from '@mantine/tiptap'
import { useEffect } from 'react'

import Highlight from '@tiptap/extension-highlight'
import SubScript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import { useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

export default function RichTextEditor({
	value,
	onChange,
	onClick,
	style,
}: {
	value?: string
	onChange?: (e: string) => void
	onClick?: (e: any) => void
	style?: any
}) {
	const editor = useEditor({
		extensions: [
			StarterKit,
			Underline,
			Link,
			Superscript,
			SubScript,
			Highlight,
			TextAlign.configure({ types: ['heading', 'paragraph'] }),
		],
		content: value,
		onUpdate: (e) => {
			onChange && onChange(e.editor.getHTML())
			onClick && onClick(e)
		},
		immediatelyRender: false,
	})

	useEffect(() => {
		editor?.setOptions({ content: value })
	}, [value])

	return (
		<MRichTextEditor editor={editor} styles={style}>
			<MRichTextEditor.Toolbar>
				<MRichTextEditor.ControlsGroup>
					<MRichTextEditor.Bold />
					<MRichTextEditor.Italic />
					<MRichTextEditor.Underline />
					<MRichTextEditor.Strikethrough />
					<MRichTextEditor.ClearFormatting />
					{/* <MRichTextEditor.Highlight /> */}
					<MRichTextEditor.Code />
				</MRichTextEditor.ControlsGroup>

				<MRichTextEditor.ControlsGroup>
					<MRichTextEditor.Link />
					<MRichTextEditor.Unlink />
				</MRichTextEditor.ControlsGroup>

				<MRichTextEditor.ControlsGroup>
					<MRichTextEditor.H1 />
					<MRichTextEditor.H2 />
					<MRichTextEditor.H3 />
					<MRichTextEditor.H4 />
				</MRichTextEditor.ControlsGroup>

				<MRichTextEditor.ControlsGroup>
					<MRichTextEditor.Blockquote />
					<MRichTextEditor.Hr />
					<MRichTextEditor.BulletList />
					<MRichTextEditor.OrderedList />
					{/* <MRichTextEditor.Subscript />
					<MRichTextEditor.Superscript /> */}
				</MRichTextEditor.ControlsGroup>
			</MRichTextEditor.Toolbar>

			<MRichTextEditor.Content />
		</MRichTextEditor>
	)
}
