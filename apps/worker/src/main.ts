import { logger } from './lib/logger';
import prisma from './lib/prisma';

console.clear();
console.log(
	'\n' +
		`                                   /$$                          \n` +
		`                                  | $$                          \n` +
		` /$$  /$$  /$$  /$$$$$$   /$$$$$$ | $$   /$$  /$$$$$$   /$$$$$$ \n` +
		`| $$ | $$ | $$ /$$__  $$ /$$__  $$| $$  /$$/ /$$__  $$ /$$__  $$\n` +
		`| $$ | $$ | $$| $$  \\ $$| $$  \\__/| $$$$$$/ | $$$$$$$$| $$  \\__/\n` +
		`| $$ | $$ | $$| $$  | $$| $$      | $$_  $$ | $$_____/| $$      \n` +
		`|  $$$$$/$$$$/|  $$$$$$/| $$      | $$ \\  $$|  $$$$$$$| $$      \n` +
		` \\_____/\\___/  \\______/ |__/      |__/  \\__/ \\_______/|__/      \n` +
		`                                                                \n` +
		`A BuildTheEarth Worker Node - Version ${process.env.npm_package_version}\n`,
);

async function bootstrap() {
	logger.info('Initializing Worker Node...');

	try {
		logger.debug('Trying to connect to database');
		await prisma.$connect();
		logger.info('Connected to database successfully');
	} catch (error: any) {
		logger.error('Database connection failed', { error });
		process.exit(1);
	}

	logger.debug('Bootstrap complete');
}

bootstrap().catch((err) => {
	logger.error('Fatal error occurred during bootstrap', { error: err });
	process.exit(1);
});
