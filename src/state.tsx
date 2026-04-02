import type { Backend, Service, ServiceVersionDetail, Snippet } from 'fastly'
import React, { createContext, useContext, useReducer } from 'react'

export type Screen = 'services' | 'service' | 'snippet' | 'backend'
export type FocusTarget = 'filter' | 'list'
export type ServiceFocusTarget =
	| 'versions'
	| 'backends'
	| 'snippets'
	| 'vcls'
	| 'domains'
export type SnippetFocusTarget = 'list' | 'content'

export interface AppState {
	screen: Screen
	focus: FocusTarget
	services: Service[]
	servicesLoading: boolean
	servicesLoaded: boolean
	servicesError: string | null
	filter: string
	selectedIndex: number
	selectedServiceId: string | null
	serviceFocus: ServiceFocusTarget
	snippetFocus: SnippetFocusTarget
	versionSelectedIndex: number
	selectedVersionNumber: number | null
	backendSelectedIndex: number
	selectedBackendName: string | null
	backendDetails: Backend | null
	backendDetailsLoading: boolean
	backendDetailsError: string | null
	snippetSelectedIndex: number
	vclSelectedIndex: number
	domainSelectedIndex: number
	selectedSnippetName: string | null
	snippetDetails: Snippet | null
	snippetDetailsLoading: boolean
	snippetDetailsError: string | null
	versionDetails: ServiceVersionDetail | null
	versionDetailsLoading: boolean
	versionDetailsError: string | null
}

type Action =
	| { type: 'services/loading' }
	| { type: 'services/loaded'; services: Service[] }
	| { type: 'services/error'; error: string }
	| { type: 'filter/set'; value: string }
	| { type: 'selection/set'; index: number }
	| { type: 'service/select'; serviceId: string }
	| { type: 'version/selection-set'; index: number }
	| { type: 'version/select'; versionNumber: number }
	| { type: 'backend/selection-set'; index: number }
	| { type: 'backend/select'; name: string }
	| { type: 'backend/details-loading' }
	| { type: 'backend/details-loaded'; backend: Backend | null }
	| { type: 'backend/details-error'; error: string }
	| { type: 'snippet/selection-set'; index: number }
	| { type: 'vcl/selection-set'; index: number }
	| { type: 'domain/selection-set'; index: number }
	| { type: 'snippet/select'; name: string }
	| { type: 'snippet/details-loading' }
	| { type: 'snippet/details-loaded'; snippet: AppState['snippetDetails'] }
	| { type: 'snippet/details-error'; error: string }
	| { type: 'snippet/focus'; focus: SnippetFocusTarget }
	| { type: 'version/details-loading' }
	| { type: 'version/details-loaded'; version: ServiceVersionDetail | null }
	| { type: 'version/details-error'; error: string }
	| { type: 'service/focus'; focus: ServiceFocusTarget }
	| { type: 'screen/backend' }
	| { type: 'screen/snippet' }
	| { type: 'screen/service' }
	| { type: 'screen/services' }
	| { type: 'focus/set'; focus: FocusTarget }

const initialState: AppState = {
	screen: 'services',
	focus: 'filter',
	services: [],
	servicesLoading: false,
	servicesLoaded: false,
	servicesError: null,
	filter: '',
	selectedIndex: 0,
	selectedServiceId: null,
	serviceFocus: 'versions',
	snippetFocus: 'list',
	versionSelectedIndex: 0,
	selectedVersionNumber: null,
	backendSelectedIndex: 0,
	selectedBackendName: null,
	backendDetails: null,
	backendDetailsLoading: false,
	backendDetailsError: null,
	snippetSelectedIndex: 0,
	vclSelectedIndex: 0,
	domainSelectedIndex: 0,
	selectedSnippetName: null,
	snippetDetails: null,
	snippetDetailsLoading: false,
	snippetDetailsError: null,
	versionDetails: null,
	versionDetailsLoading: false,
	versionDetailsError: null,
}

