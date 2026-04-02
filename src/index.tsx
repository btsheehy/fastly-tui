import { createCliRenderer, TextAttributes } from '@opentui/core'
import { createRoot, useKeyboard, useRenderer } from '@opentui/react'
import { useEffect } from 'react'
import { listServices } from './fastly-client'
import { BackendScreen } from './screens/backend-screen'
import { ServiceScreen } from './screens/service-screen'
import { SnippetScreen } from './screens/snippet-screen'
import { VclScreen } from './screens/vcl-screen'
import { ServicesPalette } from './screens/services-palette'
import { AppStateProvider, useAppState } from './state'

function AppShell() {
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

		if (state.screen === 'backend') {
			if (isEscape || key.name === 'backspace') {
				dispatch({ type: 'screen/service' })
			}
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
			if (isEscape || key.name === 'backspace') {
				dispatch({ type: 'screen/service' })
			}
			if (isTab) {
				dispatch({
					type: 'snippet/focus',
					focus: state.snippetFocus === 'list' ? 'content' : 'list',
				})
			}
			return
		}

		if (state.screen === 'service') {
			if (isEscape || key.name === 'backspace') {
				dispatch({ type: 'screen/services' })
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
