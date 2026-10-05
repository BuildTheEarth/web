import {
	IconBrandDiscord,
	IconBrandFacebook,
	IconBrandInstagram,
	IconBrandLinkedin,
	IconBrandTiktok,
	IconBrandTwitch,
	IconBrandTwitter,
	IconBrandX,
	IconBrandYoutube,
	IconWorld,
} from '@tabler/icons-react'

export function CustomSocialIcon({ icon, ...rest }: { icon: string } & React.ComponentProps<typeof IconBrandDiscord>) {
	switch (icon) {
		case 'discord':
			return <IconBrandDiscord {...rest} />
		case 'website':
			return <IconWorld {...rest} />
		case 'instagram':
			return <IconBrandInstagram {...rest} />
		case 'twitter':
			return <IconBrandTwitter {...rest} />
		case 'x':
			return <IconBrandX {...rest} />
		case 'facebook':
			return <IconBrandFacebook {...rest} />
		case 'linkedin':
			return <IconBrandLinkedin {...rest} />
		case 'youtube':
			return <IconBrandYoutube {...rest} />
		case 'tiktok':
			return <IconBrandTiktok {...rest} />
		case 'twitch':
			return <IconBrandTwitch {...rest} />
		default:
			return <IconWorld {...rest} />
	}
}
