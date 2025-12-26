import get from 'lodash/get';
import unset from 'lodash/unset';
import { NodeOperationError, deepCopy, NodeConnectionTypes } from 'n8n-workflow';
import type {
	IBinaryData,
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

import { prepareFieldsArray } from '../utils/utils';
import { FieldsTracker } from './utils';

export class SplitOut implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'تقسیم کردن',
		name: 'splitOut',
		icon: 'file:splitOut.svg',
		group: ['transform'],
		subtitle: '',
		version: 1,
		description: 'تبدیل یک لیست درون آیتم(ها) به آیتم‌های جداگانه',
		defaults: {
			name: 'تقسیم کردن',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		properties: [
			{
				displayName: 'فیلدهای برای تقسیم',
				name: 'fieldToSplitOut',
				type: 'string',
				default: '',
				required: true,
				placeholder: 'فیلدها را از سمت چپ بکشید یا نام آنها را تایپ کنید',
				description:
					'نام فیلدهای ورودی برای تقسیم به آیتم‌های جداگانه. چندین نام فیلد را با کاما جدا کنید. برای داده‌های باینری، از $binary استفاده کنید.',
				requiresDataPath: 'multiple',
				hint: 'برای تقسیم آیتم ورودی بر اساس داده‌های باینری از $binary استفاده کنید',
			},
			{
				displayName: 'شامل',
				name: 'include',
				type: 'options',
				options: [
					{
						name: 'هیچ فیلد دیگری',
						value: 'noOtherFields',
					},
					{
						name: 'همه فیلدهای دیگر',
						value: 'allOtherFields',
					},
					{
						name: 'فیلدهای دیگر انتخاب شده',
						value: 'selectedOtherFields',
					},
				],
				default: 'noOtherFields',
				description: 'آیا فیلدهای دیگر در آیتم‌های جدید کپی شوند',
			},
			{
				displayName: 'فیلدهای برای شامل کردن',
				name: 'fieldsToInclude',
				type: 'string',
				placeholder: 'مثلاً ایمیل، نام',
				requiresDataPath: 'multiple',
				description: 'فیلدهای ورودی برای جمع‌آوری با هم',
				default: '',
				displayOptions: {
					show: {
						include: ['selectedOtherFields'],
					},
				},
			},
			{
				displayName: 'گزینه‌ها',
				name: 'options',
				type: 'collection',
				placeholder: 'افزودن فیلد',
				default: {},
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
						displayName: 'نام فیلد مقصد',
						name: 'destinationFieldName',
						type: 'string',
						requiresDataPath: 'multiple',
						default: '',
						description: 'فیلدی در خروجی که محتویات فیلد تقسیم شده در آن قرار می‌گیرد',
					},
					{
						displayName: 'شامل باینری',
						name: 'includeBinary',
						type: 'boolean',
						default: false,
						description: 'آیا داده‌های باینری در آیتم‌های جدید گنجانده شوند',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];
		const items = this.getInputData();
		const fieldsTracker = new FieldsTracker();

		for (let i = 0; i < items.length; i++) {
			const fieldsToSplitOut = (this.getNodeParameter('fieldToSplitOut', i) as string)
				.split(',')
				.map((field) => field.trim().replace(/^\$json\./, ''));

			const options = this.getNodeParameter('options', i, {});

			const disableDotNotation = options.disableDotNotation as boolean;

			const destinationFields = ((options.destinationFieldName as string) || '')
				.split(',')
				.filter((field) => field.trim() !== '')
				.map((field) => field.trim());

			if (destinationFields.length && destinationFields.length !== fieldsToSplitOut.length) {
				throw new NodeOperationError(
					this.getNode(),
					'If multiple fields to split out are given, the same number of destination fields must be given',
				);
			}

			const include = this.getNodeParameter('include', i) as
				| 'selectedOtherFields'
				| 'allOtherFields'
				| 'noOtherFields';

			const multiSplit = fieldsToSplitOut.length > 1;

			const item = { ...items[i].json };
			const splited: INodeExecutionData[] = [];
			for (const [entryIndex, fieldToSplitOut] of fieldsToSplitOut.entries()) {
				const destinationFieldName = destinationFields[entryIndex] || '';

				let entityToSplit: IDataObject[] = [];

				if (fieldToSplitOut === '$binary') {
					entityToSplit = Object.entries(items[i].binary || {}).map(([key, value]) => ({
						[key]: value,
					}));
				} else {
					if (!disableDotNotation) {
						entityToSplit = get(item, fieldToSplitOut) as IDataObject[];
					} else {
						entityToSplit = item[fieldToSplitOut] as IDataObject[];
					}

					fieldsTracker.add(fieldToSplitOut);

					const entryExists = entityToSplit !== undefined;

					if (!entryExists) {
						entityToSplit = [];
					}

					fieldsTracker.update(fieldToSplitOut, entryExists);

					if (typeof entityToSplit !== 'object' || entityToSplit === null) {
						entityToSplit = [entityToSplit] as unknown as IDataObject[];
					}

					if (!Array.isArray(entityToSplit)) {
						entityToSplit = Object.values(entityToSplit);
					}
				}

				for (const [elementIndex, element] of entityToSplit.entries()) {
					if (splited[elementIndex] === undefined) {
						splited[elementIndex] = { json: {}, pairedItem: { item: i } };
					}

					const fieldName = destinationFieldName || fieldToSplitOut;

					if (fieldToSplitOut === '$binary') {
						if (splited[elementIndex].binary === undefined) {
							splited[elementIndex].binary = {};
						}
						splited[elementIndex].binary[Object.keys(element)[0]] = Object.values(
							element,
						)[0] as IBinaryData;

						continue;
					}

					if (typeof element === 'object' && element !== null && include === 'noOtherFields') {
						if (destinationFieldName === '' && !multiSplit) {
							splited[elementIndex] = {
								json: { ...splited[elementIndex].json, ...element },
								pairedItem: { item: i },
							};
						} else {
							splited[elementIndex].json[fieldName] = element;
						}
					} else {
						splited[elementIndex].json[fieldName] = element;
					}
				}
			}

			for (const splitEntry of splited) {
				let newItem: INodeExecutionData = splitEntry;

				if (include === 'allOtherFields') {
					const itemCopy = deepCopy(item);
					for (const fieldToSplitOut of fieldsToSplitOut) {
						if (!disableDotNotation) {
							unset(itemCopy, fieldToSplitOut);
						} else {
							delete itemCopy[fieldToSplitOut];
						}
					}
					newItem.json = { ...itemCopy, ...splitEntry.json };
				}

				if (include === 'selectedOtherFields') {
					const fieldsToInclude = prepareFieldsArray(
						this.getNodeParameter('fieldsToInclude', i, '') as string,
						'Fields To Include',
					);

					if (!fieldsToInclude.length) {
						throw new NodeOperationError(this.getNode(), 'No fields specified', {
							description: 'Please add a field to include',
						});
					}

					for (const field of fieldsToInclude) {
						if (!disableDotNotation) {
							splitEntry.json[field] = get(item, field);
						} else {
							splitEntry.json[field] = item[field];
						}
					}

					newItem = splitEntry;
				}

				const includeBinary = options.includeBinary as boolean;

				if (includeBinary) {
					if (items[i].binary && !newItem.binary) {
						newItem.binary = items[i].binary;
					}
				}

				returnData.push(newItem);
			}
		}

		const hints = fieldsTracker.getHints();

		if (hints.length) {
			this.addExecutionHints(...hints);
		}

		return [returnData];
	}
}
