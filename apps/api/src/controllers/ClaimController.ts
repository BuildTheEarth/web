import { Request, Response } from 'express';
import { sendBtWebhook, WebhookType } from '../util/BtWebhooks.js';
import turf, { toOverpassPolygon, toPolygon } from '../util/Coordinates.js';
import { ERROR_GENERIC, ERROR_NO_PERMISSION, ERROR_VALIDATION } from '../util/Errors.js';

import { Claim } from '@repo/db';
import axios from 'axios';
import { validationResult } from 'express-validator';
import Core from '../Core.js';
import { userHasPermissions } from '../web/routes/utils/CheckUserPermissionMiddleware.js';

class ClaimController {
	private core: Core;
	private static readonly OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
	private static readonly OVERPASS_MIN_INTERVAL_MS = 1200;
	private static nextOverpassRequestAt = 0;

	constructor(core: Core) {
		this.core = core;
	}

	private wait(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	private readHeader(headers: Record<string, unknown> | undefined, key: string): string | undefined {
		if (!headers) return undefined;
		const value = headers[key.toLowerCase()];
		if (Array.isArray(value)) return value[0]?.toString();
		if (value === undefined || value === null) return undefined;
		return value.toString();
	}

	private parseRetryAfterMs(headers: Record<string, unknown> | undefined): number | undefined {
		const retryAfter = this.readHeader(headers, 'retry-after');
		if (!retryAfter) return undefined;

		const seconds = parseInt(retryAfter, 10);
		if (!Number.isNaN(seconds)) return Math.max(0, seconds * 1000);

		const retryAt = Date.parse(retryAfter);
		if (!Number.isNaN(retryAt)) return Math.max(0, retryAt - Date.now());

		return undefined;
	}

	private previewOverpassBody(data: unknown): string {
		if (data === undefined || data === null) return 'empty';
		if (typeof data === 'string') return data.replace(/\s+/g, ' ').trim().slice(0, 500);
		try {
			return JSON.stringify(data).slice(0, 500);
		} catch {
			return '[unserializable-response-body]';
		}
	}

	public async getClaims(req: Request, res: Response) {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return ERROR_VALIDATION(req, res, errors.array());
		}

		const filters = {
			finished: req.query.finished ? req.query.finished === 'true' : undefined,
			active: req.query.active ? req.query.active === 'true' : undefined,
			team: req.query.team ? (req.query.team as string) : undefined,
		};

		const claims = await this.core.getPrisma().claim.findMany({
			where: {
				finished: filters.finished,
				active: filters.active,
				buildTeam: req.query.slug ? { slug: filters.team } : { id: filters.team },
			},
			include: {
				_count: { select: { builders: true, images: true } },
				images: { select: { id: true, name: true, hash: true } },
			},
		});

		res.send(claims);
	}

	public async getClaimsGeoJson(req: Request, res: Response) {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return ERROR_VALIDATION(req, res, errors.array());
		}

		const filters = {
			finished: req.query.finished ? req.query.finished === 'true' : undefined,
			active: req.query.active ? req.query.active === 'true' : undefined,
		};

		const claims = await this.core.getPrisma().claim.findMany({
			where: { finished: filters.finished, active: filters.active },
			select: req.query.props
				? {
						id: true,
						area: true,
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
				: { id: true, area: true, finished: true },
		});

		res.send({
			type: 'FeatureCollection',
			features: claims
				.filter((c) => c.area.length > 0)
				.map((c) => {
					const mapped = c.area?.map((p: string) => p.split(', ').map(Number));
					if (c.area[0] != c.area[c.area.length - 1]) {
						mapped.push(mapped[0]);
					}
					return {
						type: 'Feature',
						geometry: {
							type: 'Polygon',
							coordinates: [mapped],
						},
						properties: { ...c, area: undefined },
						id: c.id,
					};
				}),
		});
	}

