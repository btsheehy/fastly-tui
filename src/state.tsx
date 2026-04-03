import type {
	Backend,
	Service,
	ServiceVersionDetail,
	Snippet,
	Vcl,
	Version,
} from 'fastly'
import React, { createContext, useContext, useReducer } from 'react'

export type Screen = 'services' | 'service' | 'snippet' | 'backend' | 'vcl'
export type FocusTarget = 'filter' | 'list'
export type ServiceFocusTarget =
	| 'versions'
	| 'backends'
	| 'snippets'
	| 'vcls'
	| 'domains'
export type SnippetFocusTarget = 'list' | 'content'
export type VclFocusTarget = 'list' | 'content'

export interface AppState {
	screen: Screen
	focus: FocusTarget
	services: Service[]
	servicesLoading: boolean
	servicesLoaded: boolean
	servicesError: string | null
	cloneConfirmOpen: boolean
	cloneLoading: boolean
	cloneError: string | null
	activateConfirmOpen: boolean
	activateLoading: boolean
	activateError: string | null
	filter: string
	selectedIndex: number
	selectedServiceId: string | null
	serviceFocus: ServiceFocusTarget
	snippetFocus: SnippetFocusTarget
	vclFocus: VclFocusTarget
	versionSelectedIndex: number
	selectedVersionNumber: number | null
	backendSelectedIndex: number
	selectedBackendName: string | null
	backendDetails: Backend | null
	backendDetailsLoading: boolean
	backendDetailsError: string | null
	backendCreateMode: boolean
	backendEditMode: boolean
	backendEditFieldIndex: number
	backendEditValues: Record<string, string>
	backendSaveLoading: boolean
	backendSaveError: string | null
	snippetSelectedIndex: number
	vclSelectedIndex: number
	selectedVclName: string | null
	vclDetails: Vcl | null
	vclDetailsLoading: boolean
	vclDetailsError: string | null
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
	| { type: 'services/versions-update'; serviceId: string; versions: Version[] }
	| { type: 'clone/confirm-open' }
	| { type: 'clone/confirm-close' }
	| { type: 'clone/start' }
	| { type: 'clone/success' }
	| { type: 'clone/error'; error: string }
	| { type: 'activate/confirm-open' }
	| { type: 'activate/confirm-close' }
	| { type: 'activate/start' }
	| { type: 'activate/success' }
	| { type: 'activate/error'; error: string }
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
	| { type: 'backend/create-start'; values: Record<string, string> }
	| { type: 'backend/edit-start'; values: Record<string, string> }
	| { type: 'backend/edit-cancel' }
	| { type: 'backend/edit-field'; index: number }
	| { type: 'backend/edit-value'; key: string; value: string }
	| { type: 'backend/save-start' }
	| { type: 'backend/save-success' }
	| { type: 'backend/save-error'; error: string }
	| { type: 'snippet/selection-set'; index: number }
	| { type: 'vcl/selection-set'; index: number }
	| { type: 'vcl/select'; name: string }
	| { type: 'vcl/details-loading' }
	| { type: 'vcl/details-loaded'; vcl: Vcl | null }
	| { type: 'vcl/details-error'; error: string }
	| { type: 'domain/selection-set'; index: number }
	| { type: 'snippet/select'; name: string }
	| { type: 'snippet/details-loading' }
	| { type: 'snippet/details-loaded'; snippet: AppState['snippetDetails'] }
	| { type: 'snippet/details-error'; error: string }
	| { type: 'snippet/focus'; focus: SnippetFocusTarget }
	| { type: 'vcl/focus'; focus: VclFocusTarget }
	| { type: 'version/details-loading' }
	| { type: 'version/details-loaded'; version: ServiceVersionDetail | null }
	| { type: 'version/details-error'; error: string }
	| { type: 'service/focus'; focus: ServiceFocusTarget }
	| { type: 'screen/backend' }
	| { type: 'screen/vcl' }
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
	cloneConfirmOpen: false,
	cloneLoading: false,
	cloneError: null,
	activateConfirmOpen: false,
	activateLoading: false,
	activateError: null,
	filter: '',
	selectedIndex: 0,
	selectedServiceId: null,
	serviceFocus: 'versions',
	snippetFocus: 'list',
	vclFocus: 'list',
	versionSelectedIndex: 0,
	selectedVersionNumber: null,
	backendSelectedIndex: 0,
	selectedBackendName: null,
	backendDetails: null,
	backendDetailsLoading: false,
	backendDetailsError: null,
	backendCreateMode: false,
	backendEditMode: false,
	backendEditFieldIndex: 0,
	backendEditValues: {},
	backendSaveLoading: false,
	backendSaveError: null,
	snippetSelectedIndex: 0,
	vclSelectedIndex: 0,
	selectedVclName: null,
	vclDetails: null,
	vclDetailsLoading: false,
	vclDetailsError: null,
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
		case 'services/versions-update':
			return {
				...state,
				services: state.services.map((service) =>
					service.id === action.serviceId
						? { ...service, versions: action.versions }
						: service,
				),
			}
		case 'clone/confirm-open':
			return {
				...state,
				cloneConfirmOpen: true,
				cloneError: null,
			}
		case 'clone/confirm-close':
			return {
				...state,
				cloneConfirmOpen: false,
			}
		case 'clone/start':
			return {
				...state,
				cloneLoading: true,
				cloneError: null,
			}
		case 'clone/success':
			return {
				...state,
				cloneLoading: false,
				cloneConfirmOpen: false,
				cloneError: null,
			}
		case 'clone/error':
			return {
				...state,
				cloneLoading: false,
				cloneConfirmOpen: false,
				cloneError: action.error,
			}
		case 'activate/confirm-open':
			return {
				...state,
				activateConfirmOpen: true,
				activateError: null,
			}
		case 'activate/confirm-close':
			return {
				...state,
				activateConfirmOpen: false,
			}
		case 'activate/start':
			return {
				...state,
				activateLoading: true,
				activateError: null,
			}
		case 'activate/success':
			return {
				...state,
				activateLoading: false,
				activateConfirmOpen: false,
				activateError: null,
			}
		case 'activate/error':
			return {
				...state,
				activateLoading: false,
				activateConfirmOpen: false,
				activateError: action.error,
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
				vclFocus: 'list',
				versionSelectedIndex: 0,
				selectedVersionNumber: null,
				backendSelectedIndex: 0,
				selectedBackendName: null,
				backendDetails: null,
				backendDetailsLoading: false,
				backendDetailsError: null,
				backendCreateMode: false,
				backendEditMode: false,
				backendEditFieldIndex: 0,
				backendEditValues: {},
				backendSaveLoading: false,
				backendSaveError: null,
				snippetSelectedIndex: 0,
				vclSelectedIndex: 0,
				selectedVclName: null,
				vclDetails: null,
				vclDetailsLoading: false,
				vclDetailsError: null,
				domainSelectedIndex: 0,
				selectedSnippetName: null,
				snippetDetails: null,
				snippetDetailsLoading: false,
				snippetDetailsError: null,
				versionDetails: null,
				versionDetailsLoading: false,
				versionDetailsError: null,
				cloneConfirmOpen: false,
				cloneLoading: false,
				cloneError: null,
				activateConfirmOpen: false,
				activateLoading: false,
				activateError: null,
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
				backendCreateMode: false,
				backendEditMode: false,
				backendEditFieldIndex: 0,
				backendEditValues: {},
				backendSaveLoading: false,
				backendSaveError: null,
				selectedVclName: null,
				vclDetails: null,
				vclDetailsLoading: false,
				vclDetailsError: null,
				selectedSnippetName: null,
				snippetDetails: null,
				snippetDetailsLoading: false,
				snippetDetailsError: null,
				cloneConfirmOpen: false,
				cloneLoading: false,
				cloneError: null,
				activateConfirmOpen: false,
				activateLoading: false,
				activateError: null,
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
				backendCreateMode: false,
				backendEditMode: false,
				backendEditFieldIndex: 0,
				backendEditValues: {},
				backendSaveLoading: false,
				backendSaveError: null,
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
		case 'backend/create-start':
			return {
				...state,
				backendCreateMode: true,
				backendEditMode: true,
				backendEditFieldIndex: 0,
				backendEditValues: action.values,
				backendSaveError: null,
			}
		case 'backend/edit-start':
			return {
				...state,
				backendCreateMode: false,
				backendEditMode: true,
				backendEditFieldIndex: 0,
				backendEditValues: action.values,
				backendSaveError: null,
			}
		case 'backend/edit-cancel':
			return {
				...state,
				backendCreateMode: false,
				backendEditMode: false,
				backendEditFieldIndex: 0,
				backendEditValues: {},
				backendSaveLoading: false,
				backendSaveError: null,
			}
		case 'backend/edit-field':
			return {
				...state,
				backendEditFieldIndex: action.index,
			}
		case 'backend/edit-value':
			return {
				...state,
				backendEditValues: {
					...state.backendEditValues,
					[action.key]: action.value,
				},
			}
		case 'backend/save-start':
			return {
				...state,
				backendSaveLoading: true,
				backendSaveError: null,
			}
		case 'backend/save-success':
			return {
				...state,
				backendSaveLoading: false,
				backendCreateMode: false,
				backendEditMode: false,
				backendSaveError: null,
			}
		case 'backend/save-error':
			return {
				...state,
				backendSaveLoading: false,
				backendSaveError: action.error,
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
		case 'vcl/select':
			return {
				...state,
				selectedVclName: action.name,
			}
		case 'vcl/details-loading':
			return {
				...state,
				vclDetailsLoading: true,
				vclDetailsError: null,
				vclDetails: null,
			}
		case 'vcl/details-loaded':
			return {
				...state,
				vclDetailsLoading: false,
				vclDetailsError: null,
				vclDetails: action.vcl,
			}
		case 'vcl/details-error':
			return {
				...state,
				vclDetailsLoading: false,
				vclDetailsError: action.error,
				vclDetails: null,
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
		case 'vcl/focus':
			return {
				...state,
				vclFocus: action.focus,
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
		case 'screen/vcl':
			return {
				...state,
				screen: 'vcl',
				vclFocus: 'list',
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
				vclFocus: 'list',
				versionSelectedIndex: 0,
				selectedVersionNumber: null,
				backendSelectedIndex: 0,
				selectedBackendName: null,
				backendDetails: null,
				backendDetailsLoading: false,
				backendDetailsError: null,
				backendCreateMode: false,
				backendEditMode: false,
				backendEditFieldIndex: 0,
				backendEditValues: {},
				backendSaveLoading: false,
				backendSaveError: null,
				snippetSelectedIndex: 0,
				vclSelectedIndex: 0,
				selectedVclName: null,
				vclDetails: null,
				vclDetailsLoading: false,
				vclDetailsError: null,
				domainSelectedIndex: 0,
				selectedSnippetName: null,
				snippetDetails: null,
				snippetDetailsLoading: false,
				snippetDetailsError: null,
				versionDetails: null,
				versionDetailsLoading: false,
				versionDetailsError: null,
				cloneConfirmOpen: false,
				cloneLoading: false,
				cloneError: null,
				activateConfirmOpen: false,
				activateLoading: false,
				activateError: null,
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
