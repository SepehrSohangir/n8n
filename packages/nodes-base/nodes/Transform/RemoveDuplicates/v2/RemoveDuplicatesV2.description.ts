import type { INodeProperties } from 'n8n-workflow';
const operationOptions = [
	{
		name: 'حذف آیتم‌های تکراری در ورودی فعلی',
		value: 'removeDuplicateInputItems',
		description: 'حذف تکراری‌ها از آیتم‌های ورودی',
		action: 'حذف آیتم‌های تکراری در ورودی فعلی',
	},
	{
		name: 'حذف آیتم‌های پردازش شده در اجراهای قبلی',
		value: 'removeItemsSeenInPreviousExecutions',
		description: 'حذف تکراری آیتم‌هایی که قبلاً در اجراهای قبلی دیده شده‌اند',
		action: 'حذف آیتم‌های پردازش شده در اجراهای قبلی',
	},
	{
		name: 'پاک کردن تاریخچه حذف تکراری',
		value: 'clearDeduplicationHistory',
		description: 'پاک کردن ذخیره آیتم‌های قبلی',
		action: 'پاک کردن تاریخچه حذف تکراری',
	},
];
const compareOptions = [
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
];
const logicOptions = [
	{
		name: 'مقدار جدید است',
		value: 'removeItemsWithAlreadySeenKeyValues',
		description: 'حذف همه آیتم‌های ورودی با مقادیر مطابق با آن‌هایی که قبلاً پردازش شده‌اند',
	},
	{
		name: 'مقدار بالاتر از هر مقدار قبلی است',
		value: 'removeItemsUpToStoredIncrementalKey',
		description:
			'با مقادیر افزایشی کار می‌کند، همه آیتم‌های ورودی با مقادیر تا مقدار ذخیره شده را حذف می‌کند',
	},
	{
		name: 'مقدار یک تاریخ دیرتر از هر تاریخ قبلی است',
		value: 'removeItemsUpToStoredDate',
		description:
			'با مقادیر تاریخ کار می‌کند، همه آیتم‌های ورودی با مقادیر تا تاریخ ذخیره شده را حذف می‌کند',
	},
];
const manageDatabaseModeOptions = [
	{
		name: 'پاک کردن پایگاه داده',
		value: 'cleanDatabase',
		description: 'پاک کردن همه مقادیر ذخیره شده برای یک کلید در پایگاه داده',
	},
];

