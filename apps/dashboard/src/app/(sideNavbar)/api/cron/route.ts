import { CRON_JOBS } from '@/util/cron';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

class LogStream {
	private queue: string[] = [];
	private waiting: ((result: IteratorResult<string | undefined>) => void)[] = [];
	private finished = false;

	push(message: string) {
		if (this.finished) return;
		const line = `${message}\n`;
		if (this.waiting.length) {
			const resolve = this.waiting.shift();
			resolve!({ value: line, done: false });
		} else {
			this.queue.push(line);
		}
	}

	async next(): Promise<IteratorResult<string | undefined>> {
		if (this.queue.length) {
			return { value: this.queue.shift()!, done: false };
		}
		if (this.finished) {
			return { value: undefined, done: true };
		}
		return new Promise((resolve) => {
			this.waiting.push(resolve);
		});
	}

	[Symbol.asyncIterator]() {
		return this;
	}

	close() {
		this.finished = true;
		// Resolve any pending iterations to close the stream.
		for (const resolve of this.waiting) {
			resolve({ value: undefined, done: true });
		}
		this.waiting = [];
	}
}

export async function POST(req: NextRequest) {
	const headersList = await headers();
	const authHeader = headersList.get('Authorization');

	const searchParams = req.nextUrl.searchParams;
	const cron = searchParams.get('cron');

	if (!authHeader || !authHeader.startsWith('INTERNAL ') || authHeader.split(' ')[1] !== process.env.INTERNAL_API_KEY) {
		return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
	}

	if (!cron) {
		return NextResponse.json({ message: 'Missing cron parameter' }, { status: 400 });
	}

	if (CRON_JOBS[cron]) {
		const job = CRON_JOBS[cron];
		const logStream = new LogStream();
		const encoder = new TextEncoder();

		// Start the job execution and push logs into logStream.
		(async () => {
			try {
				const result = job.handler(job, (msg: string) => logStream.push(msg));
				if (result instanceof Promise) {
					await result;
				}
			} catch (err) {
				logStream.push(`Error: ${err}`);
			} finally {
				logStream.close();
			}
		})();

		const stream = new ReadableStream({
			async pull(controller) {
				const { done, value } = await logStream.next();
				if (done) {
					controller.close();
				} else {
					controller.enqueue(encoder.encode(value));
				}
			},
		});

		return new Response(stream, {
			headers: { 'Content-Type': 'text/plain' },
		});
	}

	return NextResponse.json({ message: 'Invalid cron job' }, { status: 400 });
}
