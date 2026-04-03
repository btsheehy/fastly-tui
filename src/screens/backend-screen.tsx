import { TextAttributes } from '@opentui/core'
import { useEffect } from 'react'
import type { SelectOption } from '@opentui/core'
import { useKeyboard } from '@opentui/react'
import {
	createBackend,
	getBackendDetail,
	getServiceDetail,
	updateBackend,
} from '../fastly-client'
import { useAppState } from '../state'

const BACKEND_EDIT_FIELDS = [
	{ key: 'name', label: 'Name', type: 'string' },
	{ key: 'address', label: 'Address', type: 'string' },
	{ key: 'hostname', label: 'Hostname', type: 'string' },
	{ key: 'port', label: 'Port', type: 'number' },
	{ key: 'use_ssl', label: 'Use SSL', type: 'boolean' },
	{ key: 'override_host', label: 'Override host', type: 'string' },
	{ key: 'healthcheck', label: 'Healthcheck', type: 'string' },
	{ key: 'auto_loadbalance', label: 'Auto loadbalance', type: 'boolean' },
	{ key: 'weight', label: 'Weight', type: 'number' },
	{ key: 'request_condition', label: 'Request condition', type: 'string' },
	{ key: 'connect_timeout', label: 'Connect timeout', type: 'number' },
	{ key: 'first_byte_timeout', label: 'First byte timeout', type: 'number' },
	{
		key: 'between_bytes_timeout',
		label: 'Between bytes timeout',
		type: 'number',
	},
	{ key: 'fetch_timeout', label: 'Fetch timeout', type: 'number' },
	{ key: 'max_conn', label: 'Max connections', type: 'number' },
	{ key: 'keepalive_time', label: 'Keepalive time', type: 'number' },
	{ key: 'tcp_keepalive_enable', label: 'TCP keepalive', type: 'boolean' },
	{ key: 'tcp_keepalive_time', label: 'TCP keepalive time', type: 'number' },
	{
		key: 'tcp_keepalive_interval',
		label: 'TCP keepalive interval',
		type: 'number',
	},
	{
		key: 'tcp_keepalive_probes',
		label: 'TCP keepalive probes',
		type: 'number',
	},
	{ key: 'share_key', label: 'Share key', type: 'string' },
	{ key: 'shield', label: 'Shield', type: 'string' },
	{ key: 'comment', label: 'Comment', type: 'string' },
	{ key: 'prefer_ipv6', label: 'Prefer IPv6', type: 'boolean' },
	{ key: 'ipv4', label: 'IPv4', type: 'string' },
	{ key: 'ipv6', label: 'IPv6', type: 'string' },
	{ key: 'min_tls_version', label: 'Min TLS', type: 'string' },
	{ key: 'max_tls_version', label: 'Max TLS', type: 'string' },
	{ key: 'ssl_check_cert', label: 'SSL check cert', type: 'boolean' },
	{ key: 'ssl_cert_hostname', label: 'SSL cert hostname', type: 'string' },
	{ key: 'ssl_hostname', label: 'SSL hostname', type: 'string' },
	{ key: 'ssl_sni_hostname', label: 'SSL SNI hostname', type: 'string' },
	{ key: 'ssl_ciphers', label: 'SSL ciphers', type: 'string' },
	{ key: 'ssl_ca_cert', label: 'SSL CA cert', type: 'string' },
	{ key: 'ssl_client_cert', label: 'SSL client cert', type: 'string' },
	{ key: 'ssl_client_key', label: 'SSL client key', type: 'string' },
	{ key: 'client_cert', label: 'Client cert', type: 'string' },
] as const

type BackendField = (typeof BACKEND_EDIT_FIELDS)[number]

function stringifyValue(value: unknown) {
	if (value === null || value === undefined) {
		return ''
	}
	if (typeof value === 'boolean') {
		return value ? 'true' : 'false'
	}
	return String(value)
}

function decodePaste(bytes: Uint8Array) {
	try {
		return new TextDecoder().decode(bytes)
	} catch {
		return ''
	}
}

