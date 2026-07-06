'use server'

import { getSession } from '@/util/auth'
import prisma from '@/util/db'
import { ApplicationStatus } from '@repo/db'
import getCountryName from '@/util/countries'

export interface StatsFilter {
	teamId?: string
	timeRange?: '7d' | '30d' | '90d' | 'all'
}

const AREA_DIVISOR = 1000 * 1000 // Convert from m² to km²

export const getStatisticsData = async (filter: StatsFilter) => {
	const session = await getSession()
	if (!session || !session.user) {
		throw new Error('Unauthorized')
	}

	const { teamId, timeRange } = filter

	const claimWhere: any = { active: true }
	const appWhere: any = {}

	if (teamId) {
		claimWhere.buildTeamId = teamId
		appWhere.buildteamId = teamId
	}

	if (timeRange && timeRange !== 'all') {
		const cutoff = new Date()
		if (timeRange === '7d') cutoff.setDate(cutoff.getDate() - 7)
		else if (timeRange === '30d') cutoff.setDate(cutoff.getDate() - 30)
		else if (timeRange === '90d') cutoff.setDate(cutoff.getDate() - 90)

		claimWhere.createdAt = { gte: cutoff }
		appWhere.createdAt = { gte: cutoff }
	}

	const claims = await prisma.claim.findMany({
		where: claimWhere,
		select: {
			id: true,
			createdAt: true,
			size: true,
			finished: true,
			active: true,
			buildings: true,
			name: true,
			city: true,
			owner: {
				select: {
					username: true,
					minecraft: true,
				},
			},
			buildTeam: {
				select: {
					id: true,
					name: true,
					color: true,
					slug: true,
					icon: true,
				},
			},
		},
	})

	const applications = await prisma.application.findMany({
		where: appWhere,
		select: {
			id: true,
			status: true,
			createdAt: true,
			buildteam: {
				select: {
					id: true,
					name: true,
					color: true,
					slug: true,
					icon: true,
				},
			},
		},
	})

	const totalClaims = claims.length
	const finishedClaims = claims.filter((c) => c.finished && c.active).length
	const unfinishedClaims = claims.filter((c) => !c.finished && c.active).length

	const totalBuildings = claims.reduce((acc, c) => acc + c.buildings, 0)
	const finishedBuildings = claims.filter((c) => c.finished && c.active).reduce((acc, c) => acc + c.buildings, 0)
	const unfinishedBuildings = claims.filter((c) => !c.finished && c.active).reduce((acc, c) => acc + c.buildings, 0)

	const totalArea = claims.reduce((acc, c) => acc + c.size, 0)
	const finishedArea = claims.filter((c) => c.finished && c.active).reduce((acc, c) => acc + c.size, 0)
	const unfinishedArea = claims.filter((c) => !c.finished && c.active).reduce((acc, c) => acc + c.size, 0)

	const uniqueBuilders = new Set(claims.map((c) => c.owner?.username).filter(Boolean))
	const totalBuilders = uniqueBuilders.size

	const totalApps = applications.length
	const acceptedApps = applications.filter((a) => a.status === ApplicationStatus.ACCEPTED).length
	const declinedApps = applications.filter((a) => a.status === ApplicationStatus.DECLINED).length
	const trialApps = applications.filter((a) => a.status === ApplicationStatus.TRIAL).length
	const pendingApps = applications.filter(
		(a) => a.status === ApplicationStatus.SEND || a.status === ApplicationStatus.REVIEWING,
	).length

	const acceptanceRate =
		acceptedApps + declinedApps > 0 ? ((acceptedApps + trialApps) / (acceptedApps + declinedApps + trialApps)) * 100 : 0

	const sortedClaims = [...claims].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())

	// We want to combine these into a unified day-by-day dataset
	const growthMap = new Map<string, { claims: number; buildings: number; area: number }>()

	sortedClaims.forEach((c) => {
		const dateStr = c.createdAt.toISOString().split('T')[0]
		const current = growthMap.get(dateStr) || { claims: 0, buildings: 0, area: 0 }
		growthMap.set(dateStr, {
			...current,
			claims: current.claims + 1,
			buildings: current.buildings + c.buildings,
			area: current.area + Math.round((c.size / AREA_DIVISOR) * 100) / 100,
		})
	})

	const sortedDates = Array.from(growthMap.keys()).sort()
	let runningClaims = 0
	let runningBuildings = 0
	let runningArea = 0

	const growthData = sortedDates.map((date) => {
		const val = growthMap.get(date)!
		runningClaims += val.claims
		runningBuildings += val.buildings
		runningArea += val.area

		return {
			date,
			claims: runningClaims,
			buildings: runningBuildings,
			area: Math.round(runningArea * 100) / 100,
		}
	})

	const sizeRanges = {
		'Small (<1k m²)': 0,
		'Medium (1k-10k m²)': 0,
		'Large (10k-100k m²)': 0,
		'Huge (>100k m²)': 0,
	}

	claims.forEach((c) => {
		if (c.size < 1000) sizeRanges['Small (<1k m²)']++
		else if (c.size < 10000) sizeRanges['Medium (1k-10k m²)']++
		else if (c.size < 100000) sizeRanges['Large (10k-100k m²)']++
		else sizeRanges['Huge (>100k m²)']++
	})

	const sizeDistribution = Object.entries(sizeRanges).map(([name, value]) => ({ name, value }))

	const builderStats: {
		[key: string]: { claims: number; buildings: number; size: number }
	} = {}
	claims.forEach((c) => {
		const name = c.owner?.username || 'Unknown Builder'

		if (!builderStats[name]) {
			builderStats[name] = { claims: 0, buildings: 0, size: 0 }
		}

		builderStats[name].claims++
		builderStats[name].buildings += c.buildings
		builderStats[name].size += c.size
	})

	const topBuilders = Object.entries(builderStats)
		.map(([username, stats]) => ({ username, ...stats }))
		.sort((a, b) => b.claims - a.claims)
		.slice(0, 10)

	// Top claims by size
	const topClaims = [...claims].sort((a, b) => b.size - a.size).slice(0, 10)

	let topTeams: any[] = []
	if (!teamId) {
		const teamStats: {
			[key: string]: {
				id: string
				name: string
				color: string
				claims: number
				size: number
				buildings: number
				applications: number
				icon?: string | null
			}
		} = {}

		claims.forEach((c) => {
			const team = c.buildTeam
			if (!teamStats[team.name]) {
				teamStats[team.name] = {
					id: team.id,
					name: team.name,
					color: team.color,
					icon: team.icon,
					claims: 0,
					size: 0,
					buildings: 0,
					applications: 0,
				}
			}
			teamStats[team.name].claims++
			teamStats[team.name].size += c.size
			teamStats[team.name].buildings += c.buildings
		})

		applications.forEach((a) => {
			const teamName = a.buildteam.name
			if (teamStats[teamName]) {
				teamStats[teamName].applications++
			}
		})

		topTeams = Object.values(teamStats)
			.sort((a, b) => b.claims - a.claims)
			.slice(0, 10)
	}

	return {
		kpis: {
			totalClaims,
			finishedClaims,
			unfinishedClaims,
			totalBuildings,
			finishedBuildings,
			unfinishedBuildings,
			totalArea,
			finishedArea,
			unfinishedArea,
			totalBuilders,
			totalApps,
			acceptedApps,
			declinedApps,
			trialApps,
			pendingApps,
			acceptanceRate,
		},
		growthData,
		sizeDistribution,
		topBuilders,
		topClaims,
		topTeams,
	}
}

