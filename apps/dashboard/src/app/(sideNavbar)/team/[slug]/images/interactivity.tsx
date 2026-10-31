'use client'

import { createShowcase, editShowcase } from '@/actions/showcases'
import { Button, FileInput, Group, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { closeAllModals, openModal } from '@mantine/modals'
import { showNotification } from '@mantine/notifications'
import { IconUpload } from '@tabler/icons-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { ShowcaseRow } from './datatable'

const onError = (e: Error) => showNotification({ title: 'Error', message: e.message, color: 'red' })

function UploadForm({ slug }: { slug: string }) {
	const router = useRouter()
	const [loading, setLoading] = useState(false)
	const form = useForm<{ image: File | null; title: string; city: string }>({
		initialValues: { image: null, title: '', city: '' },
		validate: {
			image: (v) => (v ? null : 'Select an image'),
			title: (v) => (v.trim() ? null : 'A title is required'),
		},
	})

	return (
		<form
			onSubmit={form.onSubmit(async (values) => {
				setLoading(true)
				const data = new FormData()
				data.set('image', values.image!)
				data.set('title', values.title)
				data.set('city', values.city)
				await createShowcase(slug, data)
					.then(() => {
						closeAllModals()
						showNotification({
							title: 'Image Uploaded',
							message: 'The image will be shown on the website once it has been approved.',
							color: 'green',
						})
						router.refresh()
					})
					.catch(onError)
					.finally(() => setLoading(false))
			})}
		>
			<FileInput
				label="Image"
				placeholder="Select an image (PNG, JPEG, WebP, max. 10MB)"
				accept="image/png,image/jpeg,image/webp"
				required
				{...form.getInputProps('image')}
			/>
			<TextInput label="Title" mt="md" required {...form.getInputProps('title')} />
			<TextInput label="City" mt="md" {...form.getInputProps('city')} />
			<Group justify="end" mt="lg">
				<Button type="submit" color="green" loading={loading}>
					Upload
				</Button>
				<Button variant="default" onClick={() => closeAllModals()}>
					Cancel
				</Button>
			</Group>
		</form>
	)
}

export function UploadShowcaseButton({ slug }: { slug: string }) {
	return (
		<Button
			color="green"
			leftSection={<IconUpload size={14} />}
			onClick={() =>
				openModal({ title: 'Upload Showcase Image', centered: true, children: <UploadForm slug={slug} /> })
			}
		>
			Upload Image
		</Button>
	)
}

function EditForm({ slug, showcase, onDone }: { slug: string; showcase: ShowcaseRow; onDone: () => void }) {
	const [loading, setLoading] = useState(false)
	const form = useForm({
		initialValues: { title: showcase.title, city: showcase.city },
		validate: { title: (v: string) => (v.trim() ? null : 'A title is required') },
	})

	return (
		<form
			onSubmit={form.onSubmit(async (values) => {
				setLoading(true)
				await editShowcase(slug, showcase.id, values)
					.then(() => {
						closeAllModals()
						onDone()
					})
					.catch(onError)
					.finally(() => setLoading(false))
			})}
		>
			<TextInput label="Title" required {...form.getInputProps('title')} />
			<TextInput label="City" mt="md" {...form.getInputProps('city')} />
			<Group justify="end" mt="lg">
				<Button type="submit" color="green" loading={loading}>
					Save
				</Button>
				<Button variant="default" onClick={() => closeAllModals()}>
					Cancel
				</Button>
			</Group>
		</form>
	)
}

export function openEditShowcaseModal(slug: string, showcase: ShowcaseRow, onDone: () => void) {
	openModal({
		title: 'Edit Showcase Image',
		centered: true,
		children: <EditForm slug={slug} showcase={showcase} onDone={onDone} />,
	})
}
