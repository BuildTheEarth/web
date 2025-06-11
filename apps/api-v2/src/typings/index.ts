export interface Response<T> {
	statusCode: number;
	message: string;
	data: T;
	meta?: PaginatedMeta | any;
}
export interface PaginatedMeta<> {
	currentPage: number;
	itemsPerPage: number;
	totalItems: number;
	totalPages: number;
}
export interface PaginatedResponse<T> extends Response<T[]> {
	meta: PaginatedMeta;
}

export type ControllerResponse<T = any> = Promise<T>;

export type PaginatedControllerResponse<T> = Promise<{
	data: T[];
	meta: PaginatedMeta;
}>;
