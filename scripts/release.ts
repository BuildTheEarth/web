import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

type BumpType = 'major' | 'minor' | 'patch';

function run(command: string): string {
	return execSync(command, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function fail(message: string): never {
	console.error(message);
	process.exit(1);
}

function isValidSemver(version: string): boolean {
	return /^\d+\.\d+\.\d+$/.test(version);
}

function bumpVersion(current: string, bump: BumpType): string {
	const [major, minor, patch] = current.split('.').map(Number);

	if (bump === 'major') {
		return `${major + 1}.0.0`;
	}

	if (bump === 'minor') {
		return `${major}.${minor + 1}.0`;
	}

	return `${major}.${minor}.${patch + 1}`;
}

function usage(): never {
	console.log('Usage: yarn release:app <app-name> <patch|minor|major|x.y.z> [--push]');
	console.log('Example: yarn release:app frontend patch');
	console.log('Example: yarn release:app dashboard 2.1.0 --push');
	process.exit(1);
}

function ensureGitClean(): void {
	const status = run('git status --porcelain');
	if (status.length > 0) {
		fail('Git working tree is not clean. Commit or stash changes before running release:app.');
	}
}

function parseArgs(args: string[]): {
	appName: string;
	versionArg: string;
	pushAfterTag: boolean;
} {
	if (args.length < 2) {
		usage();
	}

	const pushAfterTag = args.includes('--push');
	const positionalArgs = args.filter((arg) => !arg.startsWith('--'));

	if (positionalArgs.length < 2) {
		usage();
	}

	const [appName, versionArg] = positionalArgs;

	if (!/^[a-z0-9-]+$/.test(appName)) {
		fail(`Invalid app name: ${appName}. Use lowercase letters, numbers, and dashes only.`);
	}

	return { appName, versionArg, pushAfterTag };
}

function main(): void {
	const args = process.argv.slice(2);
	const { appName, versionArg, pushAfterTag } = parseArgs(args);
	const packagePath = path.join('apps', appName, 'package.json');

	ensureGitClean();

	if (!existsSync(packagePath)) {
		fail(`Missing package.json for app "${appName}" at ${packagePath}`);
	}

	const packageJsonRaw = readFileSync(packagePath, 'utf8');
	const packageJson = JSON.parse(packageJsonRaw) as { version?: string } & Record<string, unknown>;
	const currentVersion = packageJson.version;

	if (!currentVersion || !isValidSemver(currentVersion)) {
		fail(`Current version in ${packagePath} is missing or invalid: ${String(currentVersion)}`);
	}

	const isBumpType = versionArg === 'major' || versionArg === 'minor' || versionArg === 'patch';
	const nextVersion = isBumpType ? bumpVersion(currentVersion, versionArg as BumpType) : versionArg;

	if (!isValidSemver(nextVersion)) {
		fail(`Invalid target version: ${nextVersion}. Use patch|minor|major or x.y.z.`);
	}

	if (nextVersion === currentVersion) {
		fail(`Target version (${nextVersion}) matches current version. Nothing to release.`);
	}

	const tagName = `${appName}-v${nextVersion}`;

	try {
		run(`git rev-parse --verify --quiet refs/tags/${tagName}`);
		fail(`Tag already exists: ${tagName}`);
	} catch {
		// Tag does not exist, continue.
	}

	packageJson.version = nextVersion;
	writeFileSync(packagePath, `${JSON.stringify(packageJson, null, '\t')}\n`);

	run(`git add "${packagePath}"`);
	run(`git commit -m "chore(${appName}/release): bump ${appName} to v${nextVersion}"`);
	run(`git tag -a ${tagName} -m "${tagName}"`);

	console.log(`Updated ${packagePath}: ${currentVersion} -> ${nextVersion}`);
	console.log(`Created commit and tag: ${tagName}`);

	if (pushAfterTag) {
		run('git push');
		run(`git push origin ${tagName}`);
		console.log('Pushed commit and tag to origin.');
		return;
	}

	console.log('Next steps:');
	console.log('  git push');
	console.log(`  git push origin ${tagName}`);
}

main();
