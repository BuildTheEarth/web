import { Metadata } from 'next';

export const metadata: Metadata = {
	title: {
		default: 'Administration',
		template: '%s | Admininistration | MyBuildTheEarth',
	},
	robots: {
		index: false,
		follow: false,
		nocache: true,
	},
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
	return children;
}
