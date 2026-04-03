import { appendFileSync } from 'node:fs'
import * as Fastly from 'fastly'

const LOG_PATH = '/tmp/fastly-tui-api.log'

function safeStringify(value: unknown) {
	try {
		return JSON.stringify(value)
	} catch {
		return String(value)
	}
}

function appendLog(message: string) {
	const timestamp = new Date().toISOString()
	const log = `[${timestamp}] ${message}\n`
	appendFileSync(LOG_PATH, log)
	console.error(log)
}

function sanitizeHeaders(headers: Record<string, unknown>) {
	const sanitized = { ...headers }
	if (sanitized['Fastly-Key']) {
		sanitized['Fastly-Key'] = '<redacted>'
	}
	return sanitized
}

export function installApiLogger() {
	if ((globalThis as { __fastlyApiLogger?: boolean }).__fastlyApiLogger) {
		return
	}

	;(globalThis as { __fastlyApiLogger?: boolean }).__fastlyApiLogger = true

	const apiClient = Fastly.ApiClient
	if (!apiClient?.prototype?.callApi || !apiClient.instance) {
		return
	}

	const shouldLogAll = Bun.env.FASTLY_TUI_LOG_ALL === '1'

	const plugin = (request: {
		url?: string
		method?: string
		on: (event: string, handler: (response: any) => void) => void
		_requestData?: any
		headers?: Record<string, string>
	}) => {
		request.on('response', (response) => {
			if (!shouldLogAll && response.status < 400) {
				return
			}
			appendLog(
				safeStringify({
					url: request.url,
					method: request.method,
					status: response.status,
					statusText: response.statusText,
					response: response.text || response.body || '',
					headers: sanitizeHeaders(request.headers ?? {}),
					body: request._requestData ? safeStringify(request._requestData) : '',
				}),
			)
		})
		request.on('error', (error) => {
			appendLog(
				safeStringify({
					url: request.url,
					method: request.method,
					headers: sanitizeHeaders(request.headers ?? {}),
					body: request._requestData ? safeStringify(request._requestData) : '',
					error: error instanceof Error ? error.message : String(error),
				}),
			)
		})
	}

	const current = apiClient.instance.plugins
	if (Array.isArray(current)) {
		apiClient.instance.plugins = [...current, plugin]
	} else {
		apiClient.instance.plugins = [plugin]
	}
}
