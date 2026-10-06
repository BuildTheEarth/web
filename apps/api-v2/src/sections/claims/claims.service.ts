import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@repo/db';
import { PrismaService } from 'src/common/db/prisma.service';
import { FilterParams } from 'src/common/decorators/filter.decorator';
import { PaginationParams } from 'src/common/decorators/pagination.decorator';
import { SortingParams } from 'src/common/decorators/sorting.decorator';
import { BuildTeamWebhookEvent, WorkerJob } from 'src/common/queue/jobs';
import { QueueService } from 'src/common/queue/queue.service';
import { ClaimUserRefDto, CreateClaimDto } from './dto/create.claim.dto';
import { ImportClaimDto } from './dto/import.claim.dto';
import { UpdateClaimDto } from './dto/update.claim.dto';
import { areaCenter, areaSize, toGeoJsonRing } from './util/area';

/** Upper bound for a single bulk import, so one request cannot hold the table. */
export const MAX_IMPORT_CLAIMS = 100;

/** The user columns a claim embeds for its owner and builders. */
const USER_SELECT = {
	id: true,
	ssoId: true,
	discordId: true,
	minecraft: true,
	username: true,
	avatar: true,
} as const;

/** The image columns a claim embeds. */
const IMAGE_SELECT = {
	id: true,
	name: true,
	hash: true,
	width: true,
	height: true,
	createdAt: true,
} as const;

/** The build team columns a claim embeds, so a listing can be labelled in one request. */
const BUILD_TEAM_SELECT = {
	id: true,
	name: true,
	location: true,
	slug: true,
	icon: true,
	allowBuilderClaim: true,
} as const;

