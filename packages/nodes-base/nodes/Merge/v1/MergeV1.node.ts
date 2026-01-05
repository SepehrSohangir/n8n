import get from 'lodash/get';
import type {
	IExecuteFunctions,
	GenericValue,
	INodeExecutionData,
	INodeType,
	INodeTypeBaseDescription,
	INodeTypeDescription,
	IPairedItemData,
} from 'n8n-workflow';
import { NodeConnectionTypes, deepCopy } from 'n8n-workflow';

import { oldVersionNotice } from '@utils/descriptions';

import { generatePairedItemData } from '../../../utils/utilities';

export class MergeV1 implements INodeType {
	description: INodeTypeDescription;

	constructor(baseDescription: INodeTypeBaseDescription) {
		this.description = {
			...baseDescription,
			version: 1,
			defaults: {
				name: 'ادغام',
				color: '#00bbcc',
			},

			inputs: [NodeConnectionTypes.Main, NodeConnectionTypes.Main],
			outputs: [NodeConnectionTypes.Main],
			inputNames: ['ورودی ۱', 'ورودی ۲'],
			properties: [
				oldVersionNotice,
				{
					displayName: 'حالت',
					name: 'mode',
					type: 'options',
					options: [
						{
							name: 'افزودن',
							value: 'append',
							description:
								'ترکیب داده‌های هر دو ورودی. خروجی شامل آیتم‌های ورودی ۱ و ورودی ۲ خواهد بود.',
						},
						{
							name: 'نگه‌داشتن تطابق‌های کلیدی',
							value: 'keepKeyMatches',
							description: 'داده ورودی ۱ را نگه می‌دارد اگر با داده ورودی ۲ تطابق پیدا کند',
						},
						{
							name: 'ادغام بر اساس ایندکس',
							value: 'mergeByIndex',
							description:
								'ادغام داده‌های هر دو ورودی. خروجی شامل آیتم‌های ورودی ۱ ادغام شده با داده ورودی ۲ خواهد بود. ادغام بر اساس ایندکس آیتم‌ها انجام می‌شود. بنابراین اولین آیتم ورودی ۱ با اولین آیتم ورودی ۲ ادغام می‌شود و به همین ترتیب.',
						},
						{
							name: 'ادغام بر اساس کلید',
							value: 'mergeByKey',
							description:
								'ادغام داده‌های هر دو ورودی. خروجی شامل آیتم‌های ورودی ۱ ادغام شده با داده ورودی ۲ خواهد بود. ادغام بر اساس یک کلید تعریف شده انجام می‌شود.',
						},
						{
							name: 'چندگانه',
							value: 'multiplex',
							description:
								'هر مقدار از یک ورودی را با هر مقدار از ورودی دیگر ادغام می‌کند. خروجی شامل (m * n) آیتم خواهد بود که (m) و (n) طول ورودی‌ها هستند.',
						},
						{
							name: 'عبور',
							value: 'passThrough',
							description:
								'داده یک ورودی را عبور می‌دهد. خروجی فقط شامل آیتم‌های ورودی تعریف شده خواهد بود.',
						},
						{
							name: 'حذف تطابق‌های کلیدی',
							value: 'removeKeyMatches',
							description: 'داده ورودی ۱ را نگه می‌دارد اگر با داده ورودی ۲ تطابق پیدا نکند',
						},
						{
							name: 'انتظار',
							value: 'wait',
							description:
								'تا زمانی که داده هر دو ورودی در دسترس باشد منتظر می‌ماند و سپس یک آیتم خالی خروجی می‌دهد. نودهای منبع باید به هر دو ورودی ۱ و ۲ متصل شوند. این نود فقط از ۲ منبع پشتیبانی می‌کند، اگر به منابع بیشتری نیاز دارید، چندین نود ادغام را به صورت سری وصل کنید. این نود هیچ داده‌ای خروجی نمی‌دهد.',
						},
					],
					default: 'append',
					description: 'نحوه ادغام داده شاخه‌ها',
				},
				{
					displayName: 'اتصال',
					name: 'join',
					type: 'options',
					displayOptions: {
						show: {
							mode: ['mergeByIndex'],
						},
					},
					options: [
						{
							name: 'اتصال داخلی',
							value: 'inner',
							description:
								'به اندازه هر دو ورودی ادغام می‌کند. (مثال: ورودی۱ = ۵ آیتم، ورودی۲ = ۳ آیتم | خروجی شامل ۳ آیتم خواهد بود).',
						},
						{
							name: 'اتصال چپ',
							value: 'left',
							description:
								'به اندازه ورودی اول ادغام می‌کند. (مثال: ورودی۱ = ۳ آیتم، ورودی۲ = ۵ آیتم | خروجی شامل ۳ آیتم خواهد بود).',
						},
						{
							name: 'اتصال خارجی',
							value: 'outer',
							description:
								'به اندازه ورودی با بیشترین آیتم ادغام می‌کند. (مثال: ورودی۱ = ۳ آیتم، ورودی۲ = ۵ آیتم | خروجی شامل ۵ آیتم خواهد بود).',
						},
					],
					default: 'left',
					description: 'خروجی چند آیتم خواهد داشت اگر ورودی‌ها تعداد متفاوتی از آیتم‌ها داشته باشند',
				},
				{
					displayName: 'ویژگی ورودی ۱',
					name: 'propertyName1',
					type: 'string',
					default: '',
					hint: 'نام فیلد به صورت متن (مثال: "id")',
					required: true,
					displayOptions: {
						show: {
							mode: ['keepKeyMatches', 'mergeByKey', 'removeKeyMatches'],
						},
					},
					description: 'نام ویژگی که تعیین می‌کند کدام آیتم‌های ورودی ۱ ادغام شوند',
				},
				{
					displayName: 'ویژگی ورودی ۲',
					name: 'propertyName2',
					type: 'string',
					default: '',
					hint: 'نام فیلد به صورت متن (مثال: "id")',
					required: true,
					displayOptions: {
						show: {
							mode: ['keepKeyMatches', 'mergeByKey', 'removeKeyMatches'],
						},
					},
					description: 'نام ویژگی که تعیین می‌کند کدام آیتم‌های ورودی ۲ ادغام شوند',
				},
				{
					displayName: 'داده خروجی',
					name: 'output',
					type: 'options',
					displayOptions: {
						show: {
							mode: ['passThrough'],
						},
					},
					options: [
						{
							name: 'ورودی ۱',
							value: 'input1',
						},
						{
							name: 'ورودی ۲',
							value: 'input2',
						},
					],
					default: 'input1',
					description: 'تعیین می‌کند داده کدام ورودی به عنوان خروجی نود استفاده شود',
				},
				{
					displayName: 'بازنویسی',
					name: 'overwrite',
					type: 'options',
					displayOptions: {
						show: {
							mode: ['mergeByKey'],
						},
					},
					options: [
						{
							name: 'همیشه',
							value: 'always',
							description: 'همیشه همه چیز را بازنویسی می‌کند',
						},
						{
							name: 'اگر خالی باشد',
							value: 'blank',
							description: 'فقط مقادیر "null"، "undefined" یا رشته خالی را بازنویسی می‌کند',
						},
						{
							name: 'اگر وجود نداشته باشد',
							value: 'undefined',
							description: 'فقط مقادیری را اضافه می‌کند که هنوز وجود ندارند',
						},
					],
					default: 'always',
					description: 'انتخاب زمان بازنویسی مقادیر از ورودی ۱ با مقادیر از ورودی ۲',
				},
			],
		};
	}

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const mode = this.getNodeParameter('mode', 0) as string;

