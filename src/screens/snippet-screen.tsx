import { TextAttributes } from '@opentui/core'
import { useEffect } from 'react'
import type { SelectOption } from '@opentui/core'
import { getSnippetDetail } from '../fastly-client'
import { useAppState } from '../state'

const SNIPPET_TYPE_ORDER = [
	'init',
	'recv',
	'hit',
	'miss',
	'pass',
	'fetch',
	'deliver',
	'error',
	'log',
] as const

const SNIPPET_TYPE_ORDER_MAP = new Map(
	SNIPPET_TYPE_ORDER.map((type, index) => [type, index]),
)

function getSnippetTypeOrder(type: string) {
	return SNIPPET_TYPE_ORDER_MAP.get(type) ?? SNIPPET_TYPE_ORDER.length
}

export function SnippetScreen() {
	const { state, dispatch } = useAppState()
	const snippets = state.versionDetails?.snippets ?? []

	const sortedSnippets = [...snippets].sort((a, b) => {
		const orderA = getSnippetTypeOrder(a.type)
		const orderB = getSnippetTypeOrder(b.type)
		if (orderA !== orderB) {
			return orderA - orderB
		}
		return a.priority - b.priority
	})

	const snippetOptions: SelectOption[] = []
	let lastType: string | null = null

	for (const snippet of sortedSnippets) {
		if (snippet.type !== lastType) {
			snippetOptions.push({
				name: `─ ${snippet.type.toUpperCase()} ─`,
				description: '',
				value: null,
			})
			lastType = snippet.type
		}
		snippetOptions.push({
			name: snippet.name,
			description: snippet.type,
			value: snippet.name,
		})
	}

	const normalizeSnippetIndex = (index: number, direction = 1) => {
		if (snippetOptions.length === 0) {
			return 0
		}

		let nextIndex = Math.min(Math.max(index, 0), snippetOptions.length - 1)

		while (
			snippetOptions[nextIndex] &&
			snippetOptions[nextIndex].value === null
		) {
			const candidate = nextIndex + direction
			if (candidate < 0 || candidate >= snippetOptions.length) {
				break
			}
			nextIndex = candidate
		}

		return nextIndex
	}

	const selectedSnippetIndex = snippetOptions.length
		? normalizeSnippetIndex(
				Math.min(state.snippetSelectedIndex, snippetOptions.length - 1),
			)
		: 0

	useEffect(() => {
		let cancelled = false

		const loadSnippetDetails = async (
			serviceId: string,
			versionNumber: number,
			snippetName: string,
		) => {
			dispatch({ type: 'snippet/details-loading' })
			try {
				const snippet = await getSnippetDetail(
					serviceId,
					versionNumber,
					snippetName,
				)
				if (!cancelled) {
					dispatch({ type: 'snippet/details-loaded', snippet })
				}
			} catch (error) {
				if (cancelled) {
					return
				}
				const message =
					error instanceof Error ? error.message : 'Failed to load snippet'
				dispatch({ type: 'snippet/details-error', error: message })
			}
		}

		if (
			state.selectedServiceId &&
			state.selectedVersionNumber !== null &&
			state.selectedSnippetName
		) {
			loadSnippetDetails(
				state.selectedServiceId,
				state.selectedVersionNumber,
				state.selectedSnippetName,
			)
		}

		return () => {
			cancelled = true
		}
	}, [
		dispatch,
		state.selectedServiceId,
		state.selectedVersionNumber,
		state.selectedSnippetName,
	])

	const formatTimestamp = (value?: string | Date) => {
		if (!value) {
			return 'n/a'
		}
		if (value instanceof Date) {
			return value.toISOString()
		}
		return value
	}

	return (
		<box flexGrow={1} flexDirection="row" gap={1}>
			<box
				width="22%"
				minWidth={20}
				border
				padding={1}
				flexDirection="column"
				gap={1}
			>
				<text attributes={TextAttributes.DIM}>Snippets</text>
				{snippetOptions.length === 0 ? (
					<text attributes={TextAttributes.DIM}>No snippets found.</text>
				) : (
					<select
						options={snippetOptions}
						selectedIndex={selectedSnippetIndex}
						focused={state.snippetFocus === 'list'}
						showDescription
						showScrollIndicator
						minHeight={8}
						flexGrow={1}
						onChange={(index) =>
							dispatch({
								type: 'snippet/selection-set',
								index: normalizeSnippetIndex(
									index,
									index >= state.snippetSelectedIndex ? 1 : -1,
								),
							})
						}
						onSelect={(_, option) => {
							const name = option?.value as string | undefined
							if (name) {
								dispatch({ type: 'snippet/select', name })
							}
						}}
					/>
				)}
			</box>
			<box flexGrow={1} flexDirection="column" gap={1}>
				<box
					border
					padding={1}
					flexDirection="column"
					gap={1}
					minHeight={10}
					flexShrink={0}
				>
					<text attributes={TextAttributes.DIM}>Snippet details</text>
					{state.snippetDetailsLoading ? (
						<text attributes={TextAttributes.DIM}>Loading snippet...</text>
					) : null}
					{state.snippetDetailsError ? (
						<text fg="red">{state.snippetDetailsError}</text>
					) : null}
					{!state.snippetDetailsLoading && state.snippetDetails ? (
						<box flexDirection="row" gap={2}>
							<box flexDirection="column" gap={1} width="50%" maxWidth="50%">
								<text truncate>Name: {state.snippetDetails.name}</text>
								<text truncate>Type: {state.snippetDetails.type}</text>
								{state.snippetDetails.priority ? (
									<text truncate>
										Priority: {state.snippetDetails.priority}
									</text>
								) : null}
							</box>
							<box flexDirection="column" gap={1} width="50%" maxWidth="50%">
								<text truncate>
									Dynamic: {state.snippetDetails.dynamic === '1' ? 'Yes' : 'No'}
								</text>
								<text truncate>
									Updated: {formatTimestamp(state.snippetDetails.updated_at)}
								</text>
								<text truncate>
									Created: {formatTimestamp(state.snippetDetails.created_at)}
								</text>
							</box>
						</box>
					) : null}
					{!state.snippetDetailsLoading && !state.snippetDetails ? (
						<text attributes={TextAttributes.DIM}>
							Select a snippet to load details.
						</text>
					) : null}
				</box>
				<box border padding={1} flexGrow={1} flexDirection="column" gap={1}>
					<text attributes={TextAttributes.DIM}>Content</text>
					{!state.snippetDetailsLoading && state.snippetDetails ? (
						<scrollbox
							focused={state.snippetFocus === 'content'}
							flexGrow={1}
							minHeight={8}
						>
							{state.snippetDetails.content.split('\n').map((line, index) => (
								<text key={`snippet-content-${index}`}>{line}</text>
							))}
						</scrollbox>
					) : (
						<text attributes={TextAttributes.DIM}>
							Select a snippet to view content.
						</text>
					)}
				</box>
			</box>
		</box>
	)
}
