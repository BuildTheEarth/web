import { SetMetadata } from '@nestjs/common';

export const IS_RAW_RESPONSE_KEY = 'isRawResponse';

/**
 * Sends the handler's return value as-is, skipping the standard
 * `{ status, message, data }` envelope.
 *
 * Only for routes whose body is a published file format rather than an API
 * payload — the `.geojson` listings, which have to be loadable straight into a
 * map client. Everything else keeps the envelope.
 */
export const RawResponse = () => SetMetadata(IS_RAW_RESPONSE_KEY, true);
