import {
	type IExecuteFunctions,
	type IDataObject,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
	NodeConnectionTypes,
} from 'n8n-workflow';

import {
	checkInput,
	checkInputAndThrowError,
	checkMatchFieldsInput,
	findMatches,
} from './GenericFunctions';

export class CompareDatasets implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'مقایسه مجموعه داده‌ها',
		name: 'compareDatasets',
		icon: 'file:compare.svg',
		group: ['transform'],
		version: [1, 2, 2.1, 2.2, 2.3],
		description: 'مقایسه دو ورودی برای تغییرات',
		defaults: { name: 'مقایسه مجموعه داده‌ها' },

		inputs: [NodeConnectionTypes.Main, NodeConnectionTypes.Main],
		inputNames: ['ورودی A', 'ورودی B'],
		requiredInputs: 1,

		outputs: [
			NodeConnectionTypes.Main,
			NodeConnectionTypes.Main,
			NodeConnectionTypes.Main,
			NodeConnectionTypes.Main,
		],
		outputNames: ['فقط در A', 'یکسان', 'متفاوت', 'فقط در B'],
		properties: [
			{
				displayName:
					'آیتم‌های شاخه‌های مختلف زمانی با هم جفت می‌شوند که فیلدهای زیر تطابق داشته باشند. اگر جفت شدند، بقیه فیلدها مقایسه می‌شوند تا مشخص شود آیتم‌ها یکسان هستند یا متفاوت',
				name: 'infoBox',
				type: 'notice',
				default: '',
			},
			{
				displayName: 'فیلدهای تطابق',
				name: 'mergeByFields',
				type: 'fixedCollection',
				placeholder: 'افزودن فیلدهای تطابق',
				default: { values: [{ field1: '', field2: '' }] },
				typeOptions: {
					multipleValues: true,
				},
				options: [
					{
						displayName: 'Values',
						name: 'values',
						values: [
							{
								displayName: 'فیلد ورودی A',
								name: 'field1',
								type: 'string',
								default: '',
								// eslint-disable-next-line n8n-nodes-base/node-param-placeholder-miscased-id
								placeholder: 'مثال: id',
								hint: 'نام فیلد را به صورت متن وارد کنید',
								requiresDataPath: 'single',
							},
							{
								displayName: 'فیلد ورودی B',
								name: 'field2',
								type: 'string',
								default: '',
								// eslint-disable-next-line n8n-nodes-base/node-param-placeholder-miscased-id
								placeholder: 'مثال: id',
								hint: 'نام فیلد را به صورت متن وارد کنید',
								requiresDataPath: 'single',
							},
						],
					},
				],
			},
			{
				displayName: 'زمانی که تفاوت وجود دارد',
				name: 'resolve',
				type: 'options',
				default: 'preferInput2',
				options: [
					{
						name: 'استفاده از نسخه ورودی A',
						value: 'preferInput1',
					},
					{
						name: 'استفاده از نسخه ورودی B',
						value: 'preferInput2',
					},
					{
						name: 'استفاده از ترکیب نسخه‌ها',
						value: 'mix',
						description: 'خروجی از ورودی‌های مختلف برای فیلدهای مختلف استفاده می‌کند',
					},
					{
						name: 'شامل هر دو نسخه',
						value: 'includeBoth',
						description: 'خروجی شامل تمام داده است (اما ساختار پیچیده‌تر است)',
					},
				],
				displayOptions: {
					show: {
						'@version': [1, 2],
					},
				},
			},
			{
				displayName: 'زمانی که تفاوت وجود دارد',
				name: 'resolve',
				type: 'options',
				default: 'includeBoth',
				options: [
					{
						name: 'استفاده از نسخه ورودی A',
						value: 'preferInput1',
					},
					{
						name: 'استفاده از نسخه ورودی B',
						value: 'preferInput2',
					},
					{
						name: 'استفاده از ترکیب نسخه‌ها',
						value: 'mix',
						description: 'خروجی از ورودی‌های مختلف برای فیلدهای مختلف استفاده می‌کند',
					},
					{
						name: 'شامل هر دو نسخه',
						value: 'includeBoth',
						description: 'خروجی شامل تمام داده است (اما ساختار پیچیده‌تر است)',
					},
				],
				displayOptions: {
					hide: {
						'@version': [1, 2],
					},
				},
			},
			{
				displayName: 'مقایسه تقریبی',
				name: 'fuzzyCompare',
				type: 'boolean',
				default: false,
				description:
					'آیا هنگام مقایسه فیلدها، تفاوت‌های کوچک نوع تحمل شود. به عنوان مثال عدد ۳ و رشته "۳" یکسان در نظر گرفته می‌شوند.',
				displayOptions: {
					hide: {
						'@version': [1],
					},
				},
			},
			{
				displayName: 'ترجیح',
				name: 'preferWhenMix',
				type: 'options',
				default: 'input1',
				options: [
					{
						name: 'نسخه ورودی A',
						value: 'input1',
					},
					{
						name: 'نسخه ورودی B',
						value: 'input2',
					},
				],
				displayOptions: {
					show: {
						resolve: ['mix'],
					},
				},
			},
			{
				displayName: 'برای همه به جز',
				name: 'exceptWhenMix',
				type: 'string',
				default: '',
				// eslint-disable-next-line n8n-nodes-base/node-param-placeholder-miscased-id
				placeholder: 'مثال: id, country',
				hint: 'نام فیلدهای ورودی را به صورت متن وارد کنید، با کاما جدا کنید',
				displayOptions: {
					show: {
						resolve: ['mix'],
					},
				},
				requiresDataPath: 'multiple',
			},
			{
				displayName: 'گزینه‌ها',
				name: 'options',
				type: 'collection',
				placeholder: 'افزودن گزینه',
				default: {},
				options: [
					{
						displayName: 'فیلدهای حذف از مقایسه',
						name: 'skipFields',
						type: 'string',
						default: '',
						placeholder: 'مثال: updated_at, updated_by',
						hint: 'نام فیلدها را به صورت متن وارد کنید، با کاما جدا کنید',
						description: 'فیلدهایی که نباید هنگام بررسی یکسان بودن دو آیتم شامل شوند',
						requiresDataPath: 'multiple',
					},
					{
						displayName: 'مقایسه تقریبی',
						name: 'fuzzyCompare',
						type: 'boolean',
						default: false,
						description:
							'آیا هنگام مقایسه فیلدها، تفاوت‌های کوچک نوع تحمل شود. به عنوان مثال عدد ۳ و رشته "۳" یکسان در نظر گرفته می‌شوند.',
						displayOptions: {
							show: {
								'@version': [1],
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
						displayName: 'تطابق‌های چندگانه',
						name: 'multipleMatches',
						type: 'options',
						default: 'first',
						options: [
							{
								name: 'فقط شامل اولین تطابق',
								value: 'first',
								description: 'فقط یک آیتم برای هر تطابق خروجی می‌دهد',
							},
							{
								name: 'شامل تمام تطابق‌ها',
								value: 'all',
								description: 'اگر چندین تطابق وجود دارد، چندین آیتم خروجی می‌دهد',
							},
						],
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const matchFields = checkMatchFieldsInput(
			this.getNodeParameter('mergeByFields.values', 0, []) as IDataObject[],
		);

		const options = this.getNodeParameter('options', 0, {});

		options.nodeVersion = this.getNode().typeVersion;

		if (options.nodeVersion >= 2) {
			options.fuzzyCompare = this.getNodeParameter('fuzzyCompare', 0, false) as boolean;
		}

		let input1 = this.getInputData(0);
		let input2 = this.getInputData(1);
		if (options.nodeVersion < 2.2) {
			input1 = checkInputAndThrowError(
				input1,
				matchFields.map((pair) => pair.field1),
				(options.disableDotNotation as boolean) || false,
				'Input A',
			);

			input2 = checkInputAndThrowError(
				input2,
				matchFields.map((pair) => pair.field2),
				(options.disableDotNotation as boolean) || false,
				'Input B',
			);
		} else {
			input1 = checkInput(input1);
			input2 = checkInput(input2);
		}

		const resolve = this.getNodeParameter('resolve', 0, '') as string;
		options.resolve = resolve;

		if (resolve === 'mix') {
			options.preferWhenMix = this.getNodeParameter('preferWhenMix', 0, '') as string;
			options.exceptWhenMix = this.getNodeParameter('exceptWhenMix', 0, '') as string;
		}

		const matches = findMatches(input1, input2, matchFields, options);

		return matches;
	}
}
