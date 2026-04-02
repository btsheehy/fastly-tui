import { TextAttributes } from '@opentui/core'
import type { SelectOption } from '@opentui/core'
import type { Service } from 'fastly'
import { useAppState } from '../state'

function formatServiceDescription(service: Service) {
	const parts: string[] = [service.id]
	if (service.type) {
		parts.push(service.type.toUpperCase())
	}
	if (service.paused) {
		parts.push('PAUSED')
	}
	const activeVersion = service.versions?.find((version) => version.active)
	if (activeVersion) {
		parts.push(`v${activeVersion.number}`)
	}
	return parts.join(' · ')
}

function toSelectOption(service: Service): SelectOption {
	return {
		name: service.name ?? '(unnamed service)',
		description: formatServiceDescription(service),
		value: service,
	}
}

export function ServicesPalette() {
	const { state, dispatch } = useAppState()

	const query = state.filter.trim().toLowerCase()
	const filteredServices = query
		? state.services.filter((service) => {
				const name = service.name?.toLowerCase() ?? ''
				const id = service.id.toLowerCase()
				return name.includes(query) || id.includes(query)
			})
		: state.services

	const options = filteredServices.map((service) => toSelectOption(service))

	const selectedIndex = options.length
		? Math.min(state.selectedIndex, options.length - 1)
		: 0

	const showEmptyState =
		state.servicesLoaded && !state.servicesLoading && options.length === 0

	return (
		<box flexGrow={1} flexDirection="column" gap={1}>
			<box flexDirection="column" gap={1} border padding={1}>
				<box flexDirection="column" gap={1}>
					<text attributes={TextAttributes.DIM}>Service filter</text>
					<input
						value={state.filter}
						placeholder="Filter by name or id"
						focused={state.focus === 'filter'}
						onInput={(value) => dispatch({ type: 'filter/set', value })}
					/>
				</box>
				<box flexGrow={1} flexDirection="column" gap={1} minHeight={18}>
					<text attributes={TextAttributes.DIM}>Services</text>
					<select
						flexGrow={1}
						minHeight={16}
						options={options}
						selectedIndex={selectedIndex}
						focused={state.focus === 'list'}
						showDescription
						showScrollIndicator
						onChange={(index) =>
							dispatch({ type: 'selection/set', index: Math.max(index, 0) })
						}
						onSelect={(_, option) => {
							const service = option?.value as Service | undefined
							if (service?.id) {
								dispatch({ type: 'service/select', serviceId: service.id })
							}
						}}
					/>
				</box>
			</box>
			{state.servicesLoading ? (
				<text attributes={TextAttributes.DIM}>Loading services...</text>
			) : null}
			{state.servicesError ? <text fg="red">{state.servicesError}</text> : null}
			{showEmptyState ? (
				<text attributes={TextAttributes.DIM}>
					No services match your filter.
				</text>
			) : null}
		</box>
	)
}
