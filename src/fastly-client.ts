import * as Fastly from 'fastly'
import type {
	Backend,
	Service,
	ServiceDetail,
	Snippet,
	Vcl,
	Version,
} from 'fastly'

const DEFAULT_PAGE_SIZE = 200

function ensureAuthenticated() {
	const token = Bun.env.FASTLY_API_TOKEN
	if (!token) {
		throw new Error('FASTLY_API_TOKEN is not set')
	}

	Fastly.ApiClient.instance.authenticate(token)
}

export async function listServices(): Promise<Service[]> {
	ensureAuthenticated()
	const api = new Fastly.ServiceApi()
	return api.listServices({
		per_page: DEFAULT_PAGE_SIZE,
		sort: 'name',
		direction: 'ascend',
	})
}

export async function getServiceDetail(
	serviceId: string,
	versionNumber: number,
): Promise<ServiceDetail> {
	ensureAuthenticated()
	const api = new Fastly.ServiceApi()
	return api.getServiceDetail({
		service_id: serviceId,
		version: versionNumber,
	})
}

export async function getSnippetDetail(
	serviceId: string,
	versionNumber: number,
	snippetName: string,
): Promise<Snippet> {
	ensureAuthenticated()
	const api = new Fastly.SnippetApi()
	return api.getSnippet({
		service_id: serviceId,
		version_id: versionNumber,
		name: snippetName,
	})
}

export async function createSnippet(
	serviceId: string,
	versionNumber: number,
	updates: {
		name: string
		type: string
		content: string
		priority?: string
		dynamic?: '0' | '1'
	},
): Promise<Snippet> {
	ensureAuthenticated()
	const api = new Fastly.SnippetApi()
	return api.createSnippet({
		service_id: serviceId,
		version_id: versionNumber,
		...updates,
	})
}

export async function updateSnippet(
	serviceId: string,
	versionNumber: number,
	name: string,
	updates: {
		type?: string
		content?: string
		priority?: string
		dynamic?: '0' | '1'
	},
): Promise<Snippet> {
	ensureAuthenticated()
	const api = new Fastly.SnippetApi()
	return api.updateSnippet({
		service_id: serviceId,
		version_id: versionNumber,
		name,
		...updates,
	})
}

export async function deleteSnippet(
	serviceId: string,
	versionNumber: number,
	name: string,
): Promise<void> {
	ensureAuthenticated()
	const api = new Fastly.SnippetApi()
	await api.deleteSnippet({
		service_id: serviceId,
		version_id: versionNumber,
		name,
	})
}

export async function getBackendDetail(
	serviceId: string,
	versionNumber: number,
	backendName: string,
): Promise<Backend> {
	ensureAuthenticated()
	const api = new Fastly.BackendApi()
	return api.getBackend({
		service_id: serviceId,
		version_id: versionNumber,
		backend_name: backendName,
	})
}

export async function updateBackend(
	serviceId: string,
	versionNumber: number,
	backendName: string,
	updates: Partial<Backend>,
): Promise<Backend> {
	ensureAuthenticated()
	const api = new Fastly.BackendApi()
	return api.updateBackend({
		service_id: serviceId,
		version_id: versionNumber,
		backend_name: backendName,
		...updates,
	})
}

export async function createBackend(
	serviceId: string,
	versionNumber: number,
	updates: Partial<Backend>,
): Promise<Backend> {
	ensureAuthenticated()
	const api = new Fastly.BackendApi()
	return api.createBackend({
		service_id: serviceId,
		version_id: versionNumber,
		...updates,
	})
}

export async function getVclDetail(
	serviceId: string,
	versionNumber: number,
	vclName: string,
): Promise<Vcl> {
	ensureAuthenticated()
	const api = new Fastly.VclApi()
	return api.getCustomVcl({
		service_id: serviceId,
		version_id: versionNumber,
		vcl_name: vclName,
	})
}

export async function cloneServiceVersion(
	serviceId: string,
	versionNumber: number,
): Promise<Version> {
	ensureAuthenticated()
	const api = new Fastly.VersionApi()
	return api.cloneServiceVersion({
		service_id: serviceId,
		version_id: versionNumber,
	})
}

export async function activateServiceVersion(
	serviceId: string,
	versionNumber: number,
): Promise<Version> {
	ensureAuthenticated()
	const api = new Fastly.VersionApi()
	return api.activateServiceVersion({
		service_id: serviceId,
		version_id: versionNumber,
	})
}

export async function listServiceVersions(
	serviceId: string,
): Promise<Version[]> {
	ensureAuthenticated()
	const api = new Fastly.VersionApi()
	return api.listServiceVersions({
		service_id: serviceId,
	})
}