	public async getClaim(req: Request, res: Response) {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return ERROR_VALIDATION(req, res, errors.array());
		}
		const claim = await this.core.getPrisma().claim.findUnique({
			where: {
				id: req.params.id,
			},
			include: {
				owner: true,
				buildTeam: {
					select: {
						name: true,
						id: true,
						location: true,
						slug: true,
						icon: true,
						allowBuilderClaim: true,
					},
				},
				images: {
					select: {
						id: true,
						name: true,
						hash: true,
						height: true,
						width: true,
					},
				},
				builders: req.query.builders
					? {
							select: {
								ssoId: true,
								id: true,
								discordId: true,
								minecraft: true,
								avatar: true,
							},
							take: 10,
						}
					: undefined,
				_count: { select: { builders: true } },
			},
		});
		if (claim) {
			let kcBuilders = [];
			if (claim.builders) {
				kcBuilders = await Promise.all(
					claim?.builders?.map(async (member) => {
						const kcMember = await this.core.getKeycloakAdmin().getKeycloakAdminClient().users.findOne({
							id: member.ssoId,
						});
						return {
							discordId: member.discordId,
							id: member.id,
							username: kcMember?.username,
							avatar: member.avatar,
							minecraft: member.minecraft,
						};
					}),
				);
			}

			let kcOwner;
			if (claim.owner) {
				kcOwner = await this.core.getKeycloakAdmin().getKeycloakAdminClient().users.findOne({
					id: claim.owner.ssoId,
				});
			}

			res.send({
				...claim,
				builders: kcBuilders,
				owner: { ...claim.owner, username: kcOwner?.username },
			});
		} else {
			ERROR_GENERIC(req, res, 404, 'Claim does not exist.');
		}
		return;
	}

	public async getClaimImages(req: Request, res: Response) {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return ERROR_VALIDATION(req, res, errors.array());
		}
		const uploads = await this.core.getPrisma().upload.findMany({
			orderBy: {
				createdAt: 'desc',
			},
			take: parseInt((req.query.take as string) || '10'),
			skip: parseInt((req.query.skip as string) || '0'),
			where: {
				claimId: { not: null },
				checked: false,
			},
			include: {
				Showcase: {
					select: {
						id: true,
						approved: true,
						buildTeam: { select: { name: true, slug: true } },
						city: true,
						title: true,
					},
				},
				Claim: { select: { id: true, name: true } },
			},
		});

		const count = await this.core.getPrisma().upload.count({
			where: {
				claimId: { not: null },
			},
		});

		res.send({ data: uploads, total: count });
	}

	public async getStatistics(req: Request, res: Response) {
		const claimAggr = await this.core.getPrisma().claim.aggregate({
			_avg: {
				size: true,
				buildings: true,
			},
			_sum: {
				size: true,
				buildings: true,
			},
			_count: {
				id: true,
			},
			where: { finished: true },
		});
		const claimTopArea = await this.core.getPrisma().claim.findMany({
			orderBy: { size: 'desc' },
			take: 3,
			select: { id: true, name: true, city: true, size: true, buildings: true },
			where: { finished: true },
		});
		const claimTopBuildings = await this.core.getPrisma().claim.findMany({
			orderBy: { buildings: 'desc' },
			take: 3,
			select: { id: true, name: true, city: true, size: true, buildings: true },
			where: { finished: true },
		});

		const _claimTopUser: any[] = await this.core.getPrisma().$queryRaw`
    SELECT "User".*, COUNT(*) AS count
    FROM "User"
    LEFT JOIN "Claim" ON "Claim"."ownerId" = "User"."id"
    GROUP BY "User"."id"
    ORDER BY count DESC
    LIMIT 3;
    `;

		const _claimTopTeam: any[] = await this.core.getPrisma().$queryRaw`
    SELECT "BuildTeam"."name", "BuildTeam"."id", "BuildTeam"."slug", "BuildTeam"."location", "BuildTeam"."icon", COUNT(*) AS count
    FROM "BuildTeam"
    LEFT JOIN "Claim" ON "Claim"."buildTeamId" = "BuildTeam"."id"
    GROUP BY "BuildTeam"."id"
    ORDER BY count DESC
    LIMIT 3;
    `;

		let claimTopUser = [];
		if (_claimTopUser) {
			claimTopUser = await Promise.all(
				_claimTopUser?.map(async (member) => {
					const kcMember = await this.core.getKeycloakAdmin().getKeycloakAdminClient().users.findOne({
						id: member.ssoId,
					});
					return {
						id: member.id,
						minecraft: member.minecraft,
						username: kcMember?.username,
						discordId: member.discordId,
						avatar: member.avatar,
						count: parseInt(member.count.toString().replace('n', '')),
					};
				}),
			);
		}

		const claimTopTeam = _claimTopTeam.map((team) => ({
			...team,
			count: parseInt(team.count.toString().replace('n', '')),
		}));

		res.send({
			total: {
				area: claimAggr._sum.size,
				claims: claimAggr._count.id,
				buildings: claimAggr._sum.buildings,
			},
			average: {
				area: claimAggr._avg.size,
				buildings: claimAggr._avg.buildings,
			},
			largest: {
				area: claimTopArea,
				buildings: claimTopBuildings,
			},
			most: {
				user: claimTopUser,
				team: claimTopTeam,
			},
		});
	}

	public async updateClaim(req: Request, res: Response) {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return ERROR_VALIDATION(req, res, errors.array());
		}
		const claim = await this.core.getPrisma().claim.findFirst({
			where: { id: req.params.id },
			select: { id: true, buildTeamId: true, ownerId: true },
		});

		if (claim.ownerId != req.user.id) {
			if (!userHasPermissions(this.core.getPrisma(), req.user.ssoId, ['team.claim.list'], claim.buildTeamId)) {
				return ERROR_NO_PERMISSION(req, res);
			}
		}

		const { name, finished, active, area, description, owner } = req.body;
		const center = turf.center(toPolygon(area)).geometry.coordinates.join(', ');

		const buildingCount = area && (await this.updateClaimBuildingCount({ area }));

		if (buildingCount == undefined || buildingCount == null || typeof buildingCount != 'number') {
			return ERROR_GENERIC(req, res, 500, 'Could not update building count');
		}

		const updatedClaim = await this.core.getPrisma().claim.update({
			where: {
				id: req.params.id,
			},
			data: {
				name,
				description,
				finished,
				active,
				owner: owner && { connect: { id: owner } },
				area: area,
				size: area && turf.area(toPolygon(area)),
				center: center,
				builders: req.body.builders ? { set: req.body.builders.map((b: any) => ({ id: b.id })) } : undefined,
				buildings: buildingCount,
				...(await this.updateClaimOSMDetails({ id: req.params.id, name, center }, false)),
			},
			include: {
				buildTeam: {
					select: {
						webhook: true,
					},
				},
			},
		});

		this.core.getDiscord().sendClaimUpdate(updatedClaim);
		await sendBtWebhook(this.core, updatedClaim.buildTeam.webhook, WebhookType.CLAIM_UPDATE, {
			...updatedClaim,
			buildTeam: undefined,
		});
		res.send({
			...updatedClaim,
			builders: req.body.builders?.map((b: any) => ({ ...b, new: false })),
			buildTeam: undefined,
		});
	}

	public async createClaim(req: Request, res: Response) {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return ERROR_VALIDATION(req, res, errors.array());
		}

		const buildteam = await this.core.getPrisma().buildTeam.findUnique({
			where: req.query.slug ? { slug: req.body.team } : { id: req.body.team },
			select: {
				allowBuilderClaim: true,
				id: true,
				members: { where: { id: req.user.id } },
			},
		});

		if (buildteam.allowBuilderClaim === false) {
			return ERROR_GENERIC(req, res, 403, 'BuildTeam does not allow Claims.');
		}

		if (buildteam.members.length <= 0) {
			return ERROR_GENERIC(req, res, 403, 'You are not a member of this BuildTeam.');
		}

		const area = req.body.area;
		const center = area && turf.center(toPolygon(area)).geometry.coordinates.join(', ');

		let buildingCount;

		try {
			buildingCount = area && (await this.updateClaimBuildingCount({ area }, false));
			if (buildingCount == undefined || buildingCount == null || typeof buildingCount != 'number') {
				this.core
					.getLogger()
					.error(`Failed to get building count for new claim (bt: ${buildteam.id}, name: ${req.body.name})`);
				return ERROR_GENERIC(req, res, 500, 'Could not update building count');
			}
		} catch (e) {
			this.core
				.getLogger()
				.error(`Error while getting building count for new claim (bt: ${buildteam.id}, name: ${req.body.name}): ${e}`);
			return ERROR_GENERIC(req, res, 500, 'Could not update building count');
		}

		const claim = await this.core.getPrisma().claim.create({
			data: {
				buildTeam: {
					connect: {
						id: buildteam.id,
					},
				},
				area: area,
				size: area && turf.area(toPolygon(area)),
				center,
				owner: { connect: { id: req.user.id } },
				builders: req.body.builders ? { connect: req.body.builders.map((b: any) => ({ id: b.id })) } : undefined,
				name: req.body.name,
				description: req.body.description,
				finished: req.body.finished,
				active: req.body.active,
				buildings: buildingCount,
				...(area ? await this.updateClaimOSMDetails({ name: req.body.name, center }, false) : {}),
			},
			include: {
				buildTeam: {
					select: {
						webhook: true,
					},
				},
			},
		});
		await sendBtWebhook(this.core, claim.buildTeam.webhook, WebhookType.CLAIM_CREATE, {
			...claim,
			buildTeam: undefined,
		});
		res.send({ ...claim, buildTeam: undefined });
	}

	public async deleteClaim(req: Request, res: Response) {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return ERROR_VALIDATION(req, res, errors.array());
		}

		if (!req.user) {
			return ERROR_NO_PERMISSION(req, res);
		}
		const claim = await this.core.getPrisma().claim.findFirst({
			where: { id: req.params.id },
			select: {
				id: true,
				buildTeamId: true,
				ownerId: true,
				externalId: true,
				buildTeam: { select: { webhook: true } },
			},
		});

		if (claim.ownerId != req.user.id) {
			if (!userHasPermissions(this.core.getPrisma(), req.user.ssoId, ['team.claim.list'], claim.buildTeamId)) {
				return ERROR_NO_PERMISSION(req, res);
			}
		}

		if (claim) {
			await this.core.getPrisma().claim.delete({
				where: {
					id: req.params.id,
				},
			});
			await sendBtWebhook(this.core, claim.buildTeam.webhook, WebhookType.CLAIM_DELETE, {
				...claim,
				buildTeam: undefined,
			});
			res.send({ ...claim, buildTeam: undefined });
		} else {
			ERROR_GENERIC(req, res, 404, 'Claim does not exist.');
		}
	}

	public async deleteClaimImage(req: Request, res: Response) {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return ERROR_VALIDATION(req, res, errors.array());
		}

		if (!req.user) {
			return ERROR_NO_PERMISSION(req, res);
		}
		const claim = await this.core.getPrisma().claim.findFirst({
			where: {
				id: req.params.id,
			},
			select: {
				images: { where: { id: req.params.image } },
				id: true,
				buildTeamId: true,
				ownerId: true,
				externalId: true,
				buildTeam: { select: { webhook: true } },
			},
		});

		if (claim?.ownerId != req.user.id) {
			if (!userHasPermissions(this.core.getPrisma(), req.user.ssoId, ['team.claim.list'], claim.buildTeamId)) {
				return ERROR_NO_PERMISSION(req, res);
			}
		}

		if (claim?.images[0]) {
			await this.core.getAWS().deleteFile('uploads', claim.images[0].id);
			res.send(claim);
		} else {
			ERROR_GENERIC(req, res, 404, 'Claim or Image does not exist.');
		}
	}

	public async updateClaimBuildingCount(
		claim: {
			id?: string;
			area: string[];
		},
		update?: boolean,
	): Promise<number | { message: string } | Claim> {
		const polygon = toOverpassPolygon(claim.area);
		const claimId = claim.id || 'unknown';

		const overpassQuery = `[out:json][timeout:25];
        (
          node["building"]["building"!~"grandstand"]["building"!~"roof"]["building"!~"garage"]["building"!~"hut"]["building"!~"shed"](poly: "${polygon}");
          way["building"]["building"!~"grandstand"]["building"!~"roof"]["building"!~"garage"]["building"!~"hut"]["building"!~"shed"](poly: "${polygon}");
          relation["building"]["building"!~"grandstand"]["building"!~"roof"]["building"!~"garage"]["building"!~"hut"]["building"!~"shed"](poly: "${polygon}");
        );
      out count;`;

		const maxAttempts = 4;

		for (let attempt = 1; attempt <= maxAttempts; attempt++) {
			try {
				const now = Date.now();
				const waitForSlot = Math.max(0, ClaimController.nextOverpassRequestAt - now);
				if (waitForSlot > 0) {
					this.core
						.getLogger()
						.debug(`Overpass pacing wait ${waitForSlot}ms (claim: ${claimId}; attempt: ${attempt}/${maxAttempts})`);
					await this.wait(waitForSlot);
				}

				ClaimController.nextOverpassRequestAt = Date.now() + ClaimController.OVERPASS_MIN_INTERVAL_MS;

				const params = new URLSearchParams();
				params.append('data', overpassQuery);

				this.core
					.getLogger()
					.debug(
						`Overpass request start (claim: ${claimId}; attempt: ${attempt}/${maxAttempts}; areaPoints: ${claim.area.length})`,
					);

				const response = await axios.post(ClaimController.OVERPASS_URL, params.toString(), {
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
						'User-Agent': 'BuildTheEarth/1.0 (contact: development@buildtheearth.net)',
						Referer: 'https://buildtheearth.net',
						Origin: 'https://buildtheearth.net',
					},
					timeout: 45000,
					validateStatus: () => true,
				});

				const responseHeaders = (response.headers || {}) as Record<string, unknown>;
				const retryAfterHeader = this.readHeader(responseHeaders, 'retry-after');
				const overpassRateLimit = this.readHeader(responseHeaders, 'x-ratelimit-limit');
				const overpassRateRemaining = this.readHeader(responseHeaders, 'x-ratelimit-remaining');
				const overpassRateReset = this.readHeader(responseHeaders, 'x-ratelimit-reset');

				if (response.status >= 200 && response.status < 300) {
					const data = response.data;

					this.core
						.getLogger()
						.debug(
							`Overpass request success (claim: ${claimId}; status: ${response.status}; remaining: ${overpassRateRemaining || 'n/a'}; reset: ${overpassRateReset || 'n/a'})`,
						);

					if (!data?.elements || data?.elements.length <= 0) {
						this.core
							.getLogger()
							.error(
								`Claim did not contain any elements, setting building count to 0 (${ClaimController.OVERPASS_URL}; claim: ${claimId})`,
							);
						return 0;
					}

					if (update) {
						const updatedClaim = await this.core.getPrisma().claim.update({
							where: { id: claim.id },
							data: { buildings: parseInt(data?.elements[0]?.tags?.total) || 0 },
						});
						return updatedClaim;
					}

					return parseInt(data?.elements[0]?.tags?.total) || 0;
				}

				const bodyPreview = this.previewOverpassBody(response.data);
				const computedBackoffMs = 1000 * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 250);
				const retryAfterMs = this.parseRetryAfterMs(responseHeaders) || computedBackoffMs;

				const isRetryable =
					response.status === 429 || response.status === 502 || response.status === 503 || response.status === 504;

				const logMethod = isRetryable ? 'warn' : 'error';
				this.core
					.getLogger()
					[
						logMethod
					](`Overpass non-success response (claim: ${claimId}; attempt: ${attempt}/${maxAttempts}; status: ${response.status}; statusText: ${response.statusText || 'n/a'}; retryAfter: ${retryAfterHeader || 'n/a'}; limit: ${overpassRateLimit || 'n/a'}; remaining: ${overpassRateRemaining || 'n/a'}; reset: ${overpassRateReset || 'n/a'}; bodyPreview: ${bodyPreview})`);

				if (isRetryable && attempt < maxAttempts) {
					ClaimController.nextOverpassRequestAt = Math.max(
						ClaimController.nextOverpassRequestAt,
						Date.now() + retryAfterMs,
					);
					await this.wait(retryAfterMs);
					continue;
				}

				this.core
					.getLogger()
					.error(
						`Overpass request failed with status ${response.status}. Setting building count to -1. (claim: ${claimId})`,
					);
				return -1;
			} catch (e: unknown) {
				const isAxiosError = axios.isAxiosError(e);
				const status = isAxiosError ? e.response?.status : undefined;
				const statusText = isAxiosError ? e.response?.statusText : undefined;
				const responseHeaders = (isAxiosError ? e.response?.headers : undefined) as Record<string, unknown> | undefined;
				const bodyPreview = isAxiosError ? this.previewOverpassBody(e.response?.data) : 'n/a';
				const retryAfterMs = this.parseRetryAfterMs(responseHeaders) || 1000 * Math.pow(2, attempt - 1);
				const isRetryableError =
					status === 429 || status === 502 || status === 503 || status === 504 || status === undefined;

				this.core
					.getLogger()
					[
						isRetryableError ? 'warn' : 'error'
					](`Overpass request error (claim: ${claimId}; attempt: ${attempt}/${maxAttempts}; status: ${status || 'n/a'}; statusText: ${statusText || 'n/a'}; retryAfter: ${this.readHeader(responseHeaders, 'retry-after') || 'n/a'}; message: ${isAxiosError ? e.message : e instanceof Error ? e.message : String(e)}; bodyPreview: ${bodyPreview})`);

				if (isRetryableError && attempt < maxAttempts) {
					ClaimController.nextOverpassRequestAt = Math.max(
						ClaimController.nextOverpassRequestAt,
						Date.now() + retryAfterMs,
					);
					await this.wait(retryAfterMs);
					continue;
				}

				return e as { message: string };
			}
		}

		return { message: 'Overpass retries exhausted' };
	}

	public async updateClaimOSMDetails(
		claim: { id?: string; center: string; name?: string },
		update?: boolean,
	): Promise<{ osmName: string; city: string; name: string } | undefined> {
		try {
			const { data } = await axios.get(
				`https://nominatim.openstreetmap.org/reverse?lat=${claim.center.split(', ')[1]}&lon=${
					claim.center.split(', ')[0]
				}&format=json&accept-language=en&zoom=18`,
				{ headers: { 'User-Agent': 'BTE/1.0' } },
			);

			if (data?.error) this.core.getLogger().error(data.error + ' (https://nominatim.openstreetmap.org/reverse)');

			const parsed = {
				osmName: data.display_name,
				name: claim.name
					? claim.name
					: data.name != ''
						? data.name
						: `${data.address?.road || ''} ${data.address?.house_number || ''}`.trim() ||
							data.display_name.split(',')[0],
				city:
					data.address?.city ||
					data.address?.town ||
					data.address?.hamlet ||
					data.address?.township ||
					data.address?.village ||
					data.address?.suburb ||
					data.address?.neighbourhood ||
					data.address?.county,
			};

			if (data?.display_name && update) {
				await this.core.getPrisma().claim.update({
					where: {
						id: claim.id,
					},
					data: parsed,
				});
			} else {
				return parsed;
			}
		} catch (e) {
			this.core.getLogger().error(e + ' (https://nominatim.openstreetmap.org/reverse)');
			//return e;
		}
	}
}

export default ClaimController;
