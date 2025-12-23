import type { INodeProperties } from 'n8n-workflow';

export const auditOperations: INodeProperties[] = [
	{
		displayName: 'عملیات',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		default: 'get',
		displayOptions: {
			show: {
				resource: ['audit'],
			},
		},
		options: [
			{
				name: 'تولید',
				value: 'generate',
				action: 'تولید حسابرسی',
				description: 'تولید گزارش حسابرسی برای نمونه n8n شما',
				routing: {
					request: {
						method: 'POST',
						url: '/audit',
					},
				},
			},
		],
	},
];

export const auditFields: INodeProperties[] = [
	{
		displayName: 'گزینه‌های اضافی',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'افزودن فیلتر',
		displayOptions: {
			show: {
				resource: ['audit'],
			},
		},
		routing: {
			request: {
				body: {
					additionalOptions: '={{ $value }}',
				},
			},
		},
		default: {},
		options: [
			{
				displayName: 'دسته‌بندی‌ها',
				name: 'categories',
				description: 'دسته‌بندی‌های ریسک برای گنجاندن در حسابرسی',
				type: 'multiOptions',
				default: [],
				options: [
					{
						name: 'اعتبارسنجی‌ها',
						value: 'credentials',
					},
					{
						name: 'پایگاه داده',
						value: 'database',
					},
					{
						name: 'سیستم فایل',
						value: 'filesystem',
					},
					{
						name: 'نمونه',
						value: 'instance',
					},
					{
						name: 'گره‌ها',
						value: 'nodes',
					},
				],
			},
			{
				displayName: 'روزهای جریان کاری رها شده',
				name: 'daysAbandonedWorkflow',
				description:
					'تعداد روزهایی که یک جریان کاری در صورت عدم اجرا به عنوان رها شده در نظر گرفته می‌شود',
				type: 'number',
				default: 90,
			},
		],
	},
];
