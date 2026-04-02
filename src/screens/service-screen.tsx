import { TextAttributes } from '@opentui/core'
import { useEffect } from 'react'
import type { SelectOption } from '@opentui/core'
import { getServiceDetail } from '../fastly-client'
import { useAppState } from '../state'

export function ServiceScreen() {
	const { state, dispatch } = useAppState()
	const snippetTypeOrder = [
		'init',
		'recv',
		'hash',
		'hit',
		'miss',
		'pass',
		'fetch',
		'deliver',
		'error',
		'log',
		'none',
	] as const
	const snippetTypeOrderMap = new Map(
		snippetTypeOrder.map((type, index) => [type, index]),
	)

	const service = state.selectedServiceId
		? state.services.find((item) => item.id === state.selectedServiceId)
		: null

	const activeVersion = service?.versions?.find((version) => version.active)
	const versionList = service?.versions ?? []
	const sortedVersions = [...versionList].sort((a, b) => {
		const aNumber = a.number ?? 0
		const bNumber = b.number ?? 0
		return bNumber - aNumber
	})
	const activeId = activeVersion?.number
	const orderedVersions = [
		...(activeVersion ? [activeVersion] : []),
		...sortedVersions.filter((version) => version.number !== activeId),
	]
	const displayVersions = orderedVersions.slice(0, 15)

	useEffect(() => {
		if (
			state.screen !== 'service' ||
			state.selectedVersionNumber !== null ||
			!activeVersion?.number
		) {
			return
		}

		dispatch({ type: 'version/select', versionNumber: activeVersion.number })
		dispatch({ type: 'version/selection-set', index: 0 })
	}, [
		activeVersion?.number,
		dispatch,
		state.screen,
		state.selectedVersionNumber,
	])

	const formatVersionLine = (version: (typeof displayVersions)[number]) => {
		const parts: string[] = [`${version.number}`]
		if (version.active) {
			parts.push('✅')
		} else if (version.locked) {
			parts.push('🔒')
		}
		return parts.join(' ')
	}

	const details = state.versionDetails

	const versionOptions: SelectOption[] = displayVersions.map((version) => ({
		name: formatVersionLine(version),
		description: '',
		value: version.number,
	}))

	const backendOptions: SelectOption[] = (details?.backends ?? [])
		.map((backend) => ({
			name: backend.name,
			description: backend.address,
			value: backend.name,
		}))
		.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))

	const snippetOptions: SelectOption[] = (() => {
		const snippets = details?.snippets ?? []
		const sorted = [...snippets].sort((a, b) => {
			const orderA = snippetTypeOrderMap.get(a.type) ?? snippetTypeOrder.length
			const orderB = snippetTypeOrderMap.get(b.type) ?? snippetTypeOrder.length
			if (orderA !== orderB) {
				return orderA - orderB
			}
			return a.name.localeCompare(b.name)
		})

		const options: SelectOption[] = []
		let lastType: string | null = null
		for (const snippet of sorted) {
			if (snippet.type !== lastType) {
				options.push({
					name: `─ ${snippet.type.toUpperCase()} ─`,
					description: '',
					value: null,
				})
				lastType = snippet.type
			}
			options.push({
				name: snippet.name,
				description: snippet.type,
				value: snippet.name,
			})
		}

		return options
	})()

	const vclOptions: SelectOption[] = (details?.vcls ?? []).map((vcl) => ({
		name: vcl.name,
		description: vcl.main ? 'main' : '',
		value: vcl.name,
	}))

	const domainOptions: SelectOption[] = (details?.domains ?? []).map(
		(domain) => ({
			name: domain.name ?? '(unnamed)',
			description: '',
			value: domain.name ?? '(unnamed)',
		}),
	)

	const selectedVersionIndex = versionOptions.length
		? Math.min(state.versionSelectedIndex, versionOptions.length - 1)
		: 0
	const selectedBackendIndex = backendOptions.length
		? Math.min(state.backendSelectedIndex, backendOptions.length - 1)
		: 0
	const normalizeSnippetIndex = (index: number, direction = 1) => {
		if (snippetOptions.length === 0) {
			return 0
		}

		let nextIndex = Math.min(Math.max(index, 0), snippetOptions.length - 1)

		while (snippetOptions[nextIndex]?.value === null) {
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
	const selectedVclIndex = vclOptions.length
		? Math.min(state.vclSelectedIndex, vclOptions.length - 1)
		: 0
	const selectedDomainIndex = domainOptions.length
		? Math.min(state.domainSelectedIndex, domainOptions.length - 1)
		: 0

	useEffect(() => {
		let cancelled = false

		const loadVersionDetails = async (
			serviceId: string,
			versionNumber: number,
		) => {
			dispatch({ type: 'version/details-loading' })
			try {
				const details = await getServiceDetail(serviceId, versionNumber)
				const versionDetails = details.version ?? null
				if (!cancelled) {
					dispatch({ type: 'version/details-loaded', version: versionDetails })
				}
			} catch (error) {
				if (cancelled) {
					return
				}
				const message =
					error instanceof Error ? error.message : 'Failed to load version'
				dispatch({ type: 'version/details-error', error: message })
			}
		}

		if (state.selectedServiceId && state.selectedVersionNumber !== null) {
			loadVersionDetails(state.selectedServiceId, state.selectedVersionNumber)
		}

		return () => {
			cancelled = true
		}
	}, [dispatch, state.selectedServiceId, state.selectedVersionNumber])

	const formatTimestamp = (value?: string | Date) => {
		if (!value) {
			return 'n/a'
		}
		if (value instanceof Date) {
			return value.toISOString()
		}
		return value
	}

	const detailLines = details
		? [
				`Number: ${details.number}`,
				`Active: ${details.active ? 'Yes' : 'No'}`,
				`Locked: ${details.locked ? 'Yes' : 'No'}`,
				`Staging: ${details.staging ? 'Yes' : 'No'}`,
				`Testing: ${details.testing ? 'Yes' : 'No'}`,
				`Created: ${formatTimestamp(details.created_at)}`,
				`Updated: ${formatTimestamp(details.updated_at)}`,
				details.comment ? `Comment: ${details.comment}` : 'Comment: n/a',
			]
		: []

	const versionDetailsLineCount = details
		? detailLines.length
		: state.versionDetailsLoading || state.versionDetailsError
			? 1
			: 1
	const versionDetailsHeight = Math.max(9, versionDetailsLineCount + 4)
	const versionRowHeight = versionDetailsHeight + 2

	const renderSelectBox = (
		title: string,
		options: SelectOption[],
		selectedIndex: number,
		focusTarget: typeof state.serviceFocus,
		onChange: (index: number) => void,
		onSelect?: (option: SelectOption | null) => void,
	) => (
		<box border padding={1} flexDirection="column" gap={1} flexGrow={1}>
			<text attributes={TextAttributes.DIM}>{title}</text>
			{options.length === 0 ? (
				<text attributes={TextAttributes.DIM}>No {title.toLowerCase()}.</text>
			) : (
				<select
					options={options}
					selectedIndex={selectedIndex}
					focused={state.serviceFocus === focusTarget}
					showDescription
					showScrollIndicator
					minHeight={4}
					height="100%"
					flexGrow={1}
					onChange={(index) => onChange(Math.max(index, 0))}
					onSelect={(_, option) => onSelect?.(option)}
				/>
			)}
		</box>
	)

	if (!service) {
		return (
			<box flexGrow={1} flexDirection="column" gap={1}>
				<box border padding={1}>
					<text>Service not found.</text>
				</box>
				<text attributes={TextAttributes.DIM}>Press Esc to return.</text>
			</box>
		)
	}

	return (
		<box flexGrow={1} flexDirection="column" gap={1}>
			<box
				border
				padding={1}
				flexDirection="row"
				gap={1}
				minHeight={2}
				flexShrink={0}
			>
				<text attributes={TextAttributes.BOLD}>{service.name}</text>
				<text attributes={TextAttributes.DIM}>{service.id}</text>
				<text>| {service.type?.toUpperCase() ?? 'UNKNOWN'}</text>
				<text>| Active version: {activeVersion?.number ?? 'n/a'}</text>
				<text>| {service.paused ? '⏸️' : '▶️'}</text>
			</box>
			<box flexGrow={1} flexDirection="row" gap={1}>
				<box width="30%" flexDirection="column" gap={1}>
					<box
						flexDirection="row"
						gap={1}
						minHeight={versionRowHeight}
						maxHeight={versionRowHeight}
						flexShrink={0}
					>
						<box
							border
							padding={1}
							flexDirection="column"
							gap={1}
							width={16}
							minHeight={versionDetailsHeight}
							maxHeight={versionDetailsHeight}
						>
							<text attributes={TextAttributes.DIM}>Versions</text>
							{displayVersions.length === 0 ? (
								<text attributes={TextAttributes.DIM}>No versions found.</text>
							) : (
								<select
									options={versionOptions}
									selectedIndex={selectedVersionIndex}
									focused={state.serviceFocus === 'versions'}
									showDescription={false}
									showScrollIndicator
									minHeight={versionDetailsHeight - 4}
									height="100%"
									flexGrow={1}
									onChange={(index) =>
										dispatch({
											type: 'version/selection-set',
											index: Math.max(index, 0),
										})
									}
									onSelect={(_, option) => {
										const versionNumber = option?.value as number | undefined
										if (typeof versionNumber === 'number') {
											dispatch({
												type: 'version/select',
												versionNumber,
											})
										}
									}}
								/>
							)}
						</box>
						<box
							border
							padding={1}
							flexDirection="column"
							gap={1}
							flexGrow={1}
							minHeight={versionDetailsHeight}
							maxHeight={versionDetailsHeight}
							overflow="hidden"
						>
							<text attributes={TextAttributes.DIM}>Version details</text>
							{state.versionDetailsLoading ? (
								<text attributes={TextAttributes.DIM}>Loading version...</text>
							) : null}
							{state.versionDetailsError ? (
								<text fg="red">{state.versionDetailsError}</text>
							) : null}
							{!state.versionDetailsLoading && details
								? detailLines.map((line, index) => (
										<text key={`version-detail-${index}`}>{line}</text>
									))
								: null}
							{!state.versionDetailsLoading && !details ? (
								<text attributes={TextAttributes.DIM}>
									Select a version to load details.
								</text>
							) : null}
						</box>
					</box>
					<box flexDirection="row" gap={1} flexGrow={1} minHeight={0}>
						{renderSelectBox(
							'VCLs',
							vclOptions,
							selectedVclIndex,
							'vcls',
							(index) => dispatch({ type: 'vcl/selection-set', index }),
							(option) => {
								const name = option?.value as string | undefined
								if (name) {
									dispatch({ type: 'vcl/select', name })
									dispatch({ type: 'screen/vcl' })
								}
							},
						)}
						{renderSelectBox(
							'Domains',
							domainOptions,
							selectedDomainIndex,
							'domains',
							(index) => dispatch({ type: 'domain/selection-set', index }),
						)}
					</box>
				</box>
				<box flexGrow={1} flexDirection="row" gap={1}>
					{renderSelectBox(
						'Backends',
						backendOptions,
						selectedBackendIndex,
						'backends',
						(index) => dispatch({ type: 'backend/selection-set', index }),
						(option) => {
							const name = option?.value as string | undefined
							if (name) {
								dispatch({ type: 'backend/select', name })
								dispatch({ type: 'screen/backend' })
							}
						},
					)}
					{renderSelectBox(
						'Snippets',
						snippetOptions,
						selectedSnippetIndex,
						'snippets',
						(index) =>
							dispatch({
								type: 'snippet/selection-set',
								index: normalizeSnippetIndex(
									index,
									index >= state.snippetSelectedIndex ? 1 : -1,
								),
							}),
						(option) => {
							const name = option?.value as string | undefined
							if (name) {
								dispatch({ type: 'snippet/select', name })
								dispatch({ type: 'screen/snippet' })
							}
						},
					)}
				</box>
			</box>
			<text attributes={TextAttributes.DIM}>
				Press Esc to return to services.
			</text>
		</box>
	)
}
