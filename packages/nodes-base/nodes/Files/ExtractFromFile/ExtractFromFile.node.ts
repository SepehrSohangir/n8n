import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

import * as moveTo from './actions/moveTo.operation';
import * as pdf from './actions/pdf.operation';
import * as spreadsheet from './actions/spreadsheet.operation';

export class ExtractFromFile implements INodeType {
	// eslint-disable-next-line n8n-nodes-base/node-class-description-missing-subtitle
	description: INodeTypeDescription = {
		displayName: 'استخراج از فایل',
		name: 'extractFromFile',
		icon: { light: 'file:extractFromFile.svg', dark: 'file:extractFromFile.dark.svg' },
		group: ['input'],
		version: [1, 1.1],
		description: 'تبدیل داده‌های باینری به JSON',
		defaults: {
			name: 'استخراج از فایل',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		properties: [
			{
				displayName: 'عملیات',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				// eslint-disable-next-line n8n-nodes-base/node-param-options-type-unsorted-items
				options: [
					{
						name: 'استخراج از CSV',
						value: 'csv',
						action: 'استخراج از CSV',
						description: 'تبدیل یک فایل CSV به آیتم‌های خروجی',
					},
					{
						name: 'استخراج از HTML',
						value: 'html',
						action: 'استخراج از HTML',
						description: 'تبدیل یک جدول در یک فایل HTML به آیتم‌های خروجی',
					},
					{
						name: 'استخراج از ICS',
						value: 'fromIcs',
						action: 'استخراج از ICS',
						description: 'تبدیل یک فایل ICS به آیتم‌های خروجی',
					},
					{
						name: 'استخراج از JSON',
						value: 'fromJson',
						action: 'استخراج از JSON',
						description: 'تبدیل یک فایل JSON به آیتم‌های خروجی',
					},
					{
						name: 'استخراج از ODS',
						value: 'ods',
						action: 'استخراج از ODS',
						description: 'تبدیل یک فایل ODS به آیتم‌های خروجی',
					},
					{
						name: 'استخراج از PDF',
						value: 'pdf',
						action: 'استخراج از PDF',
						description: 'استخراج محتوا و فراداده از یک فایل PDF',
					},
					{
						name: 'استخراج از RTF',
						value: 'rtf',
						action: 'استخراج از RTF',
						description: 'تبدیل یک جدول در یک فایل RTF به آیتم‌های خروجی',
					},
					{
						name: 'استخراج از فایل متنی',
						value: 'text',
						action: 'استخراج از فایل متنی',
						description: 'استخراج محتوای یک فایل متنی',
					},
					{
						name: 'استخراج از XML',
						value: 'xml',
						action: 'استخراج از XML',
						description: 'استخراج محتوای یک فایل XML',
					},
					{
						name: 'استخراج از XLS',
						value: 'xls',
						action: 'استخراج از XLS',
						description: 'تبدیل یک فایل اکسل به آیتم‌های خروجی',
					},
					{
						name: 'استخراج از XLSX',
						value: 'xlsx',
						action: 'استخراج از XLSX',
						description: 'تبدیل یک فایل اکسل به آیتم‌های خروجی',
					},
					{
						name: 'انتقال فایل به رشته Base64',
						value: 'binaryToPropery',
						action: 'انتقال فایل به رشته base64',
						description: 'تبدیل یک فایل به یک رشته کدگذاری شده با base64',
					},
				],
				default: 'csv',
			},
			...spreadsheet.description,
			...moveTo.description,
			...pdf.description,
		],
	};

	async execute(this: IExecuteFunctions) {
		const version = this.getNode().typeVersion;
		const items = this.getInputData();
		const operation = this.getNodeParameter('operation', 0);
		let returnData: INodeExecutionData[] = [];

		if (spreadsheet.operations.includes(operation)) {
			returnData = await spreadsheet.execute.call(this, items, 'operation', {
				failOnCsvBufferError: version > 1,
			});
		}

		if (['binaryToPropery', 'fromJson', 'text', 'fromIcs', 'xml'].includes(operation)) {
			returnData = await moveTo.execute.call(this, items, operation);
		}

		if (operation === 'pdf') {
			returnData = await pdf.execute.call(this, items);
		}

		return [returnData];
	}
}
