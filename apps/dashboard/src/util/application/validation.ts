/**
 * Server-safe validation rules for application questions.
 * Must not import any client components, as it is used by server actions and the client form.
 */

export type QuestionLike = {
	id: string
	type: string
	required?: boolean
	additionalData?: any
}

const URL_REGEX =
	/^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%.,_!\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.,!~#?&\/=]*)$/
const MINECRAFT_NAME_REGEX = /^[a-zA-Z0-9_]{2,16}$/

export function validateTextLength(value: string, additionalData?: { length?: number }): string | false {
	const max = additionalData?.length || 200
	return value.split('').length > max ? `Text is too long, please reduce it to ${max} characters` : false
}

export function validateUrl(value: string): string | false {
	return URL_REGEX.test(value) ? false : 'Not a valid URL'
}

export function validateMinecraftName(value: string): string | false {
	return MINECRAFT_NAME_REGEX.test(value) ? false : 'Not a valid Minecraft Name'
}

/**
 * Validates a single answer against the rules of its question type.
 * @returns An error message or `false` if the answer is valid
 */
export function validateAnswer(question: QuestionLike, rawValue: unknown): string | false {
	if (question.type === 'TEXT') return false

	const value = (typeof rawValue === 'string' ? rawValue : rawValue == null ? '' : String(rawValue)).trim()
	const data = question.additionalData ?? {}

	if (question.type === 'CHECKBOX') {
		if (value !== '' && value !== 'true' && value !== 'false') return 'Invalid checkbox value'
		return question.required && value !== 'true' ? 'This field is required' : false
	}

	if (question.type === 'DROPDOWN') {
		let selected: unknown
		try {
			selected = value === '' ? [] : JSON.parse(value)
		} catch {
			return 'Invalid selection'
		}
		if (!Array.isArray(selected) || selected.some((s) => typeof s !== 'string')) return 'Invalid selection'
		if (question.required && selected.length === 0) return 'This field is required'
		if (Array.isArray(data.options) && selected.some((s) => !data.options.includes(s))) {
			return 'Invalid selection'
		}
		if (typeof data.maxSelect === 'number' && data.maxSelect > 0 && selected.length > data.maxSelect) {
			return `Please select at most ${data.maxSelect} options`
		}
		return false
	}

	if (value === '') {
		return question.required ? 'This field is required' : false
	}

	switch (question.type) {
		case 'SHORT_INPUT':
		case 'LONG_INPUT':
			return validateTextLength(value, data)
		case 'URL':
			return validateUrl(value)
		case 'MINECRAFT':
			return validateMinecraftName(value)
		case 'SLIDER': {
			const n = Number(value)
			if (!Number.isFinite(n)) return 'Invalid number'
			if (typeof data.min === 'number' && n < data.min) return `Value must be at least ${data.min}`
			if (typeof data.max === 'number' && n > data.max) return `Value must be at most ${data.max}`
			return false
		}
		default:
			return false
	}
}

/**
 * Generates a validation object ({ [questionId]: (value) => error | false }) usable in forms and on the server.
 */
export function generateValidation(data: QuestionLike[]) {
	const validation: { [id: string]: (value: unknown) => string | false } = {}
	data.forEach((d) => {
		validation[d.id] = (value: unknown) => validateAnswer(d, value)
	})
	return validation
}
