import type {
	IDisplayOptions,
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';

import { ROWS_LIMIT_DEFAULT } from '../../common/constants';
import { executeSelectMany, getSelectFields } from '../../common/selectMany';
import { getDataTableProxyExecute } from '../../common/utils';

export const FIELD: string = 'get';

const displayOptions: IDisplayOptions = {
	show: {
		resource: ['row'],
		operation: [FIELD],
	},
};

export const description: INodeProperties[] = [
	...getSelectFields(displayOptions),
	{
		displayName: 'برگرداندن همه',
		name: 'returnAll',
		type: 'boolean',
		displayOptions,
		default: false,
		description: 'همه نتایج را برگردانید بدون توجه به محدودیت',
	},
	{
		displayName: 'محدودیت',
		name: 'limit',
		type: 'number',
		displayOptions: {
			...displayOptions,
			show: {
				...displayOptions.show,
				returnAll: [false],
			},
		},
		typeOptions: {
			minValue: 1,
		},
		default: ROWS_LIMIT_DEFAULT,
		description: 'حداکثر تعداد ردیف‌هایی که باید برگردانده شوند',
	},
];

export async function execute(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const dataTableProxy = await getDataTableProxyExecute(this, index);

	return await executeSelectMany(this, index, dataTableProxy);
}
