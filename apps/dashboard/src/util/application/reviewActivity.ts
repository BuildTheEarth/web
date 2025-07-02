import { ApplicationStatus } from '@repo/db';
import prisma from '../db';

/**
 * Calculate Review Activity Score for a Build Region
 * @param buildteamId Build Region ID
 * @returns PAR: Pending Application Ratio, PS: Pending Score, ART: Average Review Time, RES: Review Efficiency Score, RAS: Review Activity Score
 */
export async function getReviewActivityScore(
	buildteamId: string,
): Promise<{ art: number; par: number; ps: number; res: number; ras: number }> {
	let art = 0,
		par = 0,
		ps = 0,
		res = 0,
		ras = 0;

	// 1. Calculate Average Review Time (ART)
	// ART = average(reviewedAt- createdAt for ACCEPTED, DECLINED, TRIAL Applications) in days

	const reviewedApplications = await prisma.application.findMany({
		where: {
			buildteamId,
			status: { notIn: [ApplicationStatus.SEND, ApplicationStatus.REVIEWING] },
			reviewedAt: { not: null },
		},
		select: {
			createdAt: true,
			reviewedAt: true,
		},
	});

	if (reviewedApplications.length > 0) {
		const artArray = reviewedApplications.map((application) => {
			if (application.reviewedAt === null) {
				return 0;
			}
			return application.reviewedAt?.getTime() - application.createdAt.getTime();
		});
		art =
			Math.floor((artArray.reduce((acc, curr) => acc + curr, 0) / artArray.length / (1000 * 60 * 60 * 24)) * 100) / 100;
	} else {
		art = 0;
	}

	// 2. Calculate Review Efficiency Score (RES)
	// RES = Math.round((5 - (art - getTargetART()) * 0.4) * 100) / 100

	res = Math.round((5 - (art - getTargetART()) * 0.4) * 100) / 100;

	// 3. Calculate Pending Application Ratio (PAR)
	// PAR = (Number of SEND Applications) / (Total Number of Applications)

	const applicationsByType = await prisma.application.groupBy({
		where: {
			buildteamId,
		},
		by: ['status'],
		_count: true,
	});
	const sendApplications = applicationsByType.find((a) => a.status === ApplicationStatus.SEND)?._count || 0;
	const totalApplications = applicationsByType.reduce((acc, curr) => acc + curr._count, 0);

	par = Math.round((sendApplications / totalApplications) * 10000) / 100;

	// 4. Calculate Pending Score (PS)
	// PS = (100 - par) / 10 [0, 10]

	ps = (100 - par) / 10;

	// 5. Calculate Review Activity Score (RAS)
	// RAS = 1 + (((RES * 0.7) + (PS * 0.3)) * 4))

	ras = Math.round((res * 0.7 + (ps / 2) * 0.3) * 100) / 100;

	if (ras < 0) ras = 0;
	if (ras > 5) ras = 5;

	return {
		art,
		res,
		par,
		ps,
		ras,
	};
}

function getTargetART(): number {
	// Example: Target ART of 3 days (in milliseconds)
	return 2;
}
