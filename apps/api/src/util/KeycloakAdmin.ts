import KcAdminClient from '@keycloak/keycloak-admin-client';
import Core from '../Core.js';

class KeycloakAdmin {
	private kcAdminClient: KcAdminClient;
	private core: Core;
	private readonly maxRetries = 3;
	private readonly baseRetryDelayMs = 250;

	constructor(core: Core) {
		this.core = core;
		this.kcAdminClient = new KcAdminClient({
			baseUrl: process.env.KEYCLOAK_URL,
			realmName: process.env.KEYCLOAK_REALM,
		});

		this.wrapUsersApiWithRetries();
	}

	public getKeycloakAdminClient() {
		return this.kcAdminClient;
	}

	public async authKcClient() {
		return await this.withNetworkRetry('auth.client_credentials', async () => {
			return await this.kcAdminClient.auth({
				grantType: 'client_credentials',
				clientId: process.env.KEYCLOAK_CLIENTID,
				clientSecret: process.env.KEYCLOAK_CLIENTSECRET,
			});
		});
	}

	private wrapUsersApiWithRetries() {
		const usersApi = this.kcAdminClient.users as any;

		const originalFindOne = usersApi.findOne?.bind(usersApi);
		if (originalFindOne) {
			usersApi.findOne = async (params: any) => {
				return await this.withNetworkRetry('users.findOne', async () => originalFindOne(params));
			};
		}

		const originalUpdate = usersApi.update?.bind(usersApi);
		if (originalUpdate) {
			usersApi.update = async (params: any, payload: any) => {
				return await this.withNetworkRetry('users.update', async () => originalUpdate(params, payload));
			};
		}

		const originalListSessions = usersApi.listSessions?.bind(usersApi);
		if (originalListSessions) {
			usersApi.listSessions = async (params: any) => {
				return await this.withNetworkRetry('users.listSessions', async () => originalListSessions(params));
			};
		}
	}

	private async withNetworkRetry<T>(operation: string, fn: () => Promise<T>): Promise<T> {
		let attempt = 0;
		while (true) {
			try {
				return await fn();
			} catch (error) {
				attempt++;
				if (!this.isRetryableNetworkError(error) || attempt >= this.maxRetries) {
					throw error;
				}

				const delay = this.baseRetryDelayMs * Math.pow(2, attempt - 1);
				this.core
					.getLogger()
					.warn(
						`Keycloak ${operation} failed (attempt ${attempt}/${this.maxRetries}) due to network issue. Retrying in ${delay}ms.`,
					);
				await this.sleep(delay);
			}
		}
	}

	private isRetryableNetworkError(error: unknown): boolean {
		const candidates = this.collectErrorStrings(error);
		return candidates.some((value) => {
			const token = value.toUpperCase();
			return (
				token.includes('ENOTFOUND') ||
				token.includes('EAI_AGAIN') ||
				token.includes('ETIMEDOUT') ||
				token.includes('ECONNRESET') ||
				token.includes('ECONNREFUSED') ||
				token.includes('FETCH FAILED')
			);
		});
	}

	private collectErrorStrings(error: unknown): string[] {
		const values: string[] = [];
		let current: any = error;
		let guard = 0;
		while (current && guard < 5) {
			if (typeof current === 'string') {
				values.push(current);
			}
			if (current?.code) {
				values.push(String(current.code));
			}
			if (current?.message) {
				values.push(String(current.message));
			}
			current = current?.cause;
			guard++;
		}

		return values;
	}

	private async sleep(ms: number): Promise<void> {
		await new Promise((resolve) => setTimeout(resolve, ms));
	}
}

export default KeycloakAdmin;
