import type { INodeProperties } from 'n8n-workflow';

export const fuzzyCompareProperty: INodeProperties = {
	displayName: 'مقایسه فازی',
	name: 'fuzzyCompare',
	type: 'boolean',
	default: false,
	description:
		"آیا تفاوت‌های کوچک نوع هنگام مقایسه فیلدها تحمل شود. مثلاً عدد 3 و رشته '3' یکسان در نظر گرفته می‌شوند.",
};
export const numberInputsProperty: INodeProperties = {
	displayName: 'تعداد ورودی‌ها',
	name: 'numberInputs',
	type: 'options',
	noDataExpression: true,
	default: 2,
	options: [
		{
			name: '2',
			value: 2,
		},
		{
			name: '3',
			value: 3,
		},
		{
			name: '4',
			value: 4,
		},
		{
			name: '5',
			value: 5,
		},
		{
			name: '6',
			value: 6,
		},
		{
			name: '7',
			value: 7,
		},
		{
			name: '8',
			value: 8,
		},
		{
			name: '9',
			value: 9,
		},
		{
			name: '10',
			value: 10,
		},
	],
	validateType: 'number',
	description:
		'تعداد ورودی‌های داده که می‌خواهید ادغام کنید. نود منتظر اجرای همه ورودی‌های متصل می‌ماند.',
};

export const clashHandlingProperties: INodeProperties = {
	displayName: 'مدیریت برخورد',
	name: 'clashHandling',
	type: 'fixedCollection',
	default: {
		values: { resolveClash: 'preferLast', mergeMode: 'deepMerge', overrideEmpty: false },
	},
	options: [
		{
			displayName: 'مقادیر',
			name: 'values',
			values: [
				{
					// eslint-disable-next-line n8n-nodes-base/node-param-display-name-wrong-for-dynamic-options
					displayName: 'هنگام برخورد مقادیر فیلد',
					name: 'resolveClash',
					// eslint-disable-next-line n8n-nodes-base/node-param-description-missing-from-dynamic-options
					type: 'options',
					default: '',
					typeOptions: {
						loadOptionsMethod: 'getResolveClashOptions',
						loadOptionsDependsOn: ['numberInputs'],
					},
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
							resolveClash: [{ _cnd: { not: 'addSuffix' } }],
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
							resolveClash: [{ _cnd: { not: 'addSuffix' } }],
						},
					},
				},
			],
		},
	],
};
