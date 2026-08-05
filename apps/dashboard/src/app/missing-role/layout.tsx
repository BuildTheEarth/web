import { Metadata } from 'next'

export const metadata: Metadata = {
	title: 'Missing Role',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
	return children
}
