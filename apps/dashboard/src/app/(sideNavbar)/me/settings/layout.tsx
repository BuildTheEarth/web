import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Profile Settings',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
	return children;
}
