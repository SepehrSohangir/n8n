import {
	type IExecuteFunctions,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
	NodeConnectionTypes,
	type NodeExecutionHint,
	NodeOperationError,
} from 'n8n-workflow';

import {
	type Aggregations,
	NUMERICAL_AGGREGATIONS,
	type SummarizeOptions,
	aggregateAndSplitData,
	checkIfFieldExists,
	fieldValueGetter,
	flattenAggregationResultToArray,
	flattenAggregationResultToObject,
} from './utils';

export class Summarize implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'خلاصه‌سازی',
		name: 'summarize',
		icon: 'file:summarize.svg',
		group: ['transform'],
		subtitle: '',
		version: [1, 1.1],
		description: 'جمع، شمارش، حداکثر، و غیره در بین آیتم‌ها',
		defaults: {
			name: 'خلاصه‌سازی',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		properties: [
			{
				displayName: 'فیلدهای برای خلاصه‌سازی',
				name: 'fieldsToSummarize',
				type: 'fixedCollection',
				placeholder: 'افزودن فیلد',
				default: { values: [{ aggregation: 'count', field: '' }] },
				typeOptions: {
					multipleValues: true,
				},
				options: [
					{
						displayName: '',
						name: 'values',
						values: [
							{
								displayName: 'تجمیع',
								name: 'aggregation',
								type: 'options',
								options: [
									{
										name: 'الحاق',
										value: 'append',
									},
									{
										name: 'میانگین',
										value: 'average',
									},
									{
										name: 'الحاق رشته',
										value: 'concatenate',
									},
									{
										name: 'شمارش',
										value: 'count',
									},
									{
										name: 'شمارش منحصر به فرد',
										value: 'countUnique',
									},
									{
										name: 'حداکثر',
										value: 'max',
									},
									{
										name: 'حداقل',
										value: 'min',
									},
									{
										name: 'جمع',
										value: 'sum',
									},
								],
								default: 'count',
								description: 'نحوه ترکیب مقادیر فیلدی که می‌خواهید خلاصه‌سازی کنید',
							},
							//field repeated to have different descriptions for different aggregations --------------------------------
							{
								displayName: 'فیلد',
								name: 'field',
								type: 'string',
								default: '',
								description: 'نام فیلد ورودی که می‌خواهید خلاصه‌سازی کنید',
								placeholder: 'مثلاً هزینه',
								hint: 'نام فیلد را به صورت متن وارد کنید',
								displayOptions: {
									hide: {
										aggregation: [...NUMERICAL_AGGREGATIONS, 'countUnique', 'count', 'max', 'min'],
									},
								},
								requiresDataPath: 'single',
							},
							{
								displayName: 'فیلد',
								name: 'field',
								type: 'string',
								default: '',
								description:
									'نام فیلد ورودی که می‌خواهید خلاصه‌سازی کنید. فیلد باید شامل مقادیر عددی باشد؛ null، undefined، رشته‌های خالی نادیده گرفته می‌شوند.',
								placeholder: 'مثلاً هزینه',
								hint: 'نام فیلد را به صورت متن وارد کنید',
								displayOptions: {
									show: {
										aggregation: NUMERICAL_AGGREGATIONS,
									},
								},
								requiresDataPath: 'single',
							},
							{
								displayName: 'فیلد',
								name: 'field',
								type: 'string',
								default: '',
								description:
									'نام فیلد ورودی که می‌خواهید خلاصه‌سازی کنید؛ null، undefined، رشته‌های خالی نادیده گرفته می‌شوند',
								placeholder: 'مثلاً هزینه',
								hint: 'نام فیلد را به صورت متن وارد کنید',
								displayOptions: {
									show: {
										aggregation: ['countUnique', 'count', 'max', 'min'],
									},
								},
								requiresDataPath: 'single',
							},
							// ----------------------------------------------------------------------------------------------------------
							{
								displayName: 'شامل مقادیر خالی',
								name: 'includeEmpty',
								type: 'boolean',
								default: false,
								displayOptions: {
									show: {
										aggregation: ['append', 'concatenate', 'count', 'countUnique'],
									},
								},
							},
							{
								displayName: 'جداکننده',
								name: 'separateBy',
								type: 'options',
								default: ',',
								// eslint-disable-next-line n8n-nodes-base/node-param-options-type-unsorted-items
								options: [
									{
										name: 'کاما',
										value: ',',
									},
									{
										name: 'کاما و فاصله',
										value: ', ',
									},
									{
										name: 'خط جدید',
										value: '\n',
									},
									{
										name: 'هیچ کدام',
										value: '',
									},
									{
										name: 'فاصله',
										value: ' ',
									},
									{
										name: 'دیگر',
										value: 'other',
									},
								],
								hint: 'چه چیزی بین مقادیر وارد شود',
								displayOptions: {
									show: {
										aggregation: ['concatenate'],
									},
								},
							},
							{
								displayName: 'جداکننده سفارشی',
								name: 'customSeparator',
								type: 'string',
								default: '',
								displayOptions: {
									show: {
										aggregation: ['concatenate'],
										separateBy: ['other'],
									},
								},
							},
						],
					},
				],
			},
			// fieldsToSplitBy repeated to have different displayName for singleItem and separateItems -----------------------------
			{
				displayName: 'فیلدهای برای تقسیم بر اساس',
				name: 'fieldsToSplitBy',
				type: 'string',
				placeholder: 'مثلاً کشور، شهر',
				default: '',
				description: 'نام فیلدهای ورودی که می‌خواهید خلاصه را بر اساس آنها تقسیم کنید',
				hint: 'نام فیلدها را به صورت متن (با کاما جدا شده) وارد کنید',
				displayOptions: {
					hide: {
						'/options.outputFormat': ['singleItem'],
					},
				},
				requiresDataPath: 'multiple',
			},
			{
				displayName: 'فیلدهای برای گروه‌بندی بر اساس',
				name: 'fieldsToSplitBy',
				type: 'string',
				placeholder: 'مثلاً کشور، شهر',
				default: '',
				description: 'نام فیلدهای ورودی که می‌خواهید خلاصه را بر اساس آنها تقسیم کنید',
				hint: 'نام فیلدها را به صورت متن (با کاما جدا شده) وارد کنید',
				displayOptions: {
					show: {
						'/options.outputFormat': ['singleItem'],
					},
				},
				requiresDataPath: 'multiple',
			},
			// ----------------------------------------------------------------------------------------------------------
			{
				displayName: 'گزینه‌ها',
				name: 'options',
				type: 'collection',
				placeholder: 'افزودن گزینه',
				default: {},
				options: [
					{
						displayName: 'ادامه در صورت عدم یافتن فیلد',
						name: 'continueIfFieldNotFound',
						type: 'boolean',
						default: false,
						description:
							'آیا در صورت عدم یافتن فیلد برای خلاصه‌سازی در هیچ آیتمی، ادامه داده شود و یک آیتم خالی برگردانده شود، در غیر این صورت خطا پرتاب می‌شود',
						displayOptions: {
							hide: {
								'@version': [{ _cnd: { gte: 1.1 } }],
							},
						},
					},
					{
						displayName: 'غیرفعال کردن نماد نقطه',
						name: 'disableDotNotation',
						type: 'boolean',
						default: false,
						description:
							'آیا ارجاع به فیلدهای فرزند با استفاده از `parent.child` در نام فیلد مجاز نباشد',
					},
					{
						displayName: 'فرمت خروجی',
						name: 'outputFormat',
						type: 'options',
						default: 'separateItems',
						options: [
							{
								name: 'هر تقسیم در یک آیتم جداگانه',
								value: 'separateItems',
							},
							{
								name: 'همه تقسیم‌ها در یک آیتم واحد',
								value: 'singleItem',
							},
						],
					},
					{
						// eslint-disable-next-line n8n-nodes-base/node-param-display-name-miscased
						displayName: 'نادیده گرفتن آیتم‌های بدون فیلدهای معتبر برای گروه‌بندی',
						name: 'skipEmptySplitFields',
						type: 'boolean',
						default: false,
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const newItems = items.map(({ json }, i) => ({ ...json, _itemIndex: i }));

		const options = this.getNodeParameter('options', 0, {}) as SummarizeOptions;

		const fieldsToSplitBy = (this.getNodeParameter('fieldsToSplitBy', 0, '') as string)
			.split(',')
			.map((field) => field.trim())
			.filter((field) => field);

		const fieldsToSummarize = this.getNodeParameter(
			'fieldsToSummarize.values',
			0,
			[],
		) as Aggregations;

		if (fieldsToSummarize.filter((aggregation) => aggregation.field !== '').length === 0) {
			throw new NodeOperationError(
				this.getNode(),
				"You need to add at least one aggregation to 'Fields to Summarize' with non empty 'Field'",
			);
		}

		const getValue = fieldValueGetter(options.disableDotNotation);

		const nodeVersion = this.getNode().typeVersion;

		const aggregationResult = aggregateAndSplitData({
			splitKeys: fieldsToSplitBy,
			inputItems: newItems,
			fieldsToSummarize,
			options,
			getValue,
			convertKeysToString: nodeVersion === 1,
		});

		const fieldsNotFound: NodeExecutionHint[] = [];
		try {
			checkIfFieldExists.call(this, newItems, fieldsToSummarize, getValue);
		} catch (error) {
			if (nodeVersion > 1 || options.continueIfFieldNotFound) {
				const fieldNotFoundHint: NodeExecutionHint = {
					message: error instanceof Error ? error.message : String(error),
					location: 'outputPane',
				};
				fieldsNotFound.push(fieldNotFoundHint);
			} else {
				throw error;
			}
		}

		if (fieldsNotFound.length) {
			this.addExecutionHints(...fieldsNotFound);
		}

		if (options.outputFormat === 'singleItem') {
			const executionData: INodeExecutionData = {
				json: flattenAggregationResultToObject(aggregationResult),
				pairedItem: newItems.map((_v, index) => ({
					item: index,
				})),
			};
			return [[executionData]];
		} else {
			if (!fieldsToSplitBy.length && 'pairedItems' in aggregationResult) {
				const { pairedItems, returnData } = aggregationResult;
				const executionData: INodeExecutionData = {
					json: returnData,
					pairedItem: (pairedItems ?? []).map((index) => ({ item: index })),
				};
				return [[executionData]];
			}
			const flatAggregationResults = flattenAggregationResultToArray(aggregationResult);
			const executionData = flatAggregationResults.map((item) => {
				const { pairedItems, returnData } = item;
				return {
					json: returnData,
					pairedItem: (pairedItems ?? []).map((index) => ({ item: index })),
				};
			});
			return [executionData];
		}
	}
}