export const removeDuplicatesNodeFields: INodeProperties[] = [
	{
		displayName: 'عملیات',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		options: operationOptions,
		default: 'removeDuplicateInputItems',
	},
	{
		displayName: 'مقایسه',
		name: 'compare',
		type: 'options',
		options: compareOptions,
		default: 'allFields',
		description: 'فیلدهای آیتم‌های ورودی برای مقایسه تا ببینیم آیا یکسان هستند',
		displayOptions: {
			show: {
				operation: ['removeDuplicateInputItems'],
			},
		},
	},
	{
		displayName: 'فیلدهای برای حذف',
		name: 'fieldsToExclude',
		type: 'string',
		placeholder: 'مثلاً email, name',
		requiresDataPath: 'multiple',
		description: 'فیلدها در ورودی برای حذف از مقایسه',
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
		placeholder: 'مثلاً email, name',
		requiresDataPath: 'multiple',
		description: 'فیلدها در ورودی برای افزودن به مقایسه',
		default: '',
		displayOptions: {
			show: {
				compare: ['selectedFields'],
			},
		},
	},

	// ----------------------------------
	{
		displayName: 'نگه داشتن آیتم‌هایی که',
		name: 'logic',
		type: 'options',
		noDataExpression: true,
		options: logicOptions,
		default: 'removeItemsWithAlreadySeenKeyValues',
		description:
			'نحوه انتخاب آیتم‌های ورودی برای حذف با مقایسه آن‌ها با مقادیر کلیدی قبلاً پردازش شده',
		displayOptions: {
			show: {
				operation: ['removeItemsSeenInPreviousExecutions'],
			},
		},
	},
	{
		displayName: 'مقدار برای حذف تکراری بر اساس',
		name: 'dedupeValue',
		type: 'string',
		default: '',
		description:
			'استفاده از یک فیلد ورودی (یا ترکیبی از فیلدها) که دارای مقدار شناسه منحصر به فرد است',
		hint: 'مقدار فیلد ورودی برای مقایسه بین آیتم‌ها',
		placeholder: 'مثلاً ID',
		required: true,
		displayOptions: {
			show: {
				logic: ['removeItemsWithAlreadySeenKeyValues'],
				'/operation': ['removeItemsSeenInPreviousExecutions'],
			},
		},
	},
	{
		displayName: 'مقدار برای حذف تکراری بر اساس',
		name: 'incrementalDedupeValue',
		type: 'number',
		default: '',
		description: 'استفاده از یک فیلد ورودی (یا ترکیبی از فیلدها) که دارای مقدار افزایشی است',
		hint: 'مقدار فیلد ورودی برای مقایسه بین آیتم‌ها، یک مقدار افزایشی انتظار می‌رود',
		placeholder: 'مثلاً ID',
		displayOptions: {
			show: {
				logic: ['removeItemsUpToStoredIncrementalKey'],
				'/operation': ['removeItemsSeenInPreviousExecutions'],
			},
		},
	},
	{
		displayName: 'مقدار برای حذف تکراری بر اساس',
		name: 'dateDedupeValue',
		type: 'dateTime',
		default: '',
		description: 'استفاده از یک فیلد ورودی که دارای مقدار تاریخ در فرمت ISO است',
		hint: 'مقدار فیلد ورودی برای مقایسه بین آیتم‌ها، یک تاریخ انتظار می‌رود',
		placeholder: ' مثلاً 2024-08-09T13:44:16Z',
		displayOptions: {
			show: {
				logic: ['removeItemsUpToStoredDate'],
				'/operation': ['removeItemsSeenInPreviousExecutions'],
			},
		},
	},
	{
		displayName: 'حالت',
		name: 'mode',
		type: 'options',
		default: 'cleanDatabase',
		description:
			'نحوه تغییر مقادیر کلیدی ذخیره شده در پایگاه داده. هیچ یک از این حالت‌ها آیتم‌های ورودی را حذف نمی‌کند.',
		displayOptions: {
			show: {
				operation: ['clearDeduplicationHistory'],
			},
		},
		options: manageDatabaseModeOptions,
	},
	{
		displayName: 'گزینه‌ها',
		name: 'options',
		type: 'collection',
		placeholder: 'افزودن فیلد',
		default: {},
		displayOptions: {
			show: {
				operation: [
					'removeDuplicateInputItems',
					'removeItemsSeenInPreviousExecutions',
					'clearDeduplicationHistory',
				],
			},
		},
		options: [
			{
				displayName: 'غیرفعال کردن نماد نقطه',
				name: 'disableDotNotation',
				type: 'boolean',
				default: false,
				displayOptions: {
					show: {
						'/operation': ['removeDuplicateInputItems'],
					},
					hide: {
						'/compare': ['allFields'],
					},
				},
				description:
					'آیا ارجاع به فیلدهای فرزند با استفاده از `parent.child` در نام فیلد مجاز نباشد',
			},
			{
				displayName: 'حذف فیلدهای دیگر',
				name: 'removeOtherFields',
				type: 'boolean',
				default: false,
				displayOptions: {
					show: {
						'/operation': ['removeDuplicateInputItems'],
					},
					hide: {
						'/compare': ['allFields'],
					},
				},
				description:
					'آیا هر فیلدی که مقایسه نمی‌شود حذف شود. اگر غیرفعال باشد، مقادیر از اولین مورد تکراری حفظ می‌شوند.',
			},
			{
				displayName: 'محدوده',
				name: 'scope',
				type: 'options',
				default: 'node',
				displayOptions: {
					show: {
						'/operation': ['clearDeduplicationHistory', 'removeItemsSeenInPreviousExecutions'],
					},
				},
				description:
					"اگر روی 'گردش کار' تنظیم شود، مقادیر کلیدی در همه نودهای گردش کار به اشتراک گذاشته می‌شوند. اگر روی 'نود' تنظیم شود، مقادیر کلیدی مخصوص این نود خواهند بود.",
				options: [
					{
						name: 'گردش کار',
						value: 'workflow',
						description: 'اطلاعات حذف تکراری توسط همه نودهای گردش کار به اشتراک گذاشته می‌شود',
					},
					{
						name: 'نود',
						value: 'node',
						description: 'اطلاعات حذف تکراری فقط برای این نود ذخیره می‌شود',
					},
				],
			},
			{
				displayName: 'اندازه تاریخچه',
				name: 'historySize',
				type: 'number',
				default: 10000,
				hint: 'حداکثر تعداد آیتم‌های گذشته برای ذخیره برای حذف تکراری',
				displayOptions: {
					show: {
						'/logic': ['removeItemsWithAlreadySeenKeyValues'],
						'/operation': ['removeItemsSeenInPreviousExecutions'],
					},
				},
			},
		],
	},
];
