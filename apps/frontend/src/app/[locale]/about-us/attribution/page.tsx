import { QuerySearchInput } from '@/components/core/SearchInput';
import Wrapper from '@/components/layout/Wrapper';
import prisma from '@/util/db';
import { getLanguageAlternates } from '@/util/seo';
import {
	Accordion,
	AccordionControl,
	AccordionItem,
	AccordionPanel,
	Alert,
	Group,
	List,
	ListItem,
	Text,
	Title,
} from '@mantine/core';
import { IconLanguage } from '@tabler/icons-react';
import { Metadata } from 'next';
import { Locale } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';

export const dynamic = 'force-static';

// export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
// 	const locale = (await params).locale;
// 	const t = (await getTranslations({ locale, namespace: 'faq.seo' })) as (key: 'title' | 'description') => string;

// 	return { title: t('title'), description: t('description'), alternates: { languages: getLanguageAlternates('/faq') } };
// }

export default async function Page({ params }: { params: Promise<{ locale: Locale }> }) {
	const locale = (await params).locale;
	setRequestLocale(locale);
	const t = await getTranslations('attribution');

	const tMessages = await getMessages();
	const keys = Object.keys(tMessages.attribution.translations) as (keyof typeof tMessages.attribution.translations)[];

	return (
		<Wrapper offsetHeader={false} head={{ title: 'Public Attributions', src: '/placeholders/home.png' }}>
			<Title order={2} mb="md">
				Datasets and Tools
			</Title>
			<Text mb="sm">
				The terrain generation of TerraPlusPlus and TerraPlusMinus uses elecation, landcover and building data from the
				following sources:
			</Text>
			<List>
				<ListItem>
					<Text>
						<b>Elevation Data</b>: AWS Open Data Terrain Tiles, Maa-amet, eVode, swisstopo, Europe Open Data, INGV, IGN
						Géoservices, CNIG Centro de Descargas,
					</Text>
				</ListItem>
				<ListItem>
					<Text>
						<b>Landcover Data</b>: Copernicus
					</Text>
				</ListItem>

				<ListItem>
					<Text>
						<b>Building Data</b>: OpenStreetMap contributors
					</Text>
				</ListItem>
			</List>
			<Text mt="md">
				Note that specific software might use additional or different datasets. The providers listed above are the ones
				used for the main terrain generation of TerraPlusPlus and are subject to change. Source which require specific
				attribution are properly attributed in the software itself or on the pages of the Build Teams using their data.
			</Text>

			<Title order={2} mb="md" mt="lg">
				Development Work
			</Title>

			<Text mb="sm">
				BuildTheEarth would not exist without people dedicating their time to create software that makes our project
				possible. As this list is very long, please check the corresponding repositories for up-to-date lists of
				contributors.
				<br />
				Below, we would like to highlight some of the key contributors to the project.
			</Text>
			<List>
				<ListItem>
					<Text>
						<b>noahhusby</b>: TerraBungee, Sledgehammer, and overall project management
					</Text>
				</ListItem>
				<ListItem>
					<Text>
						<b>Daniel &quot;daan&quot; Streebe</b>: Custom Projection Implementation
					</Text>
				</ListItem>
				<ListItem>
					<Text>
						<b>DaPorkchop_</b>: TerraPlusPlus, CubicChunks, Dataset Hosting
					</Text>
				</ListItem>
				<ListItem>
					<Text>
						<b>cAttte</b>: Discord Bot
					</Text>
				</ListItem>
				<ListItem>
					<Text>
						<b>SmylerMC</b>: TerraPlusPlus, Terramap, Sledgehammer
					</Text>
				</ListItem>
				<ListItem>
					<Text>
						<b>Xesau</b>: BuildTheEarth Website
					</Text>
				</ListItem>
			</List>

			<Title order={3} mt="md">
				BuildTheEarth Website
			</Title>

			<Text mb="sm">The development of this website has been made possible by the following contributors:</Text>
			<List>
				<ListItem>
					<Text>
						<b>nudlsupp</b>: Lead Developer
					</Text>
				</ListItem>
				<ListItem>
					<Text>
						<b>Nachwahl</b>: Backend Implementation
					</Text>
				</ListItem>
				<ListItem>
					<Text>
						<b>ElijahPepe</b>: UI/UX Design
					</Text>
				</ListItem>
				<ListItem>
					<Text>
						<b>XboxBedrock</b>: Deployment
					</Text>
				</ListItem>
				<ListItem>
					<Text>
						<b>Cinnazeyy</b>: Initial Concept and Design
					</Text>
				</ListItem>
				<ListItem>
					<Text>
						<b>Coppertine</b>: Initial Core Structure
					</Text>
				</ListItem>
			</List>
			<Text mt="md" mb="sm">
				We would also like to thank all the people who have contributed to the project through providing translations.
				For your selected language, the following people have contributed translations:
			</Text>
			<List>
				{keys.map((k) => (
					<ListItem key={k as string}>
						<Text>
							<b>{t(`translations.${k as string}`)}</b>
						</Text>
					</ListItem>
				))}
			</List>

			<Title order={2} mb="md" mt="lg">
				Graphic Design
			</Title>

			<Text mb="sm">
				We would like to thank the following people for their contributions to the graphic design of BuildTheEarth:
			</Text>
			<List>
				<ListItem>
					<Text>
						<b>dimaxxing</b>: BuildTheEarth logo, emojis, icons and other designs
					</Text>
				</ListItem>
				<ListItem>
					<Text>
						<b>olivephio</b>: BuildTheEarth logo + variations, BTE Hug, icons and other designs
					</Text>
				</ListItem>
				<ListItem>
					<Text>
						<b>madconcepts</b>: Early BuildTheEarth logo
					</Text>
				</ListItem>
			</List>
		</Wrapper>
	);
}
