import winston from 'winston';

type LogMeta = {
	timestamp: unknown;
	level: string;
	requestId?: string;
	component?: string;
	fields?: Record<string, unknown>;
};

const formatFieldValue = (value: unknown): string => {
	if (typeof value === 'string') {
		return value;
	}

	if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
		return String(value);
	}

	if (value instanceof Error) {
		return value.stack ?? `${value.name}: ${value.message}`;
	}

	try {
		return JSON.stringify(value);
	} catch {
		return String(value);
	}
};

const formatPrefix = ({ timestamp, level, requestId, component = 'main', fields = {} }: LogMeta): string => {
	return `${timestamp} | ${level} [${requestId || component}] » `;
};

const formatLine = (content: string | Record<string, unknown>, meta: LogMeta): string => {
	if (typeof content === 'string') {
		return `${formatPrefix(meta)}${content}`;
	}

	try {
		return formatLine(JSON.stringify(content), meta);
	} catch {
		return formatLine(String(content), meta);
	}
};

const formatBlock = (content: string, meta: LogMeta): string => {
	return content
		.split(/\r?\n/)
		.filter((line) => line.length > 0)
		.map((line) => formatLine(line, meta))
		.join('\n');
};

const loggerConfig = {
	development: {
		level: 'debug',
		format: winston.format.combine(
			winston.format.errors({ stack: true }),
			winston.format.timestamp(),
			winston.format.colorize(),
			winston.format.simple(),
			winston.format.printf((info) => {
				const { level, message, timestamp, requestId, component, error, stack, label, ...rest } =
					info as winston.Logform.TransformableInfo & {
						requestId?: string;
						component?: string;
						error?: unknown;
						stack?: string;
					};

				const lines = [message];
				const errorDetails = formatFieldValue(error) ?? stack;

				if (errorDetails) {
					lines.push(errorDetails);
				}

				return formatBlock(lines.join('\n'), {
					timestamp,
					level,
					requestId,
					component,
					fields: rest,
				});
			}),
		),
		transports: [new winston.transports.Console()],
	},
	production: {
		level: 'info',
		format: winston.format.combine(
			winston.format.errors({ stack: true }),
			winston.format.timestamp(),
			winston.format.json(),
		),
		transports: [new winston.transports.Console()],
	},
};

export const logger = winston.createLogger(
	process.env.NODE_ENV === 'production' ? loggerConfig.production : loggerConfig.development,
);