		if (mode === 'append') {
			// Simply appends the data
			for (let i = 0; i < 2; i++) {
				returnData.push.apply(returnData, this.getInputData(i));
			}
		} else if (mode === 'mergeByIndex') {
			// Merges data by index

			const join = this.getNodeParameter('join', 0) as string;

			const dataInput1 = this.getInputData(0);
			const dataInput2 = this.getInputData(1);

			if (dataInput1 === undefined || dataInput1.length === 0) {
				if (['inner', 'left'].includes(join)) {
					// When "inner" or "left" join return empty if first
					// input does not contain any items
					return [returnData];
				}

				// For "outer" return data of second input
				return [dataInput2];
			}

			if (dataInput2 === undefined || dataInput2.length === 0) {
				if (['left', 'outer'].includes(join)) {
					// When "left" or "outer" join return data of first input
					return [dataInput1];
				}

				// For "inner" return empty
				return [returnData];
			}

			// Default "left"
			let numEntries = dataInput1.length;
			if (join === 'inner') {
				numEntries = Math.min(dataInput1.length, dataInput2.length);
			} else if (join === 'outer') {
				numEntries = Math.max(dataInput1.length, dataInput2.length);
			}

			let newItem: INodeExecutionData;
			for (let i = 0; i < numEntries; i++) {
				if (i >= dataInput1.length) {
					returnData.push(dataInput2[i]);
					continue;
				}
				if (i >= dataInput2.length) {
					returnData.push(dataInput1[i]);
					continue;
				}

				newItem = {
					json: {},
					pairedItem: [
						dataInput1[i].pairedItem as IPairedItemData,
						dataInput2[i].pairedItem as IPairedItemData,
					],
				};

				if (dataInput1[i].binary !== undefined) {
					newItem.binary = {};
					// Create a shallow copy of the binary data so that the old
					// data references which do not get changed still stay behind
					// but the incoming data does not get changed.
					Object.assign(newItem.binary, dataInput1[i].binary);
				}

				// Create also a shallow copy of the json data
				Object.assign(newItem.json, dataInput1[i].json);

				// Copy json data
				for (const key of Object.keys(dataInput2[i].json)) {
					newItem.json[key] = dataInput2[i].json[key];
				}

				// Copy binary data
				if (dataInput2[i].binary !== undefined) {
					if (newItem.binary === undefined) {
						newItem.binary = {};
					}

					for (const key of Object.keys(dataInput2[i].binary!)) {
						newItem.binary[key] = dataInput2[i].binary![key] ?? newItem.binary[key];
					}
				}

				returnData.push(newItem);
			}
		} else if (mode === 'multiplex') {
			const dataInput1 = this.getInputData(0);
			const dataInput2 = this.getInputData(1);

			if (!dataInput1 || !dataInput2) {
				return [returnData];
			}

			let entry1: INodeExecutionData;
			let entry2: INodeExecutionData;

			for (entry1 of dataInput1) {
				for (entry2 of dataInput2) {
					returnData.push({
						json: {
							...entry1.json,
							...entry2.json,
						},
						pairedItem: [
							entry1.pairedItem as IPairedItemData,
							entry2.pairedItem as IPairedItemData,
						],
					});
				}
			}
			return [returnData];
		} else if (['keepKeyMatches', 'mergeByKey', 'removeKeyMatches'].includes(mode)) {
			const dataInput1 = this.getInputData(0);
			if (!dataInput1) {
				// If it has no input data from first input return nothing
				return [returnData];
			}

			const propertyName1 = this.getNodeParameter('propertyName1', 0) as string;
			const propertyName2 = this.getNodeParameter('propertyName2', 0) as string;
			const overwrite = this.getNodeParameter('overwrite', 0, 'always') as string;

			const dataInput2 = this.getInputData(1);
			if (!dataInput2 || !propertyName1 || !propertyName2) {
				// Second input does not have any data or the property names are not defined
				if (mode === 'keepKeyMatches') {
					// For "keepKeyMatches" return nothing
					return [returnData];
				}

				// For "mergeByKey" and "removeKeyMatches" return the data from the first input
				return [dataInput1];
			}

			// Get the data to copy
			const copyData: {
				[key: string]: INodeExecutionData;
			} = {};
			let entry: INodeExecutionData;
			for (entry of dataInput2) {
				const key = get(entry.json, propertyName2);
				if (!entry.json || !key) {
					// Entry does not have the property so skip it
					continue;
				}

				copyData[key as string] = entry;
			}

			// Copy data on entries or add matching entries
			let referenceValue: GenericValue;
			let key: string;
			for (entry of dataInput1) {
				referenceValue = get(entry.json, propertyName1);

				if (referenceValue === undefined) {
					// Entry does not have the property

					if (mode === 'removeKeyMatches') {
						// For "removeKeyMatches" add item
						returnData.push(entry);
					}

					// For "mergeByKey" and "keepKeyMatches" skip item
					continue;
				}

				if (!['string', 'number'].includes(typeof referenceValue)) {
					if (referenceValue !== null && referenceValue.constructor.name !== 'Data') {
						// Reference value is not of comparable type

						if (mode === 'removeKeyMatches') {
							// For "removeKeyMatches" add item
							returnData.push(entry);
						}

						// For "mergeByKey" and "keepKeyMatches" skip item
						continue;
					}
				}

				if (typeof referenceValue === 'number') {
					referenceValue = referenceValue.toString();
				} else if (referenceValue !== null && referenceValue.constructor.name === 'Date') {
					referenceValue = (referenceValue as Date).toISOString();
				}

				if (copyData.hasOwnProperty(referenceValue as string)) {
					// Item with reference value got found

					if (['null', 'undefined'].includes(typeof referenceValue)) {
						// The reference value is null or undefined

						if (mode === 'removeKeyMatches') {
							// For "removeKeyMatches" add item
							returnData.push(entry);
						}

						// For "mergeByKey" and "keepKeyMatches" skip item
						continue;
					}

					// Match exists
					if (mode === 'removeKeyMatches') {
						// For "removeKeyMatches" we can skip the item as it has a match
						continue;
					} else if (mode === 'mergeByKey') {
						// Copy the entry as the data gets changed
						entry = deepCopy(entry);

						for (key of Object.keys(copyData[referenceValue as string].json)) {
							if (key === propertyName2) {
								continue;
							}

							// TODO: Currently only copies json data and no binary one
							const value = copyData[referenceValue as string].json[key];
							if (
								overwrite === 'always' ||
								(overwrite === 'undefined' && !entry.json.hasOwnProperty(key)) ||
								(overwrite === 'blank' && [null, undefined, ''].includes(entry.json[key] as string))
							) {
								entry.json[key] = value;
							}
						}
					} else {
						// For "keepKeyMatches" we add it as it is
						returnData.push(entry);
						continue;
					}
				} else {
					// No item for reference value got found
					if (mode === 'removeKeyMatches') {
						// For "removeKeyMatches" we can add it if not match got found
						returnData.push(entry);
						continue;
					}
				}

				if (mode === 'mergeByKey') {
					// For "mergeByKey" we always add the entry anyway but then the unchanged one
					returnData.push(entry);
				}
			}

			return [returnData];
		} else if (mode === 'passThrough') {
			const output = this.getNodeParameter('output', 0) as string;

			if (output === 'input1') {
				returnData.push.apply(returnData, this.getInputData(0));
			} else {
				returnData.push.apply(returnData, this.getInputData(1));
			}
		} else if (mode === 'wait') {
			const pairedItem = generatePairedItemData(this.getInputData(0).length);
			returnData.push({ json: {}, pairedItem });
		}

		return [returnData];
	}
}
