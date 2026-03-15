import { Request, Response } from 'express';

import { ERROR_GENERIC } from '../../../util/Errors.js';
import Web from '../../Web.js';
import { Executor } from './Executor.js';
import { RequestMethods } from './RequestMethods.js';

export default class Router {
	web: Web;
	version: String;

	constructor(web: Web, version: String) {
		this.web = web;
		this.version = version;
	}

	public addRoute(requestMethod: RequestMethods, endpoint: String, executor: Executor, ...middlewares: any) {
		const fullEndpoint = `/api/${this.version}${endpoint}`;
		const app = this.web.getApp();

		this.web.getCore().getLogger().debug(`Registering endpoint "${requestMethod.toString()} ${fullEndpoint}"`);

		const methodHandler = (rq: Request, rs: Response) => {
			try {
				executor(rq, rs);
			} catch (e) {
				ERROR_GENERIC(rq, rs, 500, 'Internal Server Error. Please try again and report this bug.');
			}
		};

		switch (requestMethod) {
			case RequestMethods.GET:
				app.get(fullEndpoint, ...middlewares, methodHandler);
				break;
			case RequestMethods.POST:
				app.post(fullEndpoint, ...middlewares, methodHandler);
				break;
			case RequestMethods.PUT:
				app.put(fullEndpoint, ...middlewares, methodHandler);
				break;
			case RequestMethods.DELETE:
				app.delete(fullEndpoint, ...middlewares, methodHandler);
				break;
			case RequestMethods.HEAD:
				app.head(fullEndpoint, ...middlewares, methodHandler);
				break;
			default:
				app.all(fullEndpoint, ...middlewares, methodHandler);
		}
	}
}
