import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';

import { updateDisplayOptions } from '@utils/utilities';

import { clashHandlingProperties, fuzzyCompareProperty } from '../../helpers/descriptions';
import type {
	ClashResolveOptions,
	MatchFieldsJoinMode,
	MatchFieldsOptions,
	MatchFieldsOutput,
} from '../../helpers/interfaces';
import {
	addSourceField,
	addSuffixToEntriesKeys,
	checkInput,
	checkMatchFieldsInput,
	findMatches,
	mergeMatched,
} from '../../helpers/utils';

const multipleMatchesProperty: INodeProperties = {
	displayName: 'تطابق‌های چندگانه',
	name: 'multipleMatches',
	type: 'options',
	default: 'all',
	options: [
		{
			name: 'شامل همه تطابق‌ها',
			value: 'all',
			description: 'خروجی چندین آیتم اگر تطابق‌های چندگانه وجود داشته باشد',
		},
		{
			name: 'فقط شامل اولین تطابق',
			value: 'first',
			description: 'فقط یک آیتم واحد در هر تطابق خروجی داده شود',
		},
	],
};

export const properties: INodeProperties[] = [
	{
		displayName: 'فیلدهای برای تطابق نام‌های متفاوتی دارند',
		name: 'advanced',
		type: 'boolean',
		default: false,
		description: 'آیا نام(های) فیلد برای تطابق در ورودی 1 و ورودی 2 متفاوت هستند',
	},
	{
		displayName: 'فیلدهای برای تطابق',
		name: 'fieldsToMatchString',
		type: 'string',
		// eslint-disable-next-line n8n-nodes-base/node-param-placeholder-miscased-id
		placeholder: 'مثلاً id, name',
		default: '',
		requiresDataPath: 'multiple',
		description: 'مشخص کردن فیلدهای برای استفاده برای تطابق آیتم‌های ورودی',
		hint: 'کشیدن یا تایپ نام فیلد ورودی',
		displayOptions: {
			show: {
				advanced: [false],
			},
		},
	},
	{
		displayName: 'فیلدهای برای تطابق',
		name: 'mergeByFields',
		type: 'fixedCollection',
		placeholder: 'افزودن فیلدهای برای تطابق',
		default: { values: [{ field1: '', field2: '' }] },
		typeOptions: {
			multipleValues: true,
		},
		description: 'مشخص کردن فیلدهای برای استفاده برای تطابق آیتم‌های ورودی',
		displayOptions: {
			show: {
				advanced: [true],
			},
		},
		options: [
			{
				displayName: 'مقادیر',
				name: 'values',
				values: [
					{
						displayName: 'فیلد ورودی 1',
						name: 'field1',
						type: 'string',
						default: '',
						// eslint-disable-next-line n8n-nodes-base/node-param-placeholder-miscased-id
						placeholder: 'مثلاً id',
						hint: 'کشیدن یا تایپ نام فیلد ورودی',
						requiresDataPath: 'single',
					},
					{
						displayName: 'فیلد ورودی 2',
						name: 'field2',
						type: 'string',
						default: '',
						// eslint-disable-next-line n8n-nodes-base/node-param-placeholder-miscased-id
						placeholder: 'مثلاً id',
						hint: 'کشیدن یا تایپ نام فیلد ورودی',
						requiresDataPath: 'single',
					},
				],
			},
		],
	},
	{
		displayName: 'نوع خروجی',
		name: 'joinMode',
		type: 'options',
		description: 'نحوه انتخاب آیتم‌ها برای ارسال به خروجی',
		// eslint-disable-next-line n8n-nodes-base/node-param-options-type-unsorted-items
		options: [
			{
				name: 'نگه داشتن تطابق‌ها',
				value: 'keepMatches',
				description: 'آیتم‌هایی که تطابق دارند، با هم ادغام شده (اتصال داخلی)',
			},
			{
				name: 'نگه داشتن غیر تطابق‌ها',
				value: 'keepNonMatches',
				description: 'آیتم‌هایی که تطابق ندارند',
			},
			{
				name: 'نگه داشتن همه چیز',
				value: 'keepEverything',
				description:
					'آیتم‌هایی که تطابق دارند با هم ادغام شده، به علاوه آیتم‌هایی که تطابق ندارند (اتصال خارجی)',
			},
			{
				name: 'غنی‌سازی ورودی 1',
				value: 'enrichInput1',
				description: 'همه ورودی 1، با داده از ورودی 2 اضافه شده (اتصال چپ)',
			},
			{
				name: 'غنی‌سازی ورودی 2',
				value: 'enrichInput2',
				description: 'همه ورودی 2، با داده از ورودی 1 اضافه شده (اتصال راست)',
			},
		],
		default: 'keepMatches',
	},
	{
		displayName: 'داده خروجی از',
		name: 'outputDataFrom',
		type: 'options',
		options: [
			{
				name: 'هر دو ورودی با هم ادغام شده',
				value: 'both',
			},
			{
				name: 'ورودی 1',
				value: 'input1',
			},
			{
				name: 'ورودی 2',
				value: 'input2',
			},
		],
		default: 'both',
		displayOptions: {
			show: {
				joinMode: ['keepMatches'],
			},
		},
	},
	{
		displayName: 'داده خروجی از',
		name: 'outputDataFrom',
		type: 'options',
		options: [
			{
				name: 'هر دو ورودی با هم الحاق شده',
				value: 'both',
			},
			{
				name: 'ورودی 1',
				value: 'input1',
			},
			{
				name: 'ورودی 2',
				value: 'input2',
			},
		],
		default: 'both',
		displayOptions: {
			show: {
				joinMode: ['keepNonMatches'],
			},
		},
	},
	{
		displayName: 'گزینه‌ها',
		name: 'options',
		type: 'collection',
		placeholder: 'افزودن گزینه',
		default: {},
		options: [
			{
				...clashHandlingProperties,
				displayOptions: {
					hide: {
						'/joinMode': ['keepMatches', 'keepNonMatches'],
					},
				},
			},
			{
				...clashHandlingProperties,
				displayOptions: {
					show: {
						'/joinMode': ['keepMatches'],
						'/outputDataFrom': ['both'],
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
			fuzzyCompareProperty,
			{
				...multipleMatchesProperty,
				displayOptions: {
					show: {
						'/joinMode': ['keepMatches'],
						'/outputDataFrom': ['both'],
					},
				},
			},
			{
				...multipleMatchesProperty,
				displayOptions: {
					show: {
						'/joinMode': ['enrichInput1', 'enrichInput2', 'keepEverything'],
					},
				},
			},
		],
	},
];

const displayOptions = {
	show: {
		mode: ['combine'],
		combineBy: ['combineByFields'],
	},
};

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(
	this: IExecuteFunctions,
	inputsData: INodeExecutionData[][],
): Promise<INodeExecutionData[][]> {
	let returnData: INodeExecutionData[] = [];
	const advanced = this.getNodeParameter('advanced', 0) as boolean;
	let matchFields;

	if (advanced) {
		matchFields = this.getNodeParameter('mergeByFields.values', 0, []) as IDataObject[];
	} else {
		matchFields = (this.getNodeParameter('fieldsToMatchString', 0, '') as string)
			.split(',')
			.map((f) => {
				const field = f.trim();
				return { field1: field, field2: field };
			});
	}

	matchFields = checkMatchFieldsInput(matchFields);

	const joinMode = this.getNodeParameter('joinMode', 0) as MatchFieldsJoinMode;
	const outputDataFrom = this.getNodeParameter('outputDataFrom', 0, 'both') as MatchFieldsOutput;
	const options = this.getNodeParameter('options', 0, {}) as MatchFieldsOptions;

	options.joinMode = joinMode;
	options.outputDataFrom = outputDataFrom;

	const nodeVersion = this.getNode().typeVersion;

	let input1 = inputsData[0];
	let input2 = inputsData[1];

	if (nodeVersion < 2.1) {
		input1 = checkInput(
			this.getInputData(0),
			matchFields.map((pair) => pair.field1),
			options.disableDotNotation || false,
			'Input 1',
		);
		if (!input1) return [returnData];

		input2 = checkInput(
			this.getInputData(1),
			matchFields.map((pair) => pair.field2),
			options.disableDotNotation || false,
			'Input 2',
		);
	} else {
		if (!input1) return [returnData];
	}

	if (input1.length === 0 || input2.length === 0) {
		if (!input1.length && joinMode === 'keepNonMatches' && outputDataFrom === 'input1')
			return [returnData];
		if (!input2.length && joinMode === 'keepNonMatches' && outputDataFrom === 'input2')
			return [returnData];

		if (joinMode === 'keepMatches') {
			// Stop the execution
			return [];
		} else if (joinMode === 'enrichInput1' && input1.length === 0) {
			// No data to enrich so stop
			return [];
		} else if (joinMode === 'enrichInput2' && input2.length === 0) {
			// No data to enrich so stop
			return [];
		} else {
			// Return the data of any of the inputs that contains data
			return [[...input1, ...input2]];
		}
	}

	if (!input1) return [returnData];

	if (!input2 || !matchFields.length) {
		if (
			joinMode === 'keepMatches' ||
			joinMode === 'keepEverything' ||
			joinMode === 'enrichInput2'
		) {
			return [returnData];
		}
		return [input1];
	}

	const matches = findMatches(input1, input2, matchFields, options);

	if (joinMode === 'keepMatches' || joinMode === 'keepEverything') {
		let output: INodeExecutionData[] = [];
		const clashResolveOptions = this.getNodeParameter(
			'options.clashHandling.values',
			0,
			{},
		) as ClashResolveOptions;

		if (outputDataFrom === 'input1') {
			output = matches.matched.map((match) => match.entry);
		}
		if (outputDataFrom === 'input2') {
			output = matches.matched2;
		}
		if (outputDataFrom === 'both') {
			output = mergeMatched(matches.matched, clashResolveOptions);
		}

		if (joinMode === 'keepEverything') {
			let unmatched1 = matches.unmatched1;
			let unmatched2 = matches.unmatched2;
			if (clashResolveOptions.resolveClash === 'addSuffix') {
				unmatched1 = addSuffixToEntriesKeys(unmatched1, '1');
				unmatched2 = addSuffixToEntriesKeys(unmatched2, '2');
			}
			output = [...output, ...unmatched1, ...unmatched2];
		}

		returnData = returnData.concat(output);
	}

	if (joinMode === 'keepNonMatches') {
		if (outputDataFrom === 'input1') {
			return [matches.unmatched1];
		}
		if (outputDataFrom === 'input2') {
			return [matches.unmatched2];
		}
		if (outputDataFrom === 'both') {
			let output: INodeExecutionData[] = [];
			output = output.concat(addSourceField(matches.unmatched1, 'input1'));
			output = output.concat(addSourceField(matches.unmatched2, 'input2'));
			return [output];
		}
	}

	if (joinMode === 'enrichInput1' || joinMode === 'enrichInput2') {
		const clashResolveOptions = this.getNodeParameter(
			'options.clashHandling.values',
			0,
			{},
		) as ClashResolveOptions;

		const mergedEntries = mergeMatched(matches.matched, clashResolveOptions, joinMode);

		if (joinMode === 'enrichInput1') {
			if (clashResolveOptions.resolveClash === 'addSuffix') {
				returnData = returnData.concat(
					mergedEntries,
					addSuffixToEntriesKeys(matches.unmatched1, '1'),
				);
			} else {
				returnData = returnData.concat(mergedEntries, matches.unmatched1);
			}
		} else {
			if (clashResolveOptions.resolveClash === 'addSuffix') {
				returnData = returnData.concat(
					mergedEntries,
					addSuffixToEntriesKeys(matches.unmatched2, '2'),
				);
			} else {
				returnData = returnData.concat(mergedEntries, matches.unmatched2);
			}
		}
	}

	return [returnData];
}
