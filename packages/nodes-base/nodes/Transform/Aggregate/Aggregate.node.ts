import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import set from 'lodash/set';
import {
	NodeOperationError,
	type IDataObject,
	type IExecuteFunctions,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
	type IPairedItemData,
	NodeConnectionTypes,
	type NodeExecutionHint,
} from 'n8n-workflow';

import { addBinariesToItem } from './utils';
import { prepareFieldsArray } from '../utils/utils';

export class Aggregate implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'تجمیع',
		name: 'aggregate',
		icon: 'file:aggregate.svg',
		group: ['transform'],
		subtitle: '',
		version: 1,
		description: 'ترکیب یک فیلد از چندین آیتم در یک لیست در یک آیتم واحد',
		defaults: {
			name: 'تجمیع',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		properties: [
			{
				displayName: 'تجمیع',
				name: 'aggregate',
				type: 'options',
				default: 'aggregateIndividualFields',
				options: [
					{
						name: 'فیلدهای جداگانه',
						value: 'aggregateIndividualFields',
					},
					{
						name: 'همه داده‌های آیتم (در یک لیست واحد)',
						value: 'aggregateAllItemData',
					},
				],
			},
			{
				displayName: 'فیلدهای برای تجمیع',
				name: 'fieldsToAggregate',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				placeholder: 'افزودن فیلد برای تجمیع',
				default: { fieldToAggregate: [{ fieldToAggregate: '', renameField: false }] },
				displayOptions: {
					show: {
						aggregate: ['aggregateIndividualFields'],
					},
				},
				options: [
					{
						displayName: '',
						name: 'fieldToAggregate',
						values: [
							{
								displayName: 'نام فیلد ورودی',
								name: 'fieldToAggregate',
								type: 'string',
								default: '',
								description: 'نام فیلدی در آیتم‌های ورودی برای تجمیع با هم',
								// eslint-disable-next-line n8n-nodes-base/node-param-placeholder-miscased-id
								placeholder: 'مثلاً id',
								hint: 'نام فیلد را به صورت متن وارد کنید',
								requiresDataPath: 'single',
							},
							{
								displayName: 'تغییر نام فیلد',
								name: 'renameField',
								type: 'boolean',
								default: false,
								description: 'آیا فیلد در خروجی نام متفاوتی داشته باشد',
							},
							{
								displayName: 'نام فیلد خروجی',
								name: 'outputFieldName',
								displayOptions: {
									show: {
										renameField: [true],
									},
								},
								type: 'string',
								default: '',
								description:
									'نام فیلدی که داده‌های تجمیع شده در آن قرار می‌گیرد. برای استفاده از نام فیلد ورودی، خالی بگذارید.',
								requiresDataPath: 'single',
							},
						],
					},
				],
			},
			{
				displayName: 'قرار دادن خروجی در فیلد',
				name: 'destinationFieldName',
				type: 'string',
				displayOptions: {
					show: {
						aggregate: ['aggregateAllItemData'],
					},
				},
				default: 'data',
				description: 'نام فیلد خروجی برای قرار دادن داده‌ها',
			},
			{
				displayName: 'شامل',
				name: 'include',
				type: 'options',
				default: 'allFields',
				options: [
					{
						name: 'همه فیلدها',
						value: 'allFields',
					},
					{
						name: 'فیلدهای مشخص شده',
						value: 'specifiedFields',
					},
					{
						name: 'همه فیلدها به جز',
						value: 'allFieldsExcept',
					},
				],
				displayOptions: {
					show: {
						aggregate: ['aggregateAllItemData'],
					},
				},
			},
			{
				displayName: 'فیلدهای برای حذف',
				name: 'fieldsToExclude',
				type: 'string',
				placeholder: 'مثلاً ایمیل، نام',
				default: '',
				requiresDataPath: 'multiple',
				displayOptions: {
					show: {
						aggregate: ['aggregateAllItemData'],
						include: ['allFieldsExcept'],
					},
				},
			},
			{
				displayName: 'فیلدهای برای شامل کردن',
				name: 'fieldsToInclude',
				type: 'string',
				placeholder: 'مثلاً ایمیل، نام',
				default: '',
				requiresDataPath: 'multiple',
				displayOptions: {
					show: {
						aggregate: ['aggregateAllItemData'],
						include: ['specifiedFields'],
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
						displayOptions: {
							hide: {
								'/aggregate': ['aggregateAllItemData'],
							},
						},
					},
					{
						displayName: 'ادغام لیست‌ها',
						name: 'mergeLists',
						type: 'boolean',
						default: false,
						description:
							'آیا خروجی در یک لیست تخت واحد ادغام شود (به جای لیست لیست‌ها)، اگر فیلد برای تجمیع یک لیست باشد',
						displayOptions: {
							hide: {
								'/aggregate': ['aggregateAllItemData'],
							},
						},
					},
					{
						displayName: 'شامل باینری‌ها',
						name: 'includeBinaries',
						type: 'boolean',
						default: false,
						description: 'آیا داده‌های باینری در آیتم جدید گنجانده شوند',
					},
					{
						displayName: 'فقط باینری‌های منحصر به فرد را نگه دارید',
						name: 'keepOnlyUnique',
						type: 'boolean',
						default: false,
						description:
							'آیا فقط باینری‌های منحصر به فرد با مقایسه انواع MIME، انواع فایل، اندازه‌های فایل و پسوندهای فایل حفظ شوند',
						displayOptions: {
							show: {
								includeBinaries: [true],
							},
						},
					},
					{
						displayName: 'حفظ مقادیر گمشده و تهی',
						name: 'keepMissing',
						type: 'boolean',
						default: false,
						description:
							'آیا یک ورودی تهی به لیست تجمیع شده اضافه شود زمانی که یک مقدار گمشده یا تهی وجود دارد',
						displayOptions: {
							hide: {
								'/aggregate': ['aggregateAllItemData'],
							},
						},
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		let returnData: INodeExecutionData = { json: {}, pairedItem: [] };
		const items = this.getInputData();
		const notFoundedFields: { [key: string]: boolean[] } = {};

		const aggregate = this.getNodeParameter('aggregate', 0, '') as string;

		if (aggregate === 'aggregateIndividualFields') {
			const disableDotNotation = this.getNodeParameter(
				'options.disableDotNotation',
				0,
				false,
			) as boolean;
			const mergeLists = this.getNodeParameter('options.mergeLists', 0, false) as boolean;
			const fieldsToAggregate = this.getNodeParameter(
				'fieldsToAggregate.fieldToAggregate',
				0,
				[],
			) as [{ fieldToAggregate: string; renameField: boolean; outputFieldName: string }];
			const keepMissing = this.getNodeParameter('options.keepMissing', 0, false) as boolean;

			if (!fieldsToAggregate.length) {
				throw new NodeOperationError(this.getNode(), 'No fields specified', {
					description: 'Please add a field to aggregate',
				});
			}

			const newItem: INodeExecutionData = {
				json: {},
				pairedItem: Array.from({ length: items.length }, (_, i) => i).map((index) => {
					return {
						item: index,
					};
				}),
			};

			const values: { [key: string]: any } = {};
			const outputFields: string[] = [];

			for (const { fieldToAggregate, outputFieldName, renameField } of fieldsToAggregate) {
				const field = renameField ? outputFieldName : fieldToAggregate;

				if (outputFields.includes(field)) {
					throw new NodeOperationError(
						this.getNode(),
						`The '${field}' output field is used more than once`,
						{ description: 'Please make sure each output field name is unique' },
					);
				} else {
					outputFields.push(field);
				}

				const getFieldToAggregate = () =>
					!disableDotNotation && fieldToAggregate.includes('.')
						? fieldToAggregate.split('.').pop()
						: fieldToAggregate;

				const _outputFieldName = outputFieldName
					? outputFieldName
					: (getFieldToAggregate() as string);

				if (fieldToAggregate !== '') {
					values[_outputFieldName] = [];
					for (let i = 0; i < items.length; i++) {
						if (notFoundedFields[fieldToAggregate] === undefined) {
							notFoundedFields[fieldToAggregate] = [];
						}

						if (!disableDotNotation) {
							let value = get(items[i].json, fieldToAggregate);
							notFoundedFields[fieldToAggregate].push(value === undefined ? false : true);

							if (!keepMissing) {
								if (Array.isArray(value)) {
									value = value.filter((entry) => entry !== null);
								} else if (value === null || value === undefined) {
									continue;
								}
							}

							if (Array.isArray(value) && mergeLists) {
								values[_outputFieldName].push(...value);
							} else {
								values[_outputFieldName].push(value);
							}
						} else {
							let value = items[i].json[fieldToAggregate];
							notFoundedFields[fieldToAggregate].push(value === undefined ? false : true);

							if (!keepMissing) {
								if (Array.isArray(value)) {
									value = value.filter((entry) => entry !== null);
								} else if (value === null || value === undefined) {
									continue;
								}
							}

							if (Array.isArray(value) && mergeLists) {
								values[_outputFieldName].push(...value);
							} else {
								values[_outputFieldName].push(value);
							}
						}
					}
				}
			}

			for (const key of Object.keys(values)) {
				if (!disableDotNotation) {
					set(newItem.json, key, values[key]);
				} else {
					newItem.json[key] = values[key];
				}
			}

			returnData = newItem;
		} else {
			let newItems: IDataObject[] = items.map((item) => item.json);
			let pairedItem: IPairedItemData[] = [];
			const destinationFieldName = this.getNodeParameter('destinationFieldName', 0) as string;

			const fieldsToExclude = prepareFieldsArray(
				this.getNodeParameter('fieldsToExclude', 0, '') as string,
				'Fields To Exclude',
			);

			const fieldsToInclude = prepareFieldsArray(
				this.getNodeParameter('fieldsToInclude', 0, '') as string,
				'Fields To Include',
			);

			if (fieldsToExclude.length || fieldsToInclude.length) {
				newItems = newItems.reduce((acc, item, index) => {
					const newItem: IDataObject = {};
					let outputFields = Object.keys(item);

					if (fieldsToExclude.length) {
						outputFields = outputFields.filter((key) => !fieldsToExclude.includes(key));
					}
					if (fieldsToInclude.length) {
						outputFields = outputFields.filter((key) =>
							fieldsToInclude.length ? fieldsToInclude.includes(key) : true,
						);
					}

					outputFields.forEach((key) => {
						newItem[key] = item[key];
					});

					if (isEmpty(newItem)) {
						return acc;
					}

					pairedItem.push({ item: index });
					return acc.concat([newItem]);
				}, [] as IDataObject[]);
			} else {
				pairedItem = Array.from({ length: newItems.length }, (_, item) => ({
					item,
				}));
			}

			const output: INodeExecutionData = { json: { [destinationFieldName]: newItems }, pairedItem };

			returnData = output;
		}

		const includeBinaries = this.getNodeParameter('options.includeBinaries', 0, false) as boolean;

		if (includeBinaries) {
			const pairedItems = (returnData.pairedItem || []) as IPairedItemData[];

			const aggregatedItems = pairedItems.map((item) => {
				return items[item.item];
			});

			const keepOnlyUnique = this.getNodeParameter('options.keepOnlyUnique', 0, false) as boolean;

			addBinariesToItem(returnData, aggregatedItems, keepOnlyUnique);
		}

		if (Object.keys(notFoundedFields).length) {
			const hints: NodeExecutionHint[] = [];

			for (const [field, values] of Object.entries(notFoundedFields)) {
				if (values.every((value) => !value)) {
					hints.push({
						message: `The field '${field}' wasn't found in any input item`,
						location: 'outputPane',
					});
				}
			}

			if (hints.length) {
				this.addExecutionHints(...hints);
			}
		}

		return [[returnData]];
	}
}