export function BackendScreen() {
	const { state, dispatch } = useAppState()
	const backends = state.versionDetails?.backends ?? []
	const versionLocked = state.versionDetails?.locked ?? false
	const versionActive = state.versionDetails?.active ?? false
	const canEdit =
		Boolean(state.versionDetails) && !versionLocked && !versionActive

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

	const buildEditValues = (currentBackend: typeof backend) => {
		const values: Record<string, string> = {}
		if (!currentBackend) {
			return values
		}
		for (const field of BACKEND_EDIT_FIELDS) {
			values[field.key] = stringifyValue(
				currentBackend[field.key as keyof typeof currentBackend],
			)
		}
		return values
	}

	const parseEditValues = () => {
		const updates: Record<string, unknown> = {}
		for (const field of BACKEND_EDIT_FIELDS) {
			const raw = state.backendEditValues[field.key] ?? ''
			if (raw.trim() === '') {
				continue
			}
			if (field.type === 'number') {
				const value = Number(raw)
				if (Number.isNaN(value)) {
					throw new Error(`Invalid number for ${field.label}`)
				}
				updates[field.key] = value
				continue
			}
			if (field.type === 'boolean') {
				const lower = raw.trim().toLowerCase()
				if (lower === 'true') {
					updates[field.key] = true
				} else if (lower === 'false') {
					updates[field.key] = false
				} else {
					throw new Error(`Invalid boolean for ${field.label}`)
				}
				continue
			}
			updates[field.key] = raw
		}
		return updates
	}

	const saveBackend = async () => {
		const serviceId = state.selectedServiceId
		const versionNumber = state.selectedVersionNumber
		const backendName = backend?.name
		if (!serviceId || versionNumber === null) {
			dispatch({
				type: 'backend/save-error',
				error: 'Select a backend to edit.',
			})
			return
		}

		dispatch({ type: 'backend/save-start' })
		try {
			const updates = parseEditValues()
			if (state.backendCreateMode) {
				const name = updates.name as string | undefined
				if (!name) {
					throw new Error('Name is required.')
				}
				const hasAddress = Boolean(updates.address || updates.hostname)
				if (!hasAddress) {
					throw new Error('Address or hostname is required.')
				}
				const created = await createBackend(serviceId, versionNumber, updates)
				const details = await getServiceDetail(serviceId, versionNumber)
				dispatch({
					type: 'version/details-loaded',
					version: details.version ?? null,
				})
				dispatch({ type: 'backend/details-loaded', backend: created })
				dispatch({ type: 'backend/select', name: created.name })
				if (details.version?.backends?.length) {
					const index = details.version.backends.findIndex(
						(item) => item.name === created.name,
					)
					if (index >= 0) {
						dispatch({ type: 'backend/selection-set', index })
					}
				}
				dispatch({ type: 'backend/save-success' })
				return
			}

			if (!backendName) {
				throw new Error('Select a backend to edit.')
			}

			const updated = await updateBackend(
				serviceId,
				versionNumber,
				backendName,
				updates,
			)
			const details = await getServiceDetail(serviceId, versionNumber)
			dispatch({
				type: 'version/details-loaded',
				version: details.version ?? null,
			})
			dispatch({ type: 'backend/details-loaded', backend: updated })
			dispatch({ type: 'backend/select', name: updated.name })
			if (details.version?.backends?.length) {
				const index = details.version.backends.findIndex(
					(item) => item.name === updated.name,
				)
				if (index >= 0) {
					dispatch({ type: 'backend/selection-set', index })
				}
			}
			dispatch({ type: 'backend/save-success' })
		} catch (error) {
			const message =
				error instanceof Error ? error.message : 'Failed to update backend'
			dispatch({ type: 'backend/save-error', error: message })
		}
	}

	useKeyboard((key) => {
		const isEscape = key.name === 'escape' || key.name === 'esc'
		const isTab = key.name === 'tab'

		if (!state.screen || state.screen !== 'backend') {
			return
		}

		if (state.backendEditMode) {
			if (isEscape) {
				dispatch({ type: 'backend/edit-cancel' })
				return
			}
			if (isTab) {
				const delta = key.shift ? -1 : 1
				const nextIndex =
					(state.backendEditFieldIndex + delta + BACKEND_EDIT_FIELDS.length) %
					BACKEND_EDIT_FIELDS.length
				dispatch({ type: 'backend/edit-field', index: nextIndex })
				return
			}
			if (handleAddressFillShortcut(key)) {
				return
			}
			if (key.ctrl && key.name === 's') {
				void saveBackend()
			}
			return
		}

		if (isEscape || key.name === 'backspace') {
			dispatch({ type: 'screen/service' })
			return
		}

		if (key.name === 'e' && !key.ctrl && !key.meta) {
			if (!canEdit) {
				dispatch({
					type: 'backend/save-error',
					error: 'Active or locked versions cannot be edited.',
				})
				return
			}
			dispatch({ type: 'backend/edit-start', values: buildEditValues(backend) })
			return
		}

		if (key.name === 'n' && !key.ctrl && !key.meta) {
			if (!canEdit) {
				dispatch({
					type: 'backend/save-error',
					error: 'Active or locked versions cannot be edited.',
				})
				return
			}
			dispatch({ type: 'backend/create-start', values: {} })
		}
	})

	const handleAddressFillShortcut = (key: { name: string; ctrl: boolean }) => {
		if (!key.ctrl || (key.name !== 'enter' && key.name !== 'return')) {
			return false
		}
		const addressValue = state.backendEditValues.address?.trim()
		if (!addressValue) {
			return true
		}
		dispatch({
			type: 'backend/edit-value',
			key: 'hostname',
			value: addressValue,
		})
		dispatch({
			type: 'backend/edit-value',
			key: 'override_host',
			value: addressValue,
		})
		dispatch({
			type: 'backend/edit-value',
			key: 'ssl_cert_hostname',
			value: addressValue,
		})
		dispatch({
			type: 'backend/edit-value',
			key: 'ssl_sni_hostname',
			value: addressValue,
		})
		return true
	}

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
				<text attributes={TextAttributes.DIM}>
					{state.backendEditMode
						? state.backendCreateMode
							? 'New backend'
							: 'Edit backend'
						: 'Backend details'}
				</text>
				{state.backendDetailsLoading ? (
					<text attributes={TextAttributes.DIM}>Loading backend...</text>
				) : null}
				{state.backendDetailsError ? (
					<text fg="red">{state.backendDetailsError}</text>
				) : null}
				{state.backendSaveError ? (
					<text fg="red">{state.backendSaveError}</text>
				) : null}
				{state.backendEditMode ? (
					<scrollbox flexGrow={1} minHeight={8}>
						{BACKEND_EDIT_FIELDS.map((field, index) => (
							<box key={field.key} flexDirection="column" gap={0}>
								<text attributes={TextAttributes.DIM}>{field.label}</text>
								<input
									value={state.backendEditValues[field.key] ?? ''}
									onInput={(value) => {
										if (typeof value !== 'string') {
											return
										}
										const sanitized = value.replace(/\r?\n/g, ' ')
										dispatch({
											type: 'backend/edit-value',
											key: field.key,
											value: sanitized,
										})
									}}
									onPaste={(event) => {
										event.preventDefault()
										const current = state.backendEditValues[field.key] ?? ''
										const pasted = decodePaste(event.bytes).replace(
											/\r?\n/g,
											' ',
										)
										dispatch({
											type: 'backend/edit-value',
											key: field.key,
											value: `${current}${pasted}`,
										})
									}}
									placeholder={
										field.type === 'boolean'
											? 'true/false'
											: field.type === 'number'
												? 'number'
												: ''
									}
									focused={state.backendEditFieldIndex === index}
								/>
							</box>
						))}
					</scrollbox>
				) : !state.backendDetailsLoading && backend ? (
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
				) : (
					<text attributes={TextAttributes.DIM}>
						Select a backend to load details.
					</text>
				)}
				{state.backendEditMode ? (
					<text attributes={TextAttributes.DIM}>
						Tab/Shift+Tab move Ctrl+S save esc cancel
					</text>
				) : (
					<text attributes={TextAttributes.DIM}>
						{canEdit
							? 'e edit  n new  esc back'
							: state.versionDetails
								? 'Version is active or locked'
								: 'Load a version to edit'}
					</text>
				)}
				{state.backendSaveLoading ? (
					<text attributes={TextAttributes.DIM}>Saving backend...</text>
				) : null}
			</box>
		</box>
	)
}
