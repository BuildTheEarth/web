import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

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

function usage(): never {
	console.log('Usage: yarn app:info <app-name>');
	console.log('Example: yarn app:info frontend');
	process.exit(1);
}

function parseArgs(args: string[]): {
	appName: string;
} {
	if (args.length < 1) {
		usage();
	}

	const positionalArgs = args.filter((arg) => !arg.startsWith('--'));

	if (positionalArgs.length < 1) {
		usage();
	}

	const [appName] = positionalArgs;

	if (!/^[a-z0-9-]+$/.test(appName)) {
		fail(`Invalid app name: ${appName}. Use lowercase letters, numbers, and dashes only.`);
	}

	return { appName };
}

function main(): void {
	const args = process.argv.slice(2);
	const { appName } = parseArgs(args);
	const packagePath = path.join('apps', appName, 'package.json');

	if (!existsSync(packagePath)) {
		fail(`Missing package.json for app "${appName}" at ${packagePath}`);
	}

	const packageJsonRaw = readFileSync(packagePath, 'utf8');
	const packageJson = JSON.parse(packageJsonRaw) as { version?: string } & Record<string, unknown>;
	const currentVersion = packageJson.version;

	if (!currentVersion || !isValidSemver(currentVersion)) {
		fail(`Current version in ${packagePath} is missing or invalid: ${String(currentVersion)}`);
	}

	let tag = '';
	let tags: string[] = ['-/-'];

	try {
		tag = run(`git rev-parse --verify --quiet refs/tags/${appName}-v${currentVersion}`);
		tags = run(`git tag --list "${appName}*"`).split('\n');
	} catch {
		// Tag does not exist, continue.
	}

	console.log('App:             ', appName);
	console.log('Root directory:  ', packagePath.replace('package.json', ''));
	console.log('Current version: ', currentVersion);
	console.log('Git tag exists:  ', !!tag);
	console.log(
		'Tagged versions: ',
		tags
			.map((t) => t.replace(appName + '-', ''))
			.filter((t) => t != appName)
			.join(', '),
	);
}

main();
