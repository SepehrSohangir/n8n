import { NodeConnectionTypes } from 'n8n-workflow';
import type {
	INodeTypeBaseDescription,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

import { removeDuplicateInputItems } from '../utils';

const versionDescription: INodeTypeDescription = {
	displayName: 'حذف تکراری‌ها',
	name: 'removeDuplicates',
	icon: 'file:removeDuplicates.svg',
	group: ['transform'],
	subtitle: '',
	version: [1, 1.1],
	description: 'حذف آیتم‌ها با مقادیر فیلد یکسان',
	defaults: {
		name: 'حذف تکراری‌ها',
	},
	inputs: [NodeConnectionTypes.Main],
	outputs: [NodeConnectionTypes.Main],
	properties: [
		{
			displayName: 'مقایسه',
			name: 'compare',
			type: 'options',
			options: [
				{
					name: 'همه فیلدها',
					value: 'allFields',
				},
				{
					name: 'همه فیلدها به جز',
					value: 'allFieldsExcept',
				},
				{
					name: 'فیلدهای انتخاب شده',
					value: 'selectedFields',
				},
			],
			default: 'allFields',
			description: 'فیلدهای آیتم‌های ورودی برای مقایسه جهت تشخیص یکسان بودن',
		},
		{
			displayName: 'فیلدهای برای حذف',
			name: 'fieldsToExclude',
			type: 'string',
			placeholder: 'مثلاً ایمیل، نام',
			requiresDataPath: 'multiple',
			description: 'فیلدهای ورودی برای حذف از مقایسه',
			default: '',
			displayOptions: {
				show: {
					compare: ['allFieldsExcept'],
				},
			},
		},
		{
			displayName: 'فیلدهای برای مقایسه',
			name: 'fieldsToCompare',
			type: 'string',
			placeholder: 'مثلاً ایمیل، نام',
			requiresDataPath: 'multiple',
			description: 'فیلدهای ورودی برای اضافه کردن به مقایسه',
			default: '',
			displayOptions: {
				show: {
					compare: ['selectedFields'],
				},
			},
		},
		{
			displayName: 'گزینه‌ها',
			name: 'options',
			type: 'collection',
			placeholder: 'افزودن فیلد',
			default: {},
			displayOptions: {
				show: {
					compare: ['allFieldsExcept', 'selectedFields'],
				},
			},
			options: [
				{
					displayName: 'غیرفعال کردن نماد نقطه',
					name: 'disableDotNotation',
					type: 'boolean',
					default: false,
					description:
						'آیا ارجاع به فیلدهای فرزند با استفاده از `parent.child` در نام فیلد مجاز نباشد',
				},
				{
					displayName: 'حذف فیلدهای دیگر',
					name: 'removeOtherFields',
					type: 'boolean',
					default: false,
					description:
						'آیا فیلدهایی که مقایسه نمی‌شوند حذف شوند. اگر غیرفعال باشد، مقادیر اولین تکراری‌ها حفظ می‌شوند.',
				},
			],
		},
	],
};
export class RemoveDuplicatesV1 implements INodeType {
	description: INodeTypeDescription;

	constructor(baseDescription: INodeTypeBaseDescription) {
		this.description = {
			...baseDescription,
			...versionDescription,
		};
	}

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		return removeDuplicateInputItems(this, items);
	}
}
