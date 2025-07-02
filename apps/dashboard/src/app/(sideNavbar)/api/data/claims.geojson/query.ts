export function constructClaimGeoJSONQuery(filters: {
	finished?: boolean;
	active?: boolean;
	user?: string | null;
	extended?: boolean;
	id?: string | null;
}) {
	return {
		where: {
			finished: filters.finished,
			active: filters.active,
			owner: filters.user ? { OR: [{ ssoId: filters.user }, { id: filters.user }] } : undefined,
			id: filters.id ? { in: filters.id.split(',') } : undefined,
		},
		select: filters.extended
			? {
					id: true,
					area: true,
					center: true,
					finished: true,
					active: true,
					owner: {
						select: {
							id: true,
							ssoId: true,
							avatar: true,
							minecraft: true,
							username: true,
						},
					},
					builders: {
						select: {
							id: true,
							avatar: true,
							minecraft: true,
							username: true,
						},
					},
					buildings: true,
					buildTeam: {
						select: { id: true, slug: true, name: true, location: true },
					},
					description: true,
					city: true,
					name: true,
					osmName: true,
					images: {
						select: {
							id: true,
							hash: true,
							name: true,
							createdAt: true,
							height: true,
							width: true,
						},
					},
				}
			: { id: true, area: true, center: true, name: true, owner: { select: { id: true, ssoId: true } } },
	};
}
