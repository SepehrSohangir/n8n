import type { INodeProperties } from 'n8n-workflow';

const clashHandlingProperties: INodeProperties = {
	displayName: 'مدیریت برخورد',
	name: 'clashHandling',
	type: 'fixedCollection',
	default: {
		values: { resolveClash: 'preferInput2', mergeMode: 'deepMerge', overrideEmpty: false },
	},
	options: [
		{
			displayName: 'مقادیر',
			name: 'values',
			values: [
				{
					displayName: 'هنگام برخورد مقادیر فیلد',
					name: 'resolveClash',
					type: 'options',
					default: '',
					options: [
						{
							name: 'همیشه افزودن شماره ورودی به نام فیلدها',
							value: 'addSuffix',
						},
						{
							name: 'ترجیح نسخه ورودی 1',
							value: 'preferInput1',
						},
						{
							name: 'ترجیح نسخه ورودی 2',
							value: 'preferInput2',
						},
					],
				},
				{
					displayName: 'ادغام فیلدهای تو در تو',
					name: 'mergeMode',
					type: 'options',
					default: 'deepMerge',
					options: [
						{
							name: 'ادغام عمیق',
							value: 'deepMerge',
							description: 'ادغام در هر سطح از تو در تو بودن',
						},
						{
							name: 'ادغام سطحی',
							value: 'shallowMerge',
							description: 'ادغام فقط در سطح بالا (همه فیلدهای تو در تو از همان ورودی خواهند آمد)',
						},
					],
					hint: 'نحوه ادغام زمانی که فیلدهای فرعی زیر فیلدهای سطح بالا وجود دارند',
					displayOptions: {
						show: {
							resolveClash: ['preferInput1', 'preferInput2'],
						},
					},
				},
				{
					displayName: 'کاهش فیلدهای خالی',
					name: 'overrideEmpty',
					type: 'boolean',
					default: false,
					description:
						"آیا نسخه ورودی ترجیحی برای یک فیلد بازنویسی شود اگر خالی باشد و نسخه دیگر خالی نباشد. در اینجا 'خالی' به معنای undefined، null یا رشته خالی است.",
					displayOptions: {
						show: {
							resolveClash: ['preferInput1', 'preferInput2'],
						},
					},
				},
			],
		},
	],
};

export const optionsDescription: INodeProperties[] = [
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
					show: {
						'/mode': ['combine'],
						'/combinationMode': ['mergeByFields'],
					},
					hide: {
						'/joinMode': ['keepMatches', 'keepNonMatches'],
					},
				},
			},
			{
				...clashHandlingProperties,
				displayOptions: {
					show: {
						'/mode': ['combine'],
						'/combinationMode': ['mergeByFields'],
						'/joinMode': ['keepMatches'],
						'/outputDataFrom': ['both'],
					},
				},
			},
			{
				...clashHandlingProperties,
				displayOptions: {
					show: {
						'/mode': ['combine'],
						'/combinationMode': ['multiplex', 'mergeByPosition'],
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
				displayOptions: {
					show: {
						'/mode': ['combine'],
						'/combinationMode': ['mergeByFields'],
					},
				},
			},
			{
				displayName: 'مقایسه فازی',
				name: 'fuzzyCompare',
				type: 'boolean',
				default: false,
				description:
					"آیا تفاوت‌های کوچک نوع هنگام مقایسه فیلدها تحمل شود. مثلاً عدد 3 و رشته '3' یکسان در نظر گرفته می‌شوند.",
			},
			{
				displayName: 'شامل هر آیتم جفت نشده',
				name: 'includeUnpaired',
				type: 'boolean',
				default: false,
				// eslint-disable-next-line n8n-nodes-base/node-param-description-boolean-without-whether
				description:
					'اگر تعداد متفاوتی از آیتم‌ها در ورودی 1 و ورودی 2 وجود دارد، آیا موارد انتهایی که چیزی برای جفت شدن ندارند شامل شوند',
				displayOptions: {
					show: {
						'/mode': ['combine'],
						'/combinationMode': ['mergeByPosition'],
					},
				},
			},
			{
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
				displayOptions: {
					show: {
						'/mode': ['combine'],
						'/combinationMode': ['mergeByFields'],
						'/joinMode': ['keepMatches'],
						'/outputDataFrom': ['both'],
					},
				},
			},
			{
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
				displayOptions: {
					show: {
						'/mode': ['combine'],
						'/combinationMode': ['mergeByFields'],
						'/joinMode': ['enrichInput1', 'enrichInput2', 'keepEverything'],
					},
				},
			},
		],
		displayOptions: {
			hide: {
				mode: ['chooseBranch', 'append'],
			},
		},
	},
];
