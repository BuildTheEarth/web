import { SetMetadata } from "@nestjs/common";

export const IS_AUTH_OPTIONAL_KEY = "isAuthOptional";

/**
 * Decorator that makes authentication optional for a route. By default, routes
 * require a valid JWT token.
 *
 * @example
 *
 * @OptionalAuth()
 * @Get('optional-auth-endpoint')
 * async getOptionalAuthData(@Request() req: Request) {
 *   // req.token may be undefined if no valid token is provided
 * }
 *
 */
export const OptionalAuth = () => SetMetadata(IS_AUTH_OPTIONAL_KEY, true);
