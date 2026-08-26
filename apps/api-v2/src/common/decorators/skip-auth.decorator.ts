import { SetMetadata } from '@nestjs/common';

/*
 * Decorator that marks a route as public, meaning it should skip authentication.
 *
 * Example usage:
 * @SkipAuth()
 * @Get('public-endpoint')
 * async getPublicData() {
 *   return { message: 'This is public data' };
 * }
 */
export const IS_PUBLIC_KEY = 'shouldSkipAuth';
export const SkipAuth = () => SetMetadata(IS_PUBLIC_KEY, true);
