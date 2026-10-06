import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@repo/db';
import { PrismaService } from 'src/common/db/prisma.service';
import { FilterParams } from 'src/common/decorators/filter.decorator';
import { PaginationParams } from 'src/common/decorators/pagination.decorator';
import { SortingParams } from 'src/common/decorators/sorting.decorator';
import { WorkerJob } from 'src/common/queue/jobs';
import { QueueService } from 'src/common/queue/queue.service';
import { UpdateBuildTeamDto } from './dto/update.buildteam.dto';

/**
 * Every column of a build team except `token` and `webhook`.
 *
 * `token` is the client secret a team exchanges for an access token, and
 * `webhook` is a URL anyone who had it could post to, so neither may ever reach
 * a public response. They are left out here rather than deleted from the result
 * afterwards, so a column added to the model later has to be listed on purpose
 * before it becomes public.
 */
const PUBLIC_SELECT = {
	id: true,
	name: true,
	icon: true,
	backgroundImage: true,
	invite: true,
	about: true,
	creatorId: true,
	createdAt: true,
	location: true,
	slug: true,
	ip: true,
	acceptionMessage: true,
	rejectionMessage: true,
	trialMessage: true,
	allowTrial: true,
	allowBuilderClaim: true,
	allowApplications: true,
	instantAccept: true,
	version: true,
	color: true,
} as const;

/** The columns the Minecraft modpack needs, and nothing else. */
const MODPACK_SELECT = {
	id: true,
	name: true,
	ip: true,
	version: true,
	invite: true,
} as const;

/** How many members, showcases and claims a team has. */
const COUNT_SELECT = { select: { members: true, showcases: true, claims: true } } as const;

/**
 * The frontend pages that show a team, as they appear in the Next.js router.
 * `[team]` is replaced with the team's slug before the paths are handed to the
 * worker. Mirrors the `/teams` group v1 revalidated on a team update.
 */
const TEAM_PAGES = [
	'/teams',
	'/teams/[team]',
	'/teams/[team]/apply',
	'/teams/[team]/manage/apply',
	'/teams/[team]/manage/images',
	'/teams/[team]/manage/members',
	'/teams/[team]/manage/review',
	'/teams/[team]/manage/settings',
];

/** Prisma's error code for a unique constraint violation. */
const UNIQUE_VIOLATION = 'P2002';

