import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

import * as iCall from './actions/iCall.operation';
import * as spreadsheet from './actions/spreadsheet.operation';
import * as toBinary from './actions/toBinary.operation';
import * as toJson from './actions/toJson.operation';
import * as toText from './actions/toText.operation';

export class ConvertToFile implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'تبدیل به فایل',
		name: 'convertToFile',
		icon: { light: 'file:convertToFile.svg', dark: 'file:convertToFile.dark.svg' },
		group: ['input'],
		version: [1, 1.1],
		description: 'تبدیل داده‌های JSON به داده‌های باینری',
		defaults: {
			name: 'تبدیل به فایل',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		properties: [
			{
				displayName: 'عملیات',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'تبدیل به CSV',
						value: 'csv',
						action: 'تبدیل به CSV',
						description: 'تبدیل داده‌های ورودی به یک فایل CSV',
					},
					{
						name: 'تبدیل به HTML',
						value: 'html',
						action: 'تبدیل به HTML',
						description: 'تبدیل داده‌های ورودی به یک جدول در یک فایل HTML',
					},
					{
						name: 'تبدیل به ICS',
						value: 'iCal',
						action: 'تبدیل به ICS',
						description: 'تبدیل هر آیتم ورودی به یک فایل رویداد ICS',
					},
					{
						name: 'تبدیل به JSON',
						value: 'toJson',
						action: 'تبدیل به JSON',
						description: 'تبدیل داده‌های ورودی به یک یا چند فایل JSON',
					},
					{
						name: 'تبدیل به ODS',
						value: 'ods',
						action: 'تبدیل به ODS',
						description: 'تبدیل داده‌های ورودی به یک فایل ODS',
					},
					{
						name: 'تبدیل به RTF',
						value: 'rtf',
						action: 'تبدیل به RTF',
						description: 'تبدیل داده‌های ورودی به یک جدول در یک فایل RTF',
					},
					{
						name: 'تبدیل به فایل متنی',
						value: 'toText',
						action: 'تبدیل به فایل متنی',
						description: 'تبدیل رشته داده‌های ورودی به یک فایل',
					},
					{
						name: 'تبدیل به XLS',
						value: 'xls',
						action: 'تبدیل به XLS',
						description: 'تبدیل داده‌های ورودی به یک فایل اکسل',
					},
					{
						name: 'تبدیل به XLSX',
						value: 'xlsx',
						action: 'تبدیل به XLSX',
						description: 'تبدیل داده‌های ورودی به یک فایل اکسل',
					},
					{
						name: 'انتقال رشته Base64 به فایل',
						value: 'toBinary',
						action: 'انتقال رشته base64 به فایل',
						description: 'تبدیل یک رشته کدگذاری شده با base64 به فرمت فایل اصلی آن',
					},
				],
				default: 'csv',
			},
			...spreadsheet.description,
			...toBinary.description,
			...toText.description,
			...toJson.description,
			...iCall.description,
		],
	};

	async execute(this: IExecuteFunctions) {
		const items = this.getInputData();
		const operation = this.getNodeParameter('operation', 0);
		let returnData: INodeExecutionData[] = [];

		if (spreadsheet.operations.includes(operation)) {
			returnData = await spreadsheet.execute.call(this, items, operation);
		}

		if (operation === 'toJson') {
			returnData = await toJson.execute.call(this, items);
		}

		if (operation === 'toBinary') {
			returnData = await toBinary.execute.call(this, items);
		}

		if (operation === 'toText') {
			returnData = await toText.execute.call(this, items);
		}

		if (operation === 'iCal') {
			returnData = await iCall.execute.call(this, items);
		}

		return [returnData];
	}
}
