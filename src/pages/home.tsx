import Header from '@/components/v2/header';
import { BackgroundImage } from '@mantine/core';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

const Home = () => {
	return (
		<>
			<Header
				links={[
					{ link: '/gallery', translation: 'gallery' },
					{ link: '/teams', translation: 'teams' },
					{ link: '/map', translation: 'map' },
					{ link: '/faq', translation: 'faq' },
					{ link: '/contact', translation: 'contact' },
				]}
			/>
			<div
				style={{ background: 'var(--mantine-color-dark-5)', width: '100vw', minHeight: '100vh' }}
			>
				<BackgroundImage src={'./home.jpg'} w={'100vw'} h={'100vh'}>
					<div
						style={{
							background: 'linear-gradient(0deg, rgba(0,0,0,0) 60%, rgba(0,0,0,0.6) 100%)',
							width: '100%',
							height: '100%',
						}}
					>
						dw
					</div>
				</BackgroundImage>
				dd1
				<br />
				dd2
				<br />
				dd3
				<br />
				dd4
				<br />
				dd5
				<br />
				dd6
				<br />
				dd7
				<br />
				dd8
				<br />
				dd9
				<br />
				dd1
				<br />
				dd2
				<br />
				dd3
				<br />
				dd4
				<br />
				dd5
				<br />
				dd6
				<br />
				dd7
				<br />
				dd8
				<br />
				dd9
				<br />
				dd1
				<br />
				dd2
				<br />
				dd3
				<br />
				dd4
				<br />
				dd5
				<br />
				dd6
				<br />
				dd7
				<br />
				dd8
				<br />
				dd9
				<br />
				dd1
				<br />
				dd2
				<br />
				dd3
				<br />
				dd4
				<br />
				dd5
				<br />
				dd6
				<br />
				dd7
				<br />
				dd8
				<br />
				dd9
				<br />
				dd1
				<br />
				dd2
				<br />
				dd3
				<br />
				dd4
				<br />
				dd5
				<br />
				dd6
				<br />
				dd7
				<br />
				dd8
				<br />
				dd9
				<br />
				dd1
				<br />
				dd2
				<br />
				dd3
				<br />
				dd4
				<br />
				dd5
				<br />
				dd6
				<br />
				dd7
				<br />
				dd8
				<br />
				dd9
				<br />
				<br />
			</div>
		</>
	);
};

export default Home;

export async function getStaticProps({ locale }: any) {
	return {
		props: {
			...(await serverSideTranslations(locale, ['common'])),
		},
	};
}
