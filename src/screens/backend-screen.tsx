import { TextAttributes } from '@opentui/core'
import { useEffect } from 'react'
import type { SelectOption } from '@opentui/core'
import { getBackendDetail } from '../fastly-client'
import { useAppState } from '../state'

export function BackendScreen() {
	const { state, dispatch } = useAppState()
	const backends = state.versionDetails?.backends ?? []

	const backendOptions: SelectOption[] = backends
		.slice()
		.sort((a, b) => a.name.localeCompare(b.name))
		.map((backend) => ({
			name: backend.name,
			description: backend.address,
			value: backend.name,
		}))

	const selectedBackendIndex = backendOptions.length
		? Math.min(state.backendSelectedIndex, backendOptions.length - 1)
		: 0

	useEffect(() => {
		let cancelled = false

		const loadBackendDetails = async (
			serviceId: string,
			versionNumber: number,
			backendName: string,
		) => {
			dispatch({ type: 'backend/details-loading' })
			try {
				const backend = await getBackendDetail(
					serviceId,
					versionNumber,
					backendName,
				)
				if (!cancelled) {
					dispatch({ type: 'backend/details-loaded', backend })
				}
			} catch (error) {
				if (cancelled) {
					return
				}
				const message =
					error instanceof Error ? error.message : 'Failed to load backend'
				dispatch({ type: 'backend/details-error', error: message })
			}
		}

		if (
			state.selectedServiceId &&
			state.selectedVersionNumber !== null &&
			state.selectedBackendName
		) {
			loadBackendDetails(
				state.selectedServiceId,
				state.selectedVersionNumber,
				state.selectedBackendName,
			)
		}

		return () => {
			cancelled = true
		}
	}, [
		dispatch,
		state.selectedServiceId,
		state.selectedVersionNumber,
		state.selectedBackendName,
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

	const backend = state.backendDetails

	return (
		<box flexGrow={1} flexDirection="row" gap={1}>
			<box
				width="25%"
				minWidth={22}
				border
				padding={1}
				flexDirection="column"
				gap={1}
			>
				<text attributes={TextAttributes.DIM}>Backends</text>
				{backendOptions.length === 0 ? (
					<text attributes={TextAttributes.DIM}>No backends found.</text>
				) : (
					<select
						options={backendOptions}
						selectedIndex={selectedBackendIndex}
						focused
						showDescription
						showScrollIndicator
						minHeight={8}
						flexGrow={1}
						onChange={(index) =>
							dispatch({
								type: 'backend/selection-set',
								index: Math.max(index, 0),
							})
						}
						onSelect={(_, option) => {
							const name = option?.value as string | undefined
							if (name) {
								dispatch({ type: 'backend/select', name })
							}
						}}
					/>
				)}
			</box>
			<box border padding={1} flexGrow={1} flexDirection="column" gap={1}>
				<text attributes={TextAttributes.DIM}>Backend details</text>
				{state.backendDetailsLoading ? (
					<text attributes={TextAttributes.DIM}>Loading backend...</text>
				) : null}
				{state.backendDetailsError ? (
					<text fg="red">{state.backendDetailsError}</text>
				) : null}
				{!state.backendDetailsLoading && backend ? (
					<box flexDirection="column" gap={0}>
						<text>Name: {backend.name}</text>
						<text>Address: {backend.address}</text>
						{backend.port ? <text>Port: {backend.port}</text> : null}
						<text>Use SSL: {backend.use_ssl ? 'Yes' : 'No'}</text>
						{backend.override_host ? (
							<text>Override host: {backend.override_host}</text>
						) : null}
						{backend.hostname ? (
							<text>Hostname: {backend.hostname}</text>
						) : null}
						{backend.healthcheck ? (
							<text>Healthcheck: {backend.healthcheck}</text>
						) : null}
						{backend.weight ? <text>Weight: {backend.weight}</text> : null}
						{backend.shield ? <text>Shield: {backend.shield}</text> : null}
						{backend.comment ? <text>Comment: {backend.comment}</text> : null}
						<text>Created: {formatTimestamp(backend.created_at)}</text>
						<text>Updated: {formatTimestamp(backend.updated_at)}</text>
					</box>
				) : null}
				{!state.backendDetailsLoading && !backend ? (
					<text attributes={TextAttributes.DIM}>
						Select a backend to load details.
					</text>
				) : null}
			</box>
		</box>
	)
}