@Injectable()
export class BuildTeamsService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly queue: QueueService,
	) {}

	/**
	 * Finds build teams based on pagination, sorting and filtering parameters.
	 * @param pagination Pagination parameters.
	 * @param sortBy Field to sort by, or `members` to sort by member count.
	 * @param order Order of sorting (asc/desc).
	 * @param filter Filter parameters.
	 * @returns A paginated response containing the build teams and metadata.
	 */
	async findAll(
		pagination: PaginationParams,
		sortBy?: SortingParams['sortBy'],
		order?: SortingParams['order'],
		filter?: FilterParams['filter'],
	) {
		const sortOrder: Prisma.SortOrder = order === 'asc' ? 'asc' : 'desc';
		// The default matches v1: the biggest teams first, which is the order the
		// public team list is expected to be in.
		const orderBy: Prisma.BuildTeamOrderByWithRelationInput =
			!sortBy || sortBy === 'members' ? { members: { _count: sortOrder } } : { [sortBy]: sortOrder };

		const take = Math.max(Number(pagination.limit) || 20, 1);
		const skip = Math.max((Number(pagination.page) || 1) - 1, 0) * take;

		const [buildTeams, count] = await Promise.all([
			this.prisma.buildTeam.findMany({
				where: filter,
				orderBy,
				skip,
				take,
				select: { ...PUBLIC_SELECT, _count: COUNT_SELECT },
			}),
			this.prisma.buildTeam.count({ where: filter }),
		]);

		return {
			data: buildTeams,
			meta: {
				page: pagination.page,
				perPage: pagination.limit,
				totalItems: count,
				totalPages: Math.ceil(count / pagination.limit),
			},
		};
	}

	/**
	 * Finds a single build team by ID or slug.
	 * @param teamId ID of the team, or its slug when useSlug is set.
	 * @param useSlug Whether teamId should be treated as a slug instead of an ID.
	 * @param include Which optional relations to embed.
	 * @param requestingTeamId ID of the team the request is authenticated as, if any.
	 * @returns The build team, with its webhook only when it is asking about itself.
	 * @throws NotFoundException if no team with the given ID or slug exists.
	 */
	async findOne(
		teamId: string,
		useSlug: boolean,
		include: { members?: boolean; showcases?: boolean },
		requestingTeamId?: string,
	) {
		const buildTeam = await this.prisma.buildTeam.findUnique({
			where: useSlug ? { slug: teamId } : { id: teamId },
			select: {
				...PUBLIC_SELECT,
				socials: true,
				_count: COUNT_SELECT,
				...(include.showcases ? { showcases: true } : {}),
				...(include.members
					? { members: { select: { id: true, ssoId: true, avatar: true, username: true, minecraft: true } } }
					: {}),
				// A team is allowed to read back the webhook it configured; nobody else
				// is, so the column is only selected when the token names this team.
				...(requestingTeamId ? { webhook: true } : {}),
			},
		});

		if (!buildTeam) {
			throw new NotFoundException('BuildTeam not found');
		}

		if (requestingTeamId && requestingTeamId !== buildTeam.id) {
			const { webhook, ...withoutWebhook } = buildTeam as typeof buildTeam & { webhook?: string | null };

			return withoutWebhook;
		}

		return buildTeam;
	}

	/**
	 * Returns what the Minecraft modpack needs about every build team, keyed by
	 * team ID.
	 *
	 * Unpaginated and shaped as a map rather than a list, because the modpack
	 * loads it once at startup and looks teams up by ID. Same shape v1 served.
	 * @returns Every team's modpack details, keyed by ID.
	 */
	async findAllForModpack() {
		const buildTeams = await this.prisma.buildTeam.findMany({
			orderBy: { members: { _count: 'desc' } },
			select: MODPACK_SELECT,
		});

		return Object.fromEntries(
			buildTeams.map(({ id, name, ip, version, invite }) => [id, { name, ip: this.parseIps(ip), version, invite }]),
		);
	}

	/**
	 * Returns what the Minecraft modpack needs about a single build team.
	 * @param teamId ID of the team, or its slug when useSlug is set.
	 * @param useSlug Whether teamId should be treated as a slug instead of an ID.
	 * @returns The team's modpack details.
	 * @throws NotFoundException if no team with the given ID or slug exists.
	 */
	async findOneForModpack(teamId: string, useSlug: boolean) {
		const buildTeam = await this.prisma.buildTeam.findUnique({
			where: useSlug ? { slug: teamId } : { id: teamId },
			select: MODPACK_SELECT,
		});

		if (!buildTeam) {
			throw new NotFoundException('BuildTeam not found');
		}

		return { ...buildTeam, ip: this.parseIps(buildTeam.ip) };
	}

	/**
	 * Updates the given build team.
	 *
	 * The team pages are statically rendered, so the frontend is asked to
	 * revalidate them afterwards. When the slug changed, the pages under the old
	 * slug are revalidated too, or the team would keep being served under a URL
	 * that no longer resolves.
	 * @param buildTeamId ID of the team to update.
	 * @param dto The fields to update.
	 * @returns The updated team, including the webhook it owns.
	 * @throws NotFoundException if the team does not exist.
	 * @throws ConflictException if the name or slug is already taken.
	 */
	async update(buildTeamId: string, dto: UpdateBuildTeamDto) {
		const current = await this.prisma.buildTeam.findUnique({
			where: { id: buildTeamId },
			select: { id: true, slug: true },
		});

		if (!current) {
			throw new NotFoundException('BuildTeam not found');
		}

		let buildTeam: { slug: string } & Record<string, unknown>;

		try {
			buildTeam = await this.prisma.buildTeam.update({
				where: { id: current.id },
				data: dto,
				select: { ...PUBLIC_SELECT, webhook: true },
			});
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === UNIQUE_VIOLATION) {
				throw new ConflictException('Another BuildTeam already uses that name or slug');
			}

			throw error;
		}

		const slugs = current.slug === buildTeam.slug ? [buildTeam.slug] : [buildTeam.slug, current.slug];

		await this.queue.dispatch(WorkerJob.RevalidateWebsite, { paths: this.teamPagesFor(slugs) });

		return buildTeam;
	}

	/**
	 * The frontend paths that show the given slugs, with the route parameter
	 * filled in.
	 */
	private teamPagesFor(slugs: string[]): string[] {
		const paths = slugs.flatMap((slug) => TEAM_PAGES.map((page) => page.replace('[team]', slug)));

		return [...new Set(paths)];
	}

	/**
	 * A team's servers are stored as one semicolon separated string, but every
	 * consumer wants a list.
	 */
	private parseIps(ip: string | null): string[] {
		if (!ip) {
			return [];
		}

		return ip
			.split(';')
			.map((entry) => entry.trim())
			.filter(Boolean);
	}
}
