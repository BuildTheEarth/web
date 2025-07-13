export interface Response<T> {
	status: number;
	message: string;
	data: T;
	meta?: PaginatedMeta;
}
export interface PaginatedMeta<> {
	page: number;
	perPage: number;
	totalItems: number;
	totalPages: number;
}
export interface PaginatedResponse<T> extends Response<T[]> {
	meta: PaginatedMeta;
}

export type ControllerResponse<T = any> = Promise<T>;

export type PaginatedControllerResponse<T = any> = Promise<{
	data: T[];
	meta: PaginatedMeta;
}>;
