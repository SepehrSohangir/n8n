import {
	NodeOperationError,
	type IDisplayOptions,
	type IExecuteFunctions,
	type INodeExecutionData,
	type INodeProperties,
} from 'n8n-workflow';

import { makeAddRow, getAddRow } from '../../common/addRow';
import { DRY_RUN } from '../../common/fields';
import { getSelectFields, getSelectFilter } from '../../common/selectMany';
import { getDataTableProxyExecute, getDryRunParameter } from '../../common/utils';

export const FIELD: string = 'upsert';

const displayOptions: IDisplayOptions = {
	show: {
		resource: ['row'],
		operation: [FIELD],
	},
};

export const description: INodeProperties[] = [
	...getSelectFields(displayOptions),
	makeAddRow(FIELD, displayOptions),
	{
		displayName: 'تنظیمات',
		name: 'options',
		type: 'collection',
		default: {},
		placeholder: 'افزودن تنظیمات',
		options: [DRY_RUN],
		displayOptions,
	},
];

export async function execute(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const dataTableProxy = await getDataTableProxyExecute(this, index);
	const dryRun = getDryRunParameter(this, index);
	const row = getAddRow(this, index);
	const filter = await getSelectFilter(this, index);

	if (filter.filters.length === 0) {
		throw new NodeOperationError(this.getNode(), 'حداقل یک شرط نیاز است.');
	}

	const result = await dataTableProxy.upsertRow({
		data: row,
		filter,
		dryRun,
	});

	return result.map((json) => ({ json }));
}
