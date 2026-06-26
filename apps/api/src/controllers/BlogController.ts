import { Request, Response } from 'express'

import showdown from 'showdown'
import Core from '../Core.js'

class BlogController {
	private core: Core
	private outlineUrl: string
	private outlineKey: string

	constructor(core: Core) {
		this.core = core
		this.outlineUrl = process.env.OUTLINE_URL
		this.outlineKey = process.env.OUTLINE_KEY
	}

	public async getBlogPosts(_req: Request, res: Response) {
		let data = await this.makeOutlineRequest('documents.list', {
			parentDocumentId: '930393dd-01a7-49d9-8fdd-d7d75b23f7d8',
		})
			.then((res) => res.data)
			.then(async (data) => {
				const promises = data.map(async (post: any) => ({
					title: post.title,
					id: post.id,
					slug: post.url.replace('/doc/', ''),
					publishedAt: post.publishedAt,
					author: {
						name: post.createdBy.name,
						id: post.createdBy.id,
					},
					...(await this.parseBlogContent(post.text, true)),
					content: undefined,
				}))
				const resolvedData = await Promise.all(promises)
				return resolvedData
			})

		data = data.filter((post: any) => post.metadata?.unpublished !== 'true')

		res.send(data)
	}

	public async getBlogPost(req: Request, res: Response) {
		let postId = req.params.id

		// if (req.query.slug) {
		// 	postId = this.postCache[req.params.id as string];
		// }

		// if (!postId) {
		// 	this.updatePostCache();
		// 	postId = this.postCache[req.params.id as string];

		// 	if (!postId) {
		// 		return res.status(404).send({ error: 'Post not found' });
		// 	}
		// }

		const post = (
			await this.makeOutlineRequest('documents.info', {
				id: postId,
			})
		).data

		res.send({
			title: post.title,
			id: post.id,
			slug: post.url.replace('/doc/', ''),
			publishedAt: post.publishedAt,
			author: {
				name: post.createdBy.name,
				id: post.createdBy.id,
			},
			...(await this.parseBlogContent(post.text)),
			text: post.text,
		})
	}

	/**
	 * Makes a request to the Outline API
	 * @param method A valid RPC method from Outline
	 * @param body Optional body to send with the request
	 * @param opts Additional options
	 * @returns a Promise with the response data or the blank response
	 */
	private makeOutlineRequest = async <T = { data: any }>(
		method: string,
		body?: any,
		opts?: { dontParseJson?: boolean },
	): Promise<T> => {
		const response = await fetch(`${this.outlineUrl}/api/${method}`, {
			method: 'POST',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
				Authorization: `Bearer ${this.outlineKey}`,
			},
			body: JSON.stringify(body),
		})

		return opts?.dontParseJson ? (response as unknown as T) : await response.json()
	}

	/**
	 * Parses the raw Markdown content of a blog post to html and valid images
	 * @param content raw Markdown content
	 * @param onlyThumbnail should the method only return the thumbnail image
	 * @returns a object with thumbnail, content and metadata
	 */
	private async parseBlogContent(
		content: string,
		onlyThumbnail?: boolean,
	): Promise<{
		content: string
		thumbnail: string | undefined
		metadata: showdown.Metadata | string
		imageStore: any
	}> {
		const converter = new showdown.Converter({
			parseImgDimensions: true,
			openLinksInNewWindow: true,
			emoji: true,
			metadata: true,
			tables: true,
			simpleLineBreaks: true,
			simplifiedAutoLink: true,
			strikethrough: true,
			literalMidWordUnderscores: true,
			requireSpaceBeforeHeadingText: true,
			tasklists: true,
			underline: true,
		})
		const regex = /!\[.*?\]\(\/api\/attachments\.redirect\?id=.*?(\s+"full-width")?\)/g

		let thumbnail: string | undefined = undefined
		const imageStore: { [original: string]: string } = {}

		let parsedContent = content.replace(regex, (match, p1) => {
			const imageUrl = match.match(/\/api\/attachments\.redirect\?id=.*?(?=\))/)[0]
			if (p1 && !thumbnail) {
				thumbnail = `${this.outlineUrl}${imageUrl.split(' ')[0]}`
				imageStore[thumbnail] = ''

				return ''
			} else {
				if (!onlyThumbnail) {
					imageStore[`${this.outlineUrl}${imageUrl}`] = ''
				}

				return `![image](${this.outlineUrl}${imageUrl})`
			}
		})

		for (const originalUrl in imageStore) {
			const response = await this.makeOutlineRequest<any>(
				'attachments.redirect',
				{ id: originalUrl.split('=')[1].split(' ')[0] },
				{ dontParseJson: true },
			)

			imageStore[originalUrl] = response.url.split('?')[0]
			parsedContent = parsedContent.replace(originalUrl, response.url.split('?')[0])
		}

		// parsedContent = parsedContent.replace(/\\/g, '');

		return {
			content: converter.makeHtml(parsedContent) /*.replace(/\\/g, '')*/,
			thumbnail: imageStore[thumbnail ?? ''],
			metadata: converter.getMetadata(),
			imageStore,
		}
	}
}
export default BlogController
