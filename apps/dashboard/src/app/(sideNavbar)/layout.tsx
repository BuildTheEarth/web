import AppLayout from '@/components/layout';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
	return <AppLayout>{children}</AppLayout>;
}
