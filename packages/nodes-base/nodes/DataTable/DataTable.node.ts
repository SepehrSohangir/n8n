import type { IExecuteFunctions, INodeType, INodeTypeDescription } from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

import { router } from './actions/router';
import * as row from './actions/row/Row.resource';
import {
	getConditionsForColumn,
	getDataTableColumns,
	getDataTables,
	tableSearch,
} from './common/methods';

export class DataTable implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'جدول داده',
		name: 'dataTable',
		icon: 'fa:table',
		iconColor: 'orange-red',
		group: ['input', 'transform'],
		version: [1, 1.1],
		subtitle: '={{$parameter["action"]}}',
		description: 'ذخیره دائمی داده‌ها در طول اجرای گردش کار در یک جدول',
		defaults: {
			name: 'جدول داده',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		hints: [
			{
				message: 'جدول داده انتخاب شده ستونی ندارد.',
				displayCondition:
					'={{ $parameter.dataTableId !== "" && $parameter?.columns?.mappingMode === "defineBelow" && !$parameter?.columns?.schema?.length }}',
				whenToDisplay: 'beforeExecution',
				location: 'ndv',
				type: 'info',
			},
		],
		properties: [
			{
				displayName: 'منبع',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'ردیف',
						value: 'row',
					},
				],
				default: 'row',
			},
			...row.description,
		],
	};

	methods = {
		listSearch: {
			tableSearch,
		},
		loadOptions: {
			getDataTableColumns,
			getConditionsForColumn,
		},
		resourceMapping: {
			getDataTables,
		},
	};

	async execute(this: IExecuteFunctions) {
		return await router.call(this);
	}
}
