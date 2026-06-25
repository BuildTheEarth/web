/**
 * These links are used for navigation between tool pages
 */
export const navLinks: NavLink[] = [
	{
		link: '/',
		label: 'My Home',
		icon: 'Home',
	},
	{
		link: '/editor',
		label: 'Claim Editor',
		icon: 'Polygon',
	},
	{
		link: '/me/teams',
		label: 'Participating Teams',
		icon: 'UsersGroup',
	},
	{
		link: '/me/applications',
		label: 'Your Applications',
		icon: 'Forms',
	},
	// ---- BuildTeam Specific ----
	{
		link: '',
		label: 'Your BuildTeams',
		icon: null,
		divider: true,
		teamPermission: 'get-teams',
	},
	{
		link: '/team/[team_slug]',
		label: 'Info Overview',
		icon: 'FileInfo',
		teamPermission: 'get-team',
	},
	{
		link: '/team/[team_slug]/questions',
		label: 'Application Questions',
		icon: 'Send',
		teamPermission: 'get-team-questions',
	},
	{
		link: '/team/[team_slug]/applications',
		label: 'Applications',
		icon: 'Search',
		teamPermission: 'review-team',
	},
	{
		link: '/team/[team_slug]/claims',
		label: 'Claims',
		icon: 'Polygon',
		teamPermission: 'review-team',
	},
	{
		link: '/team/[team_slug]/members',
		label: 'Members',
		icon: 'UsersGroup',
		teamPermission: 'get-team-members',
	},
	// ---- Staff Links ----
	{
		link: '',
		label: 'Staff Hub',
		icon: null,
		permission: 'bte_staff',
		divider: true,
	},
	{
		link: '/am/faq',
		label: 'FAQ',
		permission: 'get-faq',
		icon: 'Bubble',
	},
	{
		link: '/am/claims',
		label: 'Claims',
		permission: 'get-claims',
		icon: 'Polygon',
	},
	{
		link: '/am/applications',
		label: 'Applications',
		permission: 'get-applications',
		icon: 'Forms',
	},
	{
		link: '/am/users',
		label: 'Website Users',
		permission: 'get-users',
		icon: 'UsersGroup',
	},
	{
		link: '/am/teams',
		label: 'Build Teams',
		permission: 'get-teams',
		icon: 'UsersGroup',
	},
	{
		link: '/am/contacts',
		label: 'Contacts',
		permission: 'get-config',
		icon: 'Mail',
	},
	{
		link: '/am/uploads',
		label: 'Uploads',
		permission: 'get-config',
		icon: 'Upload',
	},
	{
		link: '/am/sso',
		label: 'SSO Configuration',
		permission: 'get-config',
		icon: 'Settings',
	},
]

/**
 * Converts a NavLink array to an array of href links
 * @param links Links to convert to blank links
 * @returns a array of only the href itself
 */
export function toBlankLink(links: NavLink[]): string[] {
	return links.filter((l) => !l.divider).map((link) => link.link)
}

type NavLink = {
	link: string
	label: string
	icon: any
	permission?: string
	teamPermission?: string
	divider?: boolean
}