export const getBuildTeamsList = async () => {
	return prisma.buildTeam.findMany({
		select: {
			id: true,
			name: true,
			slug: true,
		},
		orderBy: {
			members: {
				_count: 'desc',
			},
		},
	})
}

export const getGeographyStatisticsData = async () => {
	const session = await getSession()
	if (!session || !session.user) {
		throw new Error('Unauthorized')
	}

	// 1. Fetch active claims with their buildTeam location and osmName
	const claims = await prisma.claim.findMany({
		where: { active: true },
		select: {
			id: true,
			size: true,
			finished: true,
			buildings: true,
			city: true,
			osmName: true,
			buildTeam: {
				select: {
					id: true,
					name: true,
					location: true,
					slug: true,
					icon: true,
					color: true,
				},
			},
		},
	})

	// 2. Fetch all build teams to ensure empty ones are also mapped
	const teams = await prisma.buildTeam.findMany({
		select: {
			id: true,
			name: true,
			location: true,
			slug: true,
			icon: true,
			color: true,
		},
	})

	const countryMap: {
		[name: string]: {
			country: string
			claims: number
			finishedClaims: number
			buildings: number
			area: number
			teams: any[]
		}
	} = {}

	const getOrCreateCountry = (name: string) => {
		const normalized = name || 'Unknown'
		if (!countryMap[normalized]) {
			countryMap[normalized] = {
				country: normalized,
				claims: 0,
				finishedClaims: 0,
				buildings: 0,
				area: 0,
				teams: [],
			}
		}
		return countryMap[normalized]
	}

	// Group claims using Hybrid Resolution Strategy
	claims.forEach((claim) => {
		const team = claim.buildTeam
		let countryName = ''

		// 1. Primary: actual geographical location from osmName
		if (claim.osmName) {
			const parts = claim.osmName.split(', ')
			if (parts.length > 0) {
				countryName = parts[parts.length - 1].trim()
			}
		}

		// 2. Fallback: Build Team designated primary country code
		if (!countryName || countryName === 'Unknown') {
			const countryCodes = team.location
				? team.location
						.split(',')
						.map((c) => c.trim())
						.filter(Boolean)
				: []
			if (countryCodes.length > 0) {
				countryName = getCountryName(countryCodes[0])
			} else {
				countryName = 'Unknown'
			}
		}

		const country = getOrCreateCountry(countryName)
		country.claims++
		if (claim.finished) country.finishedClaims++
		country.buildings += claim.buildings
		country.area += claim.size
		if (!country.teams.some((t) => t.id === team.id)) {
			country.teams.push(team)
		}
	})

	// Map any remaining teams with locations that have 0 claims
	teams.forEach((team) => {
		if (team.location) {
			const codes = team.location
				.split(',')
				.map((c) => c.trim())
				.filter(Boolean)
			codes.forEach((code) => {
				const countryName = getCountryName(code)
				const country = getOrCreateCountry(countryName)
				if (!country.teams.some((t) => t.id === team.id)) {
					country.teams.push(team)
				}
			})
		}
	})

	// Collect cities and group them by resolved country
	const cityMap: {
		[key: string]: {
			city: string
			country: string
			claims: number
			buildings: number
			area: number
		}
	} = {}

	claims.forEach((claim) => {
		if (claim.city) {
			const cityName = claim.city.trim()
			if (!cityName) return

			const team = claim.buildTeam
			let countryName = ''

			if (claim.osmName) {
				const parts = claim.osmName.split(', ')
				if (parts.length > 0) {
					countryName = parts[parts.length - 1].trim()
				}
			}

			if (!countryName || countryName === 'Unknown') {
				const countryCodes = team.location
					? team.location
							.split(',')
							.map((c) => c.trim())
							.filter(Boolean)
					: []
				countryName = countryCodes.length > 0 ? getCountryName(countryCodes[0]) : 'Unknown'
			}

			const key = `${cityName}-${countryName}`
			if (!cityMap[key]) {
				cityMap[key] = {
					city: cityName,
					country: countryName,
					claims: 0,
					buildings: 0,
					area: 0,
				}
			}
			cityMap[key].claims++
			cityMap[key].buildings += claim.buildings
			cityMap[key].area += claim.size
		}
	})

	// Process countries list
	const countries = Object.values(countryMap)
		.map((c) => {
			return {
				country: c.country,
				claims: c.claims,
				finishedClaims: c.finishedClaims,
				buildings: c.buildings,
				area: c.area,
				teams: c.teams,
			}
		})
		.sort((a, b) => b.claims - a.claims)

	const topCities = Object.values(cityMap)
		.sort((a, b) => b.claims - a.claims)
		.slice(0, 10)

	const totalCountries = countries.filter((c) => c.country !== 'Unknown').length
	const totalCities = Object.keys(cityMap).length
	const totalTeamsMapped = teams.filter((t) => t.location).length

	return {
		countries,
		topCities,
		globalTotals: {
			totalCountries,
			totalCities,
			totalTeamsMapped,
		},
	}
}
