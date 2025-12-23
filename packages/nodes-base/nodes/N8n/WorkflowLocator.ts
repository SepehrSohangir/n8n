import type { ILoadOptionsFunctions, INodeListSearchResult, INodeProperties } from 'n8n-workflow';

import { apiRequestAllItems } from './GenericFunctions';

type DataItemsResponse<T> = {
	data: T[];
};

interface PartialWorkflow {
	id: number;
	name: string;
}

/**
 * A helper to populate workflow lists. It does a pseudo-search by
 * listing available workflows and matching with the specified query.
 */
export async function searchWorkflows(
	this: ILoadOptionsFunctions,
	query?: string,
): Promise<INodeListSearchResult> {
	const searchResults = (await apiRequestAllItems.call(
		this,
		'GET',
		'workflows',
		{},
	)) as DataItemsResponse<PartialWorkflow>;

	// Map the workflows list against a simple name/id filter, and sort
	// with the latest on top.
	const workflows = (searchResults as unknown as PartialWorkflow[])
		.map((w: PartialWorkflow) => ({
			name: `${w.name} (#${w.id})`,
			value: w.id,
		}))
		.filter(
			(w) =>
				!query ||
				w.name.toLowerCase().includes(query.toLowerCase()) ||
				w.value?.toString() === query,
		)
		.sort((a, b) => b.value - a.value);

	return {
		results: workflows,
	};
}

/**
 * A resourceLocator to enable looking up workflows by their ID.
 * This object can be used as a base and then extended as needed.
 */
export const workflowIdLocator: INodeProperties = {
	displayName: 'جریان کاری',
	name: 'workflowId',
	type: 'resourceLocator',
	default: { mode: 'list', value: '' },
	description: 'جریان کاری را انتخاب یا مشخص کنید',
	modes: [
		{
			displayName: 'از لیست',
			name: 'list',
			type: 'list',
			placeholder: 'Select a Workflow...',
			initType: 'workflow',
			typeOptions: {
				searchListMethod: 'searchWorkflows',
				searchFilterRequired: false,
				searchable: true,
			},
		},
		{
			displayName: 'با URL',
			name: 'url',
			type: 'string',
			placeholder: 'https://myinstance.app.n8n.cloud/workflow/1',
			validation: [
				{
					type: 'regex',
					properties: {
						regex: '.*/workflow/([0-9a-zA-Z]{1,})',
						errorMessage: 'Not a valid Workflow URL',
					},
				},
			],
			extractValue: {
				type: 'regex',
				regex: '.*/workflow/([0-9a-zA-Z]{1,})',
			},
		},
		{
			displayName: 'شناسه',
			name: 'id',
			type: 'string',
			validation: [
				{
					type: 'regex',
					properties: {
						regex: '[0-9a-zA-Z]{1,}',
						errorMessage: 'Not a valid Workflow ID',
					},
				},
			],
			placeholder: '1',
		},
	],
};
