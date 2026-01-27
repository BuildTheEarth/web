/**
 * Global store for invalidated sessions
 * This is set by the backchannel-logout endpoint when Keycloak notifies
 */

declare global {
	// eslint-disable-next-line no-var
	var invalidatedSessions: Set<string> | undefined;
}

export function isSessionInvalidated(sessionId: string | undefined, userId: string | undefined): boolean {
	if (!globalThis.invalidatedSessions) {
		return false;
	}

	if (sessionId && globalThis.invalidatedSessions.has(sessionId)) {
		return true;
	}

	if (userId && globalThis.invalidatedSessions.has(userId)) {
		return true;
	}

	return false;
}

export function markSessionAsChecked(sessionId: string | undefined, userId: string | undefined): void {
	// Remove from invalidated sessions after checking to prevent memory buildup
	if (sessionId) {
		globalThis.invalidatedSessions?.delete(sessionId);
	}
	if (userId) {
		globalThis.invalidatedSessions?.delete(userId);
	}
}
