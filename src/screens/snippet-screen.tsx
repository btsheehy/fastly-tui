import { TextAttributes } from '@opentui/core'
import { useEffect } from 'react'
import type { SelectOption } from '@opentui/core'
import { useKeyboard, useRenderer } from '@opentui/react'
import {
	createSnippet,
	deleteSnippet,
	getServiceDetail,
	getSnippetDetail,
} from '../fastly-client'
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

const SNIPPET_EDIT_FIELDS = [
	{ key: 'name', label: 'Name' },
	{ key: 'type', label: 'Type' },
	{ key: 'priority', label: 'Priority' },
	{ key: 'dynamic', label: 'Dynamic (0/1)' },
] as const

function decodePaste(bytes: Uint8Array) {
	try {
		return new TextDecoder().decode(bytes)
	} catch {
		return ''
	}
}

export function SnippetScreen() {
	const { state, dispatch } = useAppState()
	const renderer = useRenderer()
	const snippets = state.versionDetails?.snippets ?? []
	const versionLocked = state.versionDetails?.locked ?? false
	const versionActive = state.versionDetails?.active ?? false
	const canEdit =
		Boolean(state.versionDetails) && !versionLocked && !versionActive

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

	const openEditor = async (initialContent: string) => {
		const editor = Bun.env.EDITOR
		if (!editor) {
			throw new Error('EDITOR is not set.')
		}
		const filePath = `/tmp/fastly-tui-snippet-${crypto.randomUUID()}.vcl`
		await Bun.write(filePath, initialContent)
		renderer.suspend()
		try {
			const proc = Bun.spawn({
				cmd: ['sh', '-c', `${editor} "${filePath.replace(/"/g, '\\"')}"`],
				stdin: 'inherit',
				stdout: 'inherit',
				stderr: 'inherit',
			})
			await proc.exited
		} finally {
			renderer.resume()
		}
		return Bun.file(filePath).text()
	}

	const startEdit = async (mode: 'edit' | 'create') => {
		if (!canEdit) {
			dispatch({
				type: 'snippet/save-error',
				error: 'Active or locked versions cannot be edited.',
			})
			return
		}

		try {
			const values: Record<string, string> = {
				name: mode === 'edit' ? (state.selectedSnippetName ?? '') : '',
				type: mode === 'edit' ? (state.snippetDetails?.type ?? '') : 'recv',
				priority:
					mode === 'edit' ? (state.snippetDetails?.priority ?? '100') : '100',
				dynamic: mode === 'edit' ? (state.snippetDetails?.dynamic ?? '0') : '0',
			}
			const content =
				mode === 'edit' ? (state.snippetDetails?.content ?? '') : ''
			const editedContent = await openEditor(content)
			dispatch({ type: 'snippet/content-set', content: editedContent })
			if (mode === 'edit') {
				dispatch({ type: 'snippet/edit-start', values, content: editedContent })
			} else {
				dispatch({
					type: 'snippet/create-start',
					values,
					content: editedContent,
				})
			}
		} catch (error) {
			const message =
				error instanceof Error ? error.message : 'Failed to open editor'
			dispatch({ type: 'snippet/save-error', error: message })
		}
	}

	const saveSnippet = async () => {
		const serviceId = state.selectedServiceId
		const versionNumber = state.selectedVersionNumber
		if (!serviceId || versionNumber === null) {
			dispatch({
				type: 'snippet/save-error',
				error: 'Select a version to edit.',
			})
			return
		}

		const name = state.snippetEditValues.name?.trim()
		const type = state.snippetEditValues.type?.trim()
		const priority = state.snippetEditValues.priority?.trim()
		const dynamic = state.snippetEditValues.dynamic?.trim() as '0' | '1' | ''
		const content = state.snippetContentDraft ?? ''

		if (!name) {
			dispatch({ type: 'snippet/save-error', error: 'Name is required.' })
			return
		}
		if (!type) {
			dispatch({ type: 'snippet/save-error', error: 'Type is required.' })
			return
		}

		dispatch({ type: 'snippet/save-start' })
		try {
			if (state.snippetCreateMode) {
				const created = await createSnippet(serviceId, versionNumber, {
					name,
					type,
					content,
					priority: priority || '100',
					dynamic: dynamic === '1' ? '1' : '0',
				})
				const details = await getServiceDetail(serviceId, versionNumber)
				dispatch({
					type: 'version/details-loaded',
					version: details.version ?? null,
				})
				dispatch({ type: 'snippet/details-loaded', snippet: created })
				dispatch({ type: 'snippet/select', name: created.name })
				if (details.version?.snippets?.length) {
					const index = details.version.snippets.findIndex(
						(item) => item.name === created.name,
					)
					if (index >= 0) {
						dispatch({ type: 'snippet/selection-set', index })
					}
				}
				dispatch({ type: 'snippet/save-success' })
				return
			}

			const originalName = state.selectedSnippetName
			if (!originalName) {
				throw new Error('Select a snippet to edit.')
			}
			await deleteSnippet(serviceId, versionNumber, originalName)
			const updated = await createSnippet(serviceId, versionNumber, {
				name,
				type,
				content,
				priority: priority || '100',
				dynamic: dynamic === '1' ? '1' : '0',
			})
			const details = await getServiceDetail(serviceId, versionNumber)
			dispatch({
				type: 'version/details-loaded',
				version: details.version ?? null,
			})
			dispatch({ type: 'snippet/details-loaded', snippet: updated })
			dispatch({ type: 'snippet/select', name: updated.name })
			if (details.version?.snippets?.length) {
				const index = details.version.snippets.findIndex(
					(item) => item.name === updated.name,
				)
				if (index >= 0) {
					dispatch({ type: 'snippet/selection-set', index })
				}
			}
			dispatch({ type: 'snippet/save-success' })
		} catch (error) {
			const message =
				error instanceof Error ? error.message : 'Failed to save snippet'
			dispatch({ type: 'snippet/save-error', error: message })
		}
	}

	useKeyboard((key) => {
		const isEscape = key.name === 'escape' || key.name === 'esc'
		const isTab = key.name === 'tab'

		if (state.screen !== 'snippet') {
			return
		}

		if (state.snippetEditMode) {
			if (isEscape) {
				dispatch({ type: 'snippet/edit-cancel' })
				return
			}
			if (isTab) {
				const delta = key.shift ? -1 : 1
				const nextIndex =
					(state.snippetEditFieldIndex + delta + SNIPPET_EDIT_FIELDS.length) %
					SNIPPET_EDIT_FIELDS.length
				dispatch({ type: 'snippet/edit-field', index: nextIndex })
				return
			}
			if (key.ctrl && key.name === 's') {
				void saveSnippet()
				return
			}
			if (
				key.ctrl &&
				(key.name === 'e' || key.name === 'return' || key.name === 'enter')
			) {
				void (async () => {
					try {
						const editedContent = await openEditor(state.snippetContentDraft)
						dispatch({ type: 'snippet/content-set', content: editedContent })
					} catch (error) {
						const message =
							error instanceof Error ? error.message : 'Failed to open editor'
						dispatch({ type: 'snippet/save-error', error: message })
					}
				})()
				return
			}
			return
		}

		if (key.name === 'e' && !key.ctrl && !key.meta) {
			void startEdit('edit')
			return
		}

		if (key.name === 'n' && !key.ctrl && !key.meta) {
			void startEdit('create')
		}
	})

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
					<text attributes={TextAttributes.DIM}>
						{state.snippetEditMode
							? state.snippetCreateMode
								? 'New snippet'
								: 'Edit snippet'
							: 'Snippet details'}
					</text>
					{state.snippetDetailsLoading ? (
						<text attributes={TextAttributes.DIM}>Loading snippet...</text>
					) : null}
					{state.snippetDetailsError ? (
						<text fg="red">{state.snippetDetailsError}</text>
					) : null}
					{state.snippetSaveError ? (
						<text fg="red">{state.snippetSaveError}</text>
					) : null}
					{state.snippetEditMode ? (
						<scrollbox flexGrow={1} minHeight={8}>
							{SNIPPET_EDIT_FIELDS.map((field, index) => (
								<box key={field.key} flexDirection="column" gap={0}>
									<text attributes={TextAttributes.DIM}>{field.label}</text>
									<input
										value={state.snippetEditValues[field.key] ?? ''}
										onInput={(value) => {
											if (typeof value !== 'string') {
												return
											}
											const sanitized = value.replace(/\r?\n/g, ' ')
											dispatch({
												type: 'snippet/edit-value',
												key: field.key,
												value: sanitized,
											})
										}}
										onPaste={(event) => {
											event.preventDefault()
											const current = state.snippetEditValues[field.key] ?? ''
											const pasted = decodePaste(event.bytes).replace(
												/\r?\n/g,
												' ',
											)
											dispatch({
												type: 'snippet/edit-value',
												key: field.key,
												value: `${current}${pasted}`,
											})
										}}
										placeholder={
											field.key === 'dynamic'
												? '0 or 1'
												: field.key === 'priority'
													? '100'
													: ''
										}
										focused={state.snippetEditFieldIndex === index}
									/>
								</box>
							))}
						</scrollbox>
					) : !state.snippetDetailsLoading && state.snippetDetails ? (
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
					) : (
						<text attributes={TextAttributes.DIM}>
							Select a snippet to load details.
						</text>
					)}
				</box>
				<box border padding={1} flexGrow={1} flexDirection="column" gap={1}>
					<text attributes={TextAttributes.DIM}>Content</text>
					{state.snippetEditMode ? (
						<box flexDirection="column" gap={1}>
							<text attributes={TextAttributes.DIM}>
								Ctrl+E open $EDITOR Ctrl+S save Esc cancel
							</text>
							<scrollbox
								focused={state.snippetFocus === 'content'}
								flexGrow={1}
							>
								{state.snippetContentDraft
									? state.snippetContentDraft
											.split('\n')
											.map((line, index) => (
												<text key={`snippet-edit-${index}`}>{line}</text>
											))
									: [
											<text key="snippet-empty" attributes={TextAttributes.DIM}>
												No content yet.
											</text>,
										]}
							</scrollbox>
						</box>
					) : !state.snippetDetailsLoading && state.snippetDetails ? (
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
