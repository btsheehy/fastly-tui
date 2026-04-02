import { TextAttributes } from '@opentui/core'
import { useEffect } from 'react'
import type { SelectOption } from '@opentui/core'
import { getVclDetail } from '../fastly-client'
import { useAppState } from '../state'

export function VclScreen() {
	const { state, dispatch } = useAppState()
	const vcls = state.versionDetails?.vcls ?? []

	const vclOptions: SelectOption[] = vcls
		.slice()
		.sort((a, b) => a.name.localeCompare(b.name))
		.map((vcl) => ({
			name: vcl.name,
			description: vcl.main ? 'main' : '',
			value: vcl.name,
		}))

	const selectedVclIndex = vclOptions.length
		? Math.min(state.vclSelectedIndex, vclOptions.length - 1)
		: 0

	useEffect(() => {
		let cancelled = false

		const loadVclDetails = async (
			serviceId: string,
			versionNumber: number,
			vclName: string,
		) => {
			dispatch({ type: 'vcl/details-loading' })
			try {
				const vcl = await getVclDetail(serviceId, versionNumber, vclName)
				if (!cancelled) {
					dispatch({ type: 'vcl/details-loaded', vcl })
				}
			} catch (error) {
				if (cancelled) {
					return
				}
				const message =
					error instanceof Error ? error.message : 'Failed to load VCL'
				dispatch({ type: 'vcl/details-error', error: message })
			}
		}

		if (
			state.selectedServiceId &&
			state.selectedVersionNumber !== null &&
			state.selectedVclName
		) {
			loadVclDetails(
				state.selectedServiceId,
				state.selectedVersionNumber,
				state.selectedVclName,
			)
		}

		return () => {
			cancelled = true
		}
	}, [
		dispatch,
		state.selectedServiceId,
		state.selectedVersionNumber,
		state.selectedVclName,
	])

	const vcl = state.vclDetails

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
				<text attributes={TextAttributes.DIM}>VCLs</text>
				{vclOptions.length === 0 ? (
					<text attributes={TextAttributes.DIM}>No VCLs found.</text>
				) : (
					<select
						options={vclOptions}
						selectedIndex={selectedVclIndex}
						focused={state.vclFocus === 'list'}
						showDescription
						showScrollIndicator
						minHeight={8}
						flexGrow={1}
						onChange={(index) =>
							dispatch({
								type: 'vcl/selection-set',
								index: Math.max(index, 0),
							})
						}
						onSelect={(_, option) => {
							const name = option?.value as string | undefined
							if (name) {
								dispatch({ type: 'vcl/select', name })
							}
						}}
					/>
				)}
			</box>
			<box border padding={1} flexGrow={1} flexDirection="column" gap={1}>
				<text attributes={TextAttributes.DIM}>VCL details</text>
				{state.vclDetailsLoading ? (
					<text attributes={TextAttributes.DIM}>Loading VCL...</text>
				) : null}
				{state.vclDetailsError ? (
					<text fg="red">{state.vclDetailsError}</text>
				) : null}
				{!state.vclDetailsLoading && vcl ? (
					<box flexDirection="column" gap={0}>
						<text>Name: {vcl.name}</text>
						<text>Main: {vcl.main ? 'Yes' : 'No'}</text>
						{vcl.content ? (
							<scrollbox
								minHeight={8}
								flexGrow={1}
								focused={state.vclFocus === 'content'}
							>
								{vcl.content.split('\n').map((line, index) => (
									<text key={`vcl-line-${index}`}>{line}</text>
								))}
							</scrollbox>
						) : (
							<text attributes={TextAttributes.DIM}>No content.</text>
						)}
					</box>
				) : null}
				{!state.vclDetailsLoading && !vcl ? (
					<text attributes={TextAttributes.DIM}>
						Select a VCL to load details.
					</text>
				) : null}
			</box>
		</box>
	)
}