function reducer(state: AppState, action: Action): AppState {
	switch (action.type) {
		case 'services/loading':
			return {
				...state,
				servicesLoading: true,
				servicesLoaded: false,
				servicesError: null,
			}
		case 'services/loaded':
			return {
				...state,
				services: action.services,
				servicesLoading: false,
				servicesLoaded: true,
				servicesError: null,
				selectedIndex: 0,
			}
		case 'services/error':
			return {
				...state,
				servicesLoading: false,
				servicesLoaded: false,
				servicesError: action.error,
			}
		case 'filter/set':
			return {
				...state,
				filter: action.value,
				selectedIndex: 0,
			}
		case 'selection/set':
			return {
				...state,
				selectedIndex: action.index,
			}
		case 'service/select':
			return {
				...state,
				selectedServiceId: action.serviceId,
				screen: 'service',
				serviceFocus: 'versions',
				snippetFocus: 'list',
				versionSelectedIndex: 0,
				selectedVersionNumber: null,
				backendSelectedIndex: 0,
				selectedBackendName: null,
				backendDetails: null,
				backendDetailsLoading: false,
				backendDetailsError: null,
				snippetSelectedIndex: 0,
				vclSelectedIndex: 0,
				domainSelectedIndex: 0,
				selectedSnippetName: null,
				snippetDetails: null,
				snippetDetailsLoading: false,
				snippetDetailsError: null,
				versionDetails: null,
				versionDetailsLoading: false,
				versionDetailsError: null,
			}
		case 'service/focus':
			return {
				...state,
				serviceFocus: action.focus,
			}
		case 'version/selection-set':
			return {
				...state,
				versionSelectedIndex: action.index,
			}
		case 'version/select':
			return {
				...state,
				selectedVersionNumber: action.versionNumber,
				versionDetailsError: null,
				selectedBackendName: null,
				backendDetails: null,
				backendDetailsLoading: false,
				backendDetailsError: null,
				selectedSnippetName: null,
				snippetDetails: null,
				snippetDetailsLoading: false,
				snippetDetailsError: null,
			}
		case 'backend/selection-set':
			return {
				...state,
				backendSelectedIndex: action.index,
			}
		case 'backend/select':
			return {
				...state,
				selectedBackendName: action.name,
			}
		case 'backend/details-loading':
			return {
				...state,
				backendDetailsLoading: true,
				backendDetailsError: null,
				backendDetails: null,
			}
		case 'backend/details-loaded':
			return {
				...state,
				backendDetailsLoading: false,
				backendDetailsError: null,
				backendDetails: action.backend,
			}
		case 'backend/details-error':
			return {
				...state,
				backendDetailsLoading: false,
				backendDetailsError: action.error,
				backendDetails: null,
			}
		case 'snippet/selection-set':
			return {
				...state,
				snippetSelectedIndex: action.index,
			}
		case 'vcl/selection-set':
			return {
				...state,
				vclSelectedIndex: action.index,
			}
		case 'domain/selection-set':
			return {
				...state,
				domainSelectedIndex: action.index,
			}
		case 'snippet/select':
			return {
				...state,
				selectedSnippetName: action.name,
			}
		case 'snippet/details-loading':
			return {
				...state,
				snippetDetailsLoading: true,
				snippetDetailsError: null,
				snippetDetails: null,
			}
		case 'snippet/details-loaded':
			return {
				...state,
				snippetDetailsLoading: false,
				snippetDetailsError: null,
				snippetDetails: action.snippet,
			}
		case 'snippet/details-error':
			return {
				...state,
				snippetDetailsLoading: false,
				snippetDetailsError: action.error,
				snippetDetails: null,
			}
		case 'snippet/focus':
			return {
				...state,
				snippetFocus: action.focus,
			}
		case 'version/details-loading':
			return {
				...state,
				versionDetailsLoading: true,
				versionDetailsError: null,
				versionDetails: null,
			}
		case 'version/details-loaded':
			return {
				...state,
				versionDetailsLoading: false,
				versionDetailsError: null,
				versionDetails: action.version,
			}
		case 'version/details-error':
			return {
				...state,
				versionDetailsLoading: false,
				versionDetailsError: action.error,
				versionDetails: null,
			}
		case 'screen/backend':
			return {
				...state,
				screen: 'backend',
			}
		case 'screen/snippet':
			return {
				...state,
				screen: 'snippet',
				snippetFocus: 'list',
			}
		case 'screen/service':
			return {
				...state,
				screen: 'service',
			}
		case 'screen/services':
			return {
				...state,
				screen: 'services',
				selectedServiceId: null,
				serviceFocus: 'versions',
				snippetFocus: 'list',
				versionSelectedIndex: 0,
				selectedVersionNumber: null,
				backendSelectedIndex: 0,
				selectedBackendName: null,
				backendDetails: null,
				backendDetailsLoading: false,
				backendDetailsError: null,
				snippetSelectedIndex: 0,
				vclSelectedIndex: 0,
				domainSelectedIndex: 0,
				selectedSnippetName: null,
				snippetDetails: null,
				snippetDetailsLoading: false,
				snippetDetailsError: null,
				versionDetails: null,
				versionDetailsLoading: false,
				versionDetailsError: null,
			}
		case 'focus/set':
			return {
				...state,
				focus: action.focus,
			}
		default:
			return state
	}
}

type AppContextValue = {
	state: AppState
	dispatch: React.Dispatch<Action>
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppStateProvider({ children }: { children: React.ReactNode }) {
	const [state, dispatch] = useReducer(reducer, initialState)
	return (
		<AppContext.Provider value={{ state, dispatch }}>
			{children}
		</AppContext.Provider>
	)
}

export function useAppState() {
	const context = useContext(AppContext)
	if (!context) {
		throw new Error('useAppState must be used within AppStateProvider')
	}

	return context
}