@Injectable()
export class ClaimsService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly queue: QueueService,
	) {}

	/**
	 * Finds claims based on pagination, sorting and filtering parameters.
	 * @param pagination Pagination parameters.
	 * @param filter Filter parameters, already resolved to a Prisma where clause.
	 * @param sortBy Field to sort by.
	 * @param order Order of sorting (asc/desc).
	 * @returns A paginated response containing the claims and metadata.
	 */
	async findAll(
		pagination: PaginationParams,
		filter: FilterParams['filter'],
		sortBy?: SortingParams['sortBy'],
		order?: SortingParams['order'],
	) {
		const limit = Math.max(Number(pagination.limit) || 20, 1);
		const page = Math.max(Number(pagination.page) || 1, 1);
		const skip = (page - 1) * limit;

		const [claims, total] = await Promise.all([
			this.prisma.claim.findMany({
				where: filter,
				orderBy: { [sortBy || 'createdAt']: order === 'asc' ? 'asc' : 'desc' },
				skip,
				take: limit,
				include: {
					_count: { select: { builders: true, images: true } },
					images: { select: { id: true, name: true, hash: true } },
				},
			}),
			this.prisma.claim.count({ where: filter }),
		]);

		return {
			data: claims,
			meta: {
				page,
				perPage: limit,
				totalItems: total,
				totalPages: Math.ceil(total / limit),
			},
		};
	}

	/**
	 * Finds a single claim by its ID, or by the ID it carries in its team's own
	 * system.
	 * @param id The claim ID, or its externalId when external is set.
	 * @param external Whether id is an externalId rather than a claim ID.
	 * @param withBuilders Whether to embed the builders of the claim.
	 * @returns The claim.
	 * @throws NotFoundException if no such claim exists.
	 */
	async findOne(id: string, external: boolean, withBuilders: boolean) {
		const claim = await this.prisma.claim.findFirst({
			where: external ? { externalId: id } : { id },
			include: {
				owner: { select: USER_SELECT },
				buildTeam: { select: BUILD_TEAM_SELECT },
				images: { select: IMAGE_SELECT },
				builders: withBuilders ? { select: USER_SELECT, take: 20 } : false,
				_count: { select: { builders: true, images: true } },
			},
		});

		if (!claim) {
			throw new NotFoundException('Claim not found');
		}

		return claim;
	}

	/**
	 * Returns the claims as a GeoJSON FeatureCollection, which is what the public
	 * map loads.
	 *
	 * Unpaginated on purpose: a partial map is worse than a slow one, and the
	 * default projection is three columns wide.
	 * @param filter Filter parameters, already resolved to a Prisma where clause.
	 * @param withProperties Whether to include every claim column as feature properties.
	 * @returns A GeoJSON FeatureCollection.
	 */
	async findAllGeoJson(filter: FilterParams['filter'], withProperties: boolean) {
		const claims = await this.prisma.claim.findMany({
			where: filter,
			select: withProperties
				? {
						id: true,
						area: true,
						finished: true,
						active: true,
						name: true,
						city: true,
						osmName: true,
						buildings: true,
						size: true,
						createdAt: true,
						owner: { select: USER_SELECT },
						builders: { select: USER_SELECT },
						buildTeam: { select: { id: true, slug: true, name: true, location: true } },
						images: { select: IMAGE_SELECT },
					}
				: { id: true, area: true, finished: true },
		});

		return {
			type: 'FeatureCollection',
			features: claims
				.filter((claim) => claim.area.length > 0)
				.map(({ area, ...properties }) => ({
					type: 'Feature',
					id: properties.id,
					geometry: { type: 'Polygon', coordinates: [toGeoJsonRing(area)] },
					properties,
				})),
		};
	}

	/**
	 * Lists the images attached to the given team's claims, newest first, so a team
	 * can review what was uploaded against its claims.
	 * @param pagination Pagination parameters.
	 * @param buildTeamId ID of the team whose claim images to list.
	 * @param checked Whether to restrict the result to reviewed or unreviewed images.
	 * @returns A paginated response containing the images and metadata.
	 */
	async findAllImages(pagination: PaginationParams, buildTeamId: string, checked?: boolean) {
		const where = {
			Claim: { buildTeamId },
			...(checked === undefined ? {} : { checked }),
		};

		const take = Math.max(Number(pagination.limit) || 20, 1);
		const skip = Math.max((Number(pagination.page) || 1) - 1, 0) * take;

		const [images, count] = await Promise.all([
			this.prisma.upload.findMany({
				where,
				orderBy: { createdAt: 'desc' },
				skip,
				take,
				include: { Claim: { select: { id: true, name: true, buildTeamId: true } } },
			}),
			this.prisma.upload.count({ where }),
		]);

		return {
			data: images,
			meta: {
				page: pagination.page,
				perPage: pagination.limit,
				totalItems: count,
				totalPages: Math.ceil(count / pagination.limit),
			},
		};
	}

	/**
	 * Creates a claim for the given team.
	 *
	 * Only the geometry that can be worked out locally is written here. The
	 * building count and the geocoded location come from OpenStreetMap, so they are
	 * left to the worker rather than made part of the request.
	 * @param dto The claim to create.
	 * @param buildTeamId ID of the team the claim belongs to.
	 * @returns The created claim.
	 * @throws NotFoundException if the named owner or builders do not exist.
	 */
	async create(dto: CreateClaimDto, buildTeamId: string) {
		const [ownerId, builderIds] = await Promise.all([this.resolveUser(dto.owner), this.resolveUsers(dto.builders)]);

		const claim = await this.prisma.claim.create({
			data: {
				...this.geometryOf(dto.area),
				name: dto.name ?? '',
				description: dto.description,
				finished: dto.finished,
				active: dto.active,
				externalId: dto.externalId,
				buildings: dto.buildings,
				city: dto.city,
				buildTeam: { connect: { id: buildTeamId } },
				...(ownerId ? { owner: { connect: { id: ownerId } } } : {}),
				...(builderIds ? { builders: { connect: builderIds.map((id) => ({ id })) } } : {}),
			},
		});

		await this.announce(BuildTeamWebhookEvent.ClaimCreate, claim, buildTeamId);

		return claim;
	}

	/**
	 * Creates and updates claims in bulk, matching on the ID each claim carries in
	 * the team's own system. Claims of the team that are not part of the payload are
	 * left untouched.
	 * @param dtos The claims to import.
	 * @param buildTeamId ID of the team the claims belong to.
	 * @returns The imported claims, and how many of them were new.
	 * @throws BadRequestException if more than MAX_IMPORT_CLAIMS claims are sent at once,
	 * or if the payload names the same externalId twice.
	 * @throws NotFoundException if an externalId already belongs to another team.
	 */
	async importMany(dtos: ImportClaimDto[], buildTeamId: string) {
		if (dtos.length > MAX_IMPORT_CLAIMS) {
			throw new BadRequestException(`Cannot import more than ${MAX_IMPORT_CLAIMS} claims at once`);
		}

		const externalIds = dtos.map((dto) => dto.externalId);

		if (new Set(externalIds).size !== externalIds.length) {
			throw new BadRequestException('The same externalId was given more than once');
		}

		const existing = await this.prisma.claim.findMany({
			where: { externalId: { in: externalIds } },
			select: { id: true, externalId: true, buildTeamId: true },
		});

		// A 404 rather than a 403: saying "that one is someone else's" would confirm
		// the ID exists, which is what every other route here avoids doing.
		if (existing.some((claim) => claim.buildTeamId !== buildTeamId)) {
			throw new NotFoundException('Claim not found');
		}

		const existingByExternalId = new Map(existing.map((claim) => [claim.externalId, claim.id]));

		const resolved = await Promise.all(
			dtos.map(async (dto) => ({
				dto,
				ownerId: await this.resolveUser(dto.owner),
				builderIds: await this.resolveUsers(dto.builders),
			})),
		);

		const claims = await this.prisma.$transaction(
			resolved.map(({ dto, ownerId, builderIds }) => {
				const data = {
					...this.geometryOf(dto.area),
					name: dto.name ?? '',
					description: dto.description,
					finished: dto.finished,
					active: dto.active,
					buildings: dto.buildings,
					city: dto.city,
					...(ownerId ? { owner: { connect: { id: ownerId } } } : {}),
				};

				const id = existingByExternalId.get(dto.externalId);

				if (id) {
					return this.prisma.claim.update({
						where: { id },
						data: {
							...data,
							...(builderIds ? { builders: { set: builderIds.map((builderId) => ({ id: builderId })) } } : {}),
						},
					});
				}

				return this.prisma.claim.create({
					data: {
						...data,
						externalId: dto.externalId,
						buildTeam: { connect: { id: buildTeamId } },
						...(builderIds ? { builders: { connect: builderIds.map((builderId) => ({ id: builderId })) } } : {}),
					},
				});
			}),
		);

		await Promise.all(
			claims.map((claim) =>
				this.announce(
					existingByExternalId.has(claim.externalId)
						? BuildTeamWebhookEvent.ClaimUpdate
						: BuildTeamWebhookEvent.ClaimCreate,
					claim,
					buildTeamId,
				),
			),
		);

		return {
			claims,
			created: claims.filter((claim) => !existingByExternalId.has(claim.externalId)).length,
			updated: claims.filter((claim) => existingByExternalId.has(claim.externalId)).length,
		};
	}

	/**
	 * Updates a claim if it belongs to the given team.
	 * @param id The claim ID, or its externalId when external is set.
	 * @param external Whether id is an externalId rather than a claim ID.
	 * @param dto The fields to update.
	 * @param buildTeamId ID of the team the claim has to belong to.
	 * @returns The updated claim.
	 * @throws NotFoundException if the claim does not exist or belongs to another team.
	 */
	async update(id: string, external: boolean, dto: UpdateClaimDto, buildTeamId: string) {
		const claim = await this.prisma.claim.findFirst({
			where: external ? { externalId: id, buildTeamId } : { id, buildTeamId },
			select: { id: true },
		});

		if (!claim) {
			throw new NotFoundException('Claim not found');
		}

		const [ownerId, builderIds] = await Promise.all([this.resolveUser(dto.owner), this.resolveUsers(dto.builders)]);

		const updated = await this.prisma.claim.update({
			where: { id: claim.id },
			data: {
				...(dto.area ? this.geometryOf(dto.area) : {}),
				name: dto.name,
				description: dto.description,
				finished: dto.finished,
				active: dto.active,
				externalId: dto.externalId,
				buildings: dto.buildings,
				city: dto.city,
				...(ownerId ? { owner: { connect: { id: ownerId } } } : {}),
				...(builderIds ? { builders: { set: builderIds.map((builderId) => ({ id: builderId })) } } : {}),
			},
		});

		// Only worth re-deriving when the outline moved; the counts and the geocoded
		// name are properties of the area, not of the rest of the claim.
		await this.announce(BuildTeamWebhookEvent.ClaimUpdate, updated, buildTeamId, Boolean(dto.area));

		return updated;
	}

	/**
	 * Deletes a claim if it belongs to the given team.
	 * @param id The claim ID, or its externalId when external is set.
	 * @param external Whether id is an externalId rather than a claim ID.
	 * @param buildTeamId ID of the team the claim has to belong to.
	 * @returns The deleted claim.
	 * @throws NotFoundException if the claim does not exist or belongs to another team.
	 */
	async delete(id: string, external: boolean, buildTeamId: string) {
		const claim = await this.prisma.claim.findFirst({
			where: external ? { externalId: id, buildTeamId } : { id, buildTeamId },
		});

		if (!claim) {
			throw new NotFoundException('Claim not found');
		}

		await this.prisma.claim.delete({ where: { id: claim.id } });

		await this.announce(BuildTeamWebhookEvent.ClaimDelete, claim, buildTeamId, false);

		return claim;
	}

	/**
	 * The geometry that can be derived without leaving the process. The building
	 * count and the geocoded location need OpenStreetMap, so the worker fills those
	 * in afterwards.
	 */
	private geometryOf(area: string[]) {
		return {
			area,
			size: areaSize(area),
			center: areaCenter(area),
		};
	}

	/**
	 * Tells the outside world that a claim changed, without making the request wait
	 * for any of it: the team's webhook, the staff Discord log, and — when the
	 * outline changed — the OpenStreetMap sync that fills in the derived columns.
	 */
	private async announce(
		event: BuildTeamWebhookEvent,
		claim: { id: string; name: string; finished: boolean; active: boolean; createdAt: Date },
		buildTeamId: string,
		syncOsm = true,
	) {
		await Promise.all([
			this.queue.dispatch(WorkerJob.BuildTeamWebhook, {
				type: event,
				data: claim,
				destination: [{ id: buildTeamId }],
			}),
			this.queue.dispatch(WorkerJob.SendDiscordLog, this.discordLogFor(event, claim)),
			...(syncOsm ? [this.queue.dispatch(WorkerJob.SyncClaimOsm, { claimId: claim.id })] : []),
		]);
	}

	/**
	 * The Discord embed the staff log channel gets for a claim event, shaped like
	 * the one v1 posted.
	 */
	private discordLogFor(
		event: BuildTeamWebhookEvent,
		claim: { id: string; name: string; finished: boolean; active: boolean; createdAt: Date },
	): Record<string, unknown> {
		const titles: Partial<Record<BuildTeamWebhookEvent, string>> = {
			[BuildTeamWebhookEvent.ClaimCreate]: 'Claim created',
			[BuildTeamWebhookEvent.ClaimUpdate]: 'Claim updated',
			[BuildTeamWebhookEvent.ClaimDelete]: 'Claim deleted',
		};

		return {
			username: 'Claims',
			embeds: [
				{
					title: claim.name || claim.id,
					url: `${process.env.FRONTEND_URL ?? ''}/map?claim=${claim.id}`,
					author: { name: titles[event] ?? 'Claim changed' },
					fields: [
						{ name: 'Finished', value: claim.finished ? '✅' : '❌', inline: true },
						{ name: 'Active', value: claim.active ? '✅' : '❌', inline: true },
					],
					timestamp: claim.createdAt,
				},
			],
		};
	}

	/**
	 * Resolves the user a caller named by ID, Keycloak ID, Discord ID or Minecraft
	 * name.
	 * @returns The user's ID, or undefined when no user was named.
	 * @throws BadRequestException if the reference names no field at all.
	 * @throws NotFoundException if no matching user exists.
	 */
	private async resolveUser(ref?: ClaimUserRefDto): Promise<string | undefined> {
		if (!ref) {
			return undefined;
		}

		const where: Prisma.UserWhereInput = {};

		if (ref.id) where.id = ref.id;
		if (ref.ssoId) where.ssoId = ref.ssoId;
		if (ref.discordId) where.discordId = ref.discordId;
		if (ref.minecraft) where.minecraft = ref.minecraft;

		if (Object.keys(where).length === 0) {
			throw new BadRequestException('A user has to be named by id, ssoId, discordId or minecraft');
		}

		const user = await this.prisma.user.findFirst({ where, select: { id: true } });

		if (!user) {
			throw new NotFoundException('User not found');
		}

		return user.id;
	}

	/**
	 * Resolves a list of user references.
	 * @returns The users' IDs, or undefined when no list was given, so that callers
	 * can tell "leave the builders alone" apart from "set them to nothing".
	 */
	private async resolveUsers(refs?: ClaimUserRefDto[]): Promise<string[] | undefined> {
		if (!refs) {
			return undefined;
		}

		return await Promise.all(refs.map(async (ref) => (await this.resolveUser(ref)) as string));
	}
}
