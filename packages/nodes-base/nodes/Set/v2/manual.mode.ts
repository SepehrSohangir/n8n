import type {
	AssignmentCollectionValue,
	FieldType,
	IDataObject,
	IExecuteFunctions,
	INode,
	INodeExecutionData,
	INodeProperties,
	ISupplyDataFunctions,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import type { SetField, SetNodeOptions } from './helpers/interfaces';
import {
	parseJsonParameter,
	validateEntry,
	composeReturnItem,
	resolveRawData,
	prepareReturnItem,
} from './helpers/utils';
import { updateDisplayOptions } from '../../../utils/utilities';

const properties: INodeProperties[] = [
	{
		displayName: 'فیلدهای برای تنظیم',
		name: 'fields',
		placeholder: 'افزودن فیلد',
		type: 'fixedCollection',
		description: 'ویرایش فیلدهای موجود یا افزودن فیلدهای جدید برای تغییر داده خروجی',
		displayOptions: {
			show: {
				'@version': [3, 3.1, 3.2],
			},
		},
		typeOptions: {
			multipleValues: true,
			sortable: true,
		},
		default: {},
		options: [
			{
				name: 'values',
				displayName: 'مقادیر',
				values: [
					{
						displayName: 'نام',
						name: 'name',
						type: 'string',
						default: '',
						placeholder: 'مثلاً fieldName',
						description:
							'نام فیلد برای تنظیم مقدار آن. از نماد نقطه پشتیبانی می‌کند. مثال: data.person[0].name.',
						requiresDataPath: 'single',
					},
					{
						displayName: 'نوع',
						name: 'type',
						type: 'options',
						description: 'نوع مقدار فیلد',
						// eslint-disable-next-line n8n-nodes-base/node-param-options-type-unsorted-items
						options: [
							{
								name: 'رشته',
								value: 'stringValue',
							},
							{
								name: 'عدد',
								value: 'numberValue',
							},
							{
								name: 'بولین',
								value: 'booleanValue',
							},
							{
								name: 'آرایه',
								value: 'arrayValue',
							},
							{
								name: 'شیء',
								value: 'objectValue',
							},
						],
						default: 'stringValue',
					},
					{
						displayName: 'مقدار',
						name: 'stringValue',
						type: 'string',
						default: '',
						displayOptions: {
							show: {
								type: ['stringValue'],
							},
						},
						validateType: 'string',
						ignoreValidationDuringExecution: true,
					},
					{
						displayName: 'مقدار',
						name: 'numberValue',
						type: 'string',
						default: '',
						displayOptions: {
							show: {
								type: ['numberValue'],
							},
						},
						validateType: 'number',
						ignoreValidationDuringExecution: true,
					},
					{
						displayName: 'مقدار',
						name: 'booleanValue',
						type: 'options',
						default: 'true',
						options: [
							{
								name: 'درست',
								value: 'true',
							},
							{
								name: 'غلط',
								value: 'false',
							},
						],
						displayOptions: {
							show: {
								type: ['booleanValue'],
							},
						},
						validateType: 'boolean',
						ignoreValidationDuringExecution: true,
					},
					{
						displayName: 'مقدار',
						name: 'arrayValue',
						type: 'string',
						default: '',
						placeholder: 'مثلاً [ arrayItem1, arrayItem2, arrayItem3 ]',
						displayOptions: {
							show: {
								type: ['arrayValue'],
							},
						},
						validateType: 'array',
						ignoreValidationDuringExecution: true,
					},
					{
						displayName: 'مقدار',
						name: 'objectValue',
						type: 'json',
						default: '={}',
						typeOptions: {
							rows: 2,
						},
						displayOptions: {
							show: {
								type: ['objectValue'],
							},
						},
						validateType: 'object',
						ignoreValidationDuringExecution: true,
					},
				],
			},
		],
	},
	{
		displayName: 'فیلدهای برای تنظیم',
		name: 'assignments',
		type: 'assignmentCollection',
		displayOptions: {
			hide: {
				'@version': [3, 3.1, 3.2],
			},
		},
		default: {},
	},
];

const displayOptions = {
	show: {
		mode: ['manual'],
	},
};

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(
	this: IExecuteFunctions | ISupplyDataFunctions,
	item: INodeExecutionData,
	i: number,
	options: SetNodeOptions,
	rawFieldsData: IDataObject,
	node: INode,
) {
	try {
		if (node.typeVersion < 3.3) {
			const fields = this.getNodeParameter('fields.values', i, []) as SetField[];

			const newData: IDataObject = {};

			for (const entry of fields) {
				if (
					entry.type === 'objectValue' &&
					rawFieldsData[entry.name] !== undefined &&
					entry.objectValue !== undefined &&
					entry.objectValue !== null
				) {
					entry.objectValue = parseJsonParameter(
						resolveRawData.call(this, rawFieldsData[entry.name] as string, i),
						node,
						i,
						entry.name,
					);
				}

				const { name, value } = validateEntry(
					entry.name,
					entry.type.replace('Value', '') as FieldType,
					entry[entry.type],
					node,
					i,
					options.ignoreConversionErrors,
					node.typeVersion,
				);
				newData[name] = value;
			}

			return composeReturnItem.call(this, i, item, newData, options, node.typeVersion);
		}

		const assignmentCollection = this.getNodeParameter(
			'assignments',
			i,
		) as AssignmentCollectionValue;

		return prepareReturnItem(this, assignmentCollection, i, item, node, options);
	} catch (error) {
		if (this.continueOnFail()) {
			return { json: { error: (error as Error).message }, pairedItem: { item: i } };
		}
		throw new NodeOperationError(this.getNode(), error as Error, {
			itemIndex: i,
			description: error.description,
		});
	}
}
