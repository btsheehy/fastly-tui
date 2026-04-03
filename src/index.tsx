import { createCliRenderer, TextAttributes } from '@opentui/core'
import { createRoot, useKeyboard, useRenderer } from '@opentui/react'
import { useEffect } from 'react'
import { installApiLogger } from './api-logger'
import {
	activateServiceVersion,
	cloneServiceVersion,
	listServiceVersions,
	listServices,
} from './fastly-client'
import { BackendScreen } from './screens/backend-screen'
import { ServiceScreen } from './screens/service-screen'
import { SnippetScreen } from './screens/snippet-screen'
import { VclScreen } from './screens/vcl-screen'
import { ServicesPalette } from './screens/services-palette'
import { AppStateProvider, useAppState } from './state'

function AppShell() {
	installApiLogger()
	const { state, dispatch } = useAppState()
	const renderer = useRenderer()

	useEffect(() => {
		let cancelled = false

		const loadServices = async () => {
			dispatch({ type: 'services/loading' })
			try {
				const services = await listServices()
				if (!cancelled) {
					dispatch({ type: 'services/loaded', services })
				}
			} catch (error) {
				if (cancelled) {
					return
				}
				const message =
					error instanceof Error ? error.message : 'Failed to load services'
				dispatch({ type: 'services/error', error: message })
			}
		}

		loadServices()
		return () => {
			cancelled = true
		}
	}, [dispatch])

	useKeyboard((key) => {
		const isEscape = key.name === 'escape' || key.name === 'esc'
		const isEnter = key.name === 'enter' || key.name === 'return'
		const isTab = key.name === 'tab'
		const isUp = key.name === 'up'
		const isDown = key.name === 'down'
		const isYes = key.name === 'y' || key.name === 'Y'
		const isNo = key.name === 'n' || key.name === 'N'

		if (key.ctrl && key.name === 'c') {
			renderer.stop()
			renderer.destroy()
			return
		}

		if (key.name === 'q' && !key.ctrl && !key.meta) {
			renderer.stop()
			renderer.destroy()
			return
		}

		if (state.screen === 'vcl') {
			if (isEscape || key.name === 'backspace') {
				dispatch({ type: 'screen/service' })
			}
			if (isTab) {
				dispatch({
					type: 'vcl/focus',
					focus: state.vclFocus === 'list' ? 'content' : 'list',
				})
			}
			return
		}

		if (state.screen === 'snippet') {
			if (state.snippetEditMode) {
				return
			}
			if (isEscape || key.name === 'backspace') {
				dispatch({ type: 'screen/service' })
			}
			if (isTab && !state.snippetEditMode) {
				dispatch({
					type: 'snippet/focus',
					focus: state.snippetFocus === 'list' ? 'content' : 'list',
				})
			}
			return
		}

		if (state.screen === 'service') {
			if (state.activateConfirmOpen) {
				if (isYes) {
					const serviceId = state.selectedServiceId
					const versionNumber = state.selectedVersionNumber
					if (!serviceId || versionNumber === null) {
						dispatch({
							type: 'activate/error',
							error: 'Select a version to activate.',
						})
						return
					}

					const runActivate = async () => {
						dispatch({ type: 'activate/start' })
						try {
							const activated = await activateServiceVersion(
								serviceId,
								versionNumber,
							)
							const versions = await listServiceVersions(serviceId)
							dispatch({
								type: 'services/versions-update',
								serviceId,
								versions,
							})

							const activeVersion = versions.find((v) => v.active)
							const sortedVersions = [...versions].sort(
								(a, b) => (b.number ?? 0) - (a.number ?? 0),
							)
							const orderedVersions = [
								...(activeVersion ? [activeVersion] : []),
								...sortedVersions.filter(
									(version) => version.number !== activeVersion?.number,
								),
							]
							const selectedIndex = Math.max(
								0,
								orderedVersions.findIndex(
									(version) => version.number === activated.number,
								),
							)

							dispatch({
								type: 'version/select',
								versionNumber: activated.number,
							})
							dispatch({ type: 'version/selection-set', index: selectedIndex })
							dispatch({ type: 'activate/success' })
						} catch (error) {
							const message =
								error instanceof Error
									? error.message
									: 'Failed to activate version'
							dispatch({ type: 'activate/error', error: message })
						}
					}

					void runActivate()
				}

				if (isNo || isEscape || key.name === 'backspace') {
					dispatch({ type: 'activate/confirm-close' })
				}

				return
			}

			if (state.cloneConfirmOpen) {
				if (isYes) {
					const serviceId = state.selectedServiceId
					const versionNumber = state.selectedVersionNumber
					if (!serviceId || versionNumber === null) {
						dispatch({
							type: 'clone/error',
							error: 'Select a version to clone.',
						})
						return
					}

					const runClone = async () => {
						dispatch({ type: 'clone/start' })
						try {
							const clone = await cloneServiceVersion(serviceId, versionNumber)
							const versions = await listServiceVersions(serviceId)
							dispatch({
								type: 'services/versions-update',
								serviceId,
								versions,
							})

							const activeVersion = versions.find((v) => v.active)
							const sortedVersions = [...versions].sort(
								(a, b) => (b.number ?? 0) - (a.number ?? 0),
							)
							const orderedVersions = [
								...(activeVersion ? [activeVersion] : []),
								...sortedVersions.filter(
									(version) => version.number !== activeVersion?.number,
								),
							]
							const selectedIndex = Math.max(
								0,
								orderedVersions.findIndex(
									(version) => version.number === clone.number,
								),
							)

							dispatch({
								type: 'version/select',
								versionNumber: clone.number,
							})
							dispatch({ type: 'version/selection-set', index: selectedIndex })
							dispatch({ type: 'clone/success' })
						} catch (error) {
							const message =
								error instanceof Error
									? error.message
									: 'Failed to clone version'
							dispatch({ type: 'clone/error', error: message })
						}
					}

					void runClone()
				}

				if (isNo || isEscape || key.name === 'backspace') {
					dispatch({ type: 'clone/confirm-close' })
				}

				return
			}

			if (isEscape || key.name === 'backspace') {
				dispatch({ type: 'screen/services' })
			}
			if (key.name === 'c' && !key.ctrl && !key.meta) {
				if (state.selectedVersionNumber === null) {
					dispatch({
						type: 'clone/error',
						error: 'Select a version to clone.',
					})
					return
				}
				dispatch({ type: 'clone/confirm-open' })
				return
			}
			if (key.name === 'a' && key.shift && !key.ctrl && !key.meta) {
				if (state.selectedVersionNumber === null) {
					dispatch({
						type: 'activate/error',
						error: 'Select a version to activate.',
					})
					return
				}
				dispatch({ type: 'activate/confirm-open' })
				return
			}
			if (isTab) {
				const focusOrder = [
					'versions',
					'backends',
					'snippets',
					'vcls',
					'domains',
				] as const
				const currentIndex = focusOrder.indexOf(state.serviceFocus)
				const delta = key.shift ? -1 : 1
				const nextIndex =
					(currentIndex + delta + focusOrder.length) % focusOrder.length
				dispatch({ type: 'service/focus', focus: focusOrder[nextIndex] })
			}
			return
		}

		if (state.screen !== 'services') {
			return
		}

		if (isTab) {
			dispatch({
				type: 'focus/set',
				focus: state.focus === 'filter' ? 'list' : 'filter',
			})
			return
		}

		if (key.sequence === '/' && !key.ctrl && !key.meta) {
			dispatch({ type: 'focus/set', focus: 'filter' })
			return
		}

		if (isEscape) {
			if (state.focus === 'list') {
				dispatch({ type: 'focus/set', focus: 'filter' })
			} else if (state.filter) {
				dispatch({ type: 'filter/set', value: '' })
			}
			return
		}

		if (state.focus === 'filter' && (isUp || isDown || isEnter)) {
			dispatch({ type: 'focus/set', focus: 'list' })
		}
	})

	return (
		<box flexGrow={1} flexDirection="column" padding={1} gap={1}>
			<box flexDirection="row" justifyContent="space-between">
				<text attributes={TextAttributes.BOLD}>Fastly TUI</text>
				<text attributes={TextAttributes.DIM}>Services</text>
			</box>
			{state.screen === 'services' ? <ServicesPalette /> : null}
			{state.screen === 'service' ? <ServiceScreen /> : null}
			{state.screen === 'snippet' ? <SnippetScreen /> : null}
			{state.screen === 'backend' ? <BackendScreen /> : null}
			{state.screen === 'vcl' ? <VclScreen /> : null}
			<box flexDirection="row" justifyContent="space-between">
				<text attributes={TextAttributes.DIM}>
					{state.screen === 'services'
						? '/ focus filter  tab switch  enter open  esc back  q quit'
						: state.screen === 'snippet'
							? 'tab switch panel  arrows move  enter load  esc back  q quit'
							: state.screen === 'backend'
								? 'arrows move  enter load  esc back  q quit'
								: state.screen === 'vcl'
									? 'arrows move  enter load  esc back  q quit'
									: 'tab switch panel  arrows scroll  enter load  esc back  q quit'}
				</text>
				<text attributes={TextAttributes.DIM}>
					{state.servicesLoaded ? `${state.services.length} services` : ''}
				</text>
			</box>
		</box>
	)
}

function App() {
	return (
		<AppStateProvider>
			<AppShell />
		</AppStateProvider>
	)
}

const renderer = await createCliRenderer({ screenMode: 'alternate-screen' })
createRoot(renderer).render(<App />)
