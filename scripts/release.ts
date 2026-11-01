import { execSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

type BumpType = 'major' | 'minor' | 'patch'

function run(command: string): string {
	return execSync(command, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
}

function fail(message: string): never {
	console.error(message)
	process.exit(1)
}

function isValidSemver(version: string): boolean {
	return /^\d+\.\d+\.\d+$/.test(version)
}

function bumpVersion(current: string, bump: BumpType): string {
	const [major, minor, patch] = current.split('.').map(Number)

	if (bump === 'major') {
		return `${major + 1}.0.0`
	}

	if (bump === 'minor') {
		return `${major}.${minor + 1}.0`
	}

	return `${major}.${minor}.${patch + 1}`
}

function usage(): never {
	console.log('Usage: yarn app:publish <app-name[,app-name...]> <patch|minor|major|x.y.z> [--push]')
	console.log('Example: yarn app:publish frontend patch')
	console.log('Example: yarn app:publish dashboard,frontend patch --push')
	console.log('Example: yarn app:publish dashboard 2.1.0 --push')
	process.exit(1)
}

function ensureGitClean(): void {
	const status = run('git status --porcelain')
	if (status.length > 0) {
		fail('Git working tree is not clean. Commit or stash changes before releasing.')
	}
}

function parseArgs(args: string[]): {
	appNames: string[]
	versionArg: string
	pushAfterTag: boolean
} {
	const pushAfterTag = args.includes('--push')
	const positionalArgs = args.filter((arg) => !arg.startsWith('--'))

	if (positionalArgs.length !== 2) {
		usage()
	}

	const [appsArg, versionArg] = positionalArgs
	const appNames = [
		...new Set(
			appsArg
				.split(',')
				.map((name) => name.trim())
				.filter(Boolean),
		),
	]

	if (appNames.length === 0) {
		usage()
	}

	for (const appName of appNames) {
		if (!/^[a-z0-9-]+$/.test(appName)) {
			fail(`Invalid app name: ${appName}. Use lowercase letters, numbers, and dashes only.`)
		}
	}

	return { appNames, versionArg, pushAfterTag }
}

type Release = {
	appName: string
	packagePath: string
	packageJson: { version?: string } & Record<string, unknown>
	currentVersion: string
	nextVersion: string
	tagName: string
}

function planRelease(appName: string, versionArg: string): Release {
	const packagePath = path.join('apps', appName, 'package.json')

	if (!existsSync(packagePath)) {
		fail(`Missing package.json for app "${appName}" at ${packagePath}`)
	}

	const packageJson = JSON.parse(readFileSync(packagePath, 'utf8')) as { version?: string } & Record<string, unknown>
	const currentVersion = packageJson.version

	if (!currentVersion || !isValidSemver(currentVersion)) {
		fail(`Current version in ${packagePath} is missing or invalid: ${String(currentVersion)}`)
	}

	const isBumpType = versionArg === 'major' || versionArg === 'minor' || versionArg === 'patch'
	const nextVersion = isBumpType ? bumpVersion(currentVersion, versionArg as BumpType) : versionArg

	if (!isValidSemver(nextVersion)) {
		fail(`Invalid target version: ${nextVersion}. Use patch|minor|major or x.y.z.`)
	}

	if (nextVersion === currentVersion) {
		fail(`${appName}: target version (${nextVersion}) matches current version. Nothing to release.`)
	}

	const tagName = `${appName}-v${nextVersion}`

	try {
		run(`git rev-parse --verify --quiet refs/tags/${tagName}`)
		fail(`Tag already exists: ${tagName}`)
	} catch {
		// Tag does not exist, continue.
	}

	return { appName, packagePath, packageJson, currentVersion, nextVersion, tagName }
}

function main(): void {
	const { appNames, versionArg, pushAfterTag } = parseArgs(process.argv.slice(2))

	ensureGitClean()

	// Validate every app before touching anything, so a bad app name doesn't leave a half-finished release.
	const releases = appNames.map((appName) => planRelease(appName, versionArg))

	for (const { appName, packagePath, packageJson, currentVersion, nextVersion, tagName } of releases) {
		packageJson.version = nextVersion
		writeFileSync(
			packagePath,
			`${JSON.stringify(packageJson, null, '	')}
`,
		)

		run(`git add "${packagePath}"`)
		run(`git commit -m "chore(${appName}/release): bump ${appName} to v${nextVersion}"`)
		run(`git tag -a ${tagName} -m "${tagName}"`)

		console.log(`Updated ${packagePath}: ${currentVersion} -> ${nextVersion}`)
		console.log(`Created commit and tag: ${tagName}`)
	}

	const tagNames = releases.map((release) => release.tagName)

	if (pushAfterTag) {
		run('git push')
		run(`git push origin ${tagNames.join(' ')}`)
		console.log(`Pushed commits and tags to origin: ${tagNames.join(', ')}`)
		return
	}

	console.log('Next steps:')
	console.log('  git push')
	console.log(`  git push origin ${tagNames.join(' ')}`)
}

main()
