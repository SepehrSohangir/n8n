import type { INodeProperties, INodeTypeDescription, IWebhookDescription } from 'n8n-workflow';

import { getResponseCode, getResponseData } from './utils';

export const defaultWebhookDescription: IWebhookDescription = {
	name: 'default',
	httpMethod: '={{$parameter["httpMethod"] || "GET"}}',
	isFullPath: true,
	responseCode: `={{(${getResponseCode})($parameter)}}`,
	responseMode: '={{$parameter["responseMode"]}}',
	responseData: `={{(${getResponseData})($parameter)}}`,
	responseBinaryPropertyName: '={{$parameter["responseBinaryPropertyName"]}}',
	responseContentType: '={{$parameter["options"]["responseContentType"]}}',
	responsePropertyName: '={{$parameter["options"]["responsePropertyName"]}}',
	responseHeaders: '={{$parameter["options"]["responseHeaders"]}}',
	path: '={{$parameter["path"]}}',
};

export const credentialsProperty = (
	propertyName = 'authentication',
): INodeTypeDescription['credentials'] => [
	{
		name: 'httpBasicAuth',
		required: true,
		displayOptions: {
			show: {
				[propertyName]: ['basicAuth'],
			},
		},
	},
	{
		name: 'httpHeaderAuth',
		required: true,
		displayOptions: {
			show: {
				[propertyName]: ['headerAuth'],
			},
		},
	},
	{
		name: 'jwtAuth',
		required: true,
		displayOptions: {
			show: {
				[propertyName]: ['jwtAuth'],
			},
		},
	},
];

export const authenticationProperty = (propertyName = 'authentication'): INodeProperties => ({
	displayName: 'احراز هویت',
	name: propertyName,
	type: 'options',
	options: [
		{
			name: 'Basic Auth',
			value: 'basicAuth',
		},
		{
			name: 'Header Auth',
			value: 'headerAuth',
		},
		{
			name: 'JWT Auth',
			value: 'jwtAuth',
		},
		{
			name: 'هیچکدام',
			value: 'none',
		},
	],
	default: 'none',
	description: 'روش احراز هویت',
});

export const httpMethodsProperty: INodeProperties = {
	displayName: 'متد HTTP',
	name: 'httpMethod',
	type: 'options',
	options: [
		{
			name: 'DELETE',
			value: 'DELETE',
		},
		{
			name: 'GET',
			value: 'GET',
		},
		{
			name: 'HEAD',
			value: 'HEAD',
		},
		{
			name: 'PATCH',
			value: 'PATCH',
		},
		{
			name: 'POST',
			value: 'POST',
		},
		{
			name: 'PUT',
			value: 'PUT',
		},
	],
	default: 'GET',
	description: 'متد HTTP ',
};

export const responseCodeProperty: INodeProperties = {
	displayName: 'کد پاسخ',
	name: 'responseCode',
	type: 'number',
	displayOptions: {
		hide: {
			responseMode: ['responseNode'],
		},
	},
	typeOptions: {
		minValue: 100,
		maxValue: 599,
	},
	default: 200,
	description: 'کد پاسخ HTTP که باید بازگردانده شود',
};

const responseModeOptions = [
	{
		name: 'فوراً',
		value: 'onReceived',
		description: 'به محض اجرای این نود',
	},
	{
		name: 'وقتی آخرین نود تمام شد',
		value: 'lastNode',
		description: 'بازگرداندن داده‌های آخرین نود اجرا شده',
	},
	{
		name: "استفاده از نود 'پاسخ به وبهوک'",
		value: 'responseNode',
		description: 'پاسخ تعریف شده در آن نود',
	},
];

export const responseModeProperty: INodeProperties = {
	displayName: 'پاسخ',
	name: 'responseMode',
	type: 'options',
	options: responseModeOptions,
	default: 'onReceived',
	description: 'چه زمان و چگونه به وبهوک پاسخ داده شود',
	displayOptions: {
		show: {
			'@version': [1, 1.1, 2],
		},
	},
};

export const responseModePropertyStreaming: INodeProperties = {
	displayName: 'پاسخ',
	name: 'responseMode',
	type: 'options',
	options: [
		...responseModeOptions,
		{
			name: 'پخش زنده',
			value: 'streaming',
			description: 'بازگرداندن داده‌ها به صورت زنده از نودهای فعال شده برای پخش زنده',
		},
	],
	default: 'onReceived',
	description: 'چه زمان و چگونه به وبهوک پاسخ داده شود',
	displayOptions: {
		hide: {
			'@version': [1, 1.1, 2],
		},
	},
};

export const responseDataProperty: INodeProperties = {
	displayName: 'داده‌های پاسخ',
	name: 'responseData',
	type: 'options',
	displayOptions: {
		show: {
			responseMode: ['lastNode'],
		},
	},
	options: [
		{
			name: 'تمام ورودی‌ها',
			value: 'allEntries',
			description: 'بازگرداندن تمام ورودی‌های آخرین نود. همیشه یک آرایه باز می‌گرداند.',
		},
		{
			name: 'اولین ورودی JSON',
			value: 'firstEntryJson',
			description: 'بازگرداندن داده‌های JSON اولین ورودی آخرین نود. همیشه یک شیء JSON باز می‌گرداند.',
		},
		{
			name: 'اولین ورودی باینری',
			value: 'firstEntryBinary',
			description:
				'بازگرداندن داده‌های باینری اولین ورودی آخرین نود. همیشه یک فایل باینری باز می‌گرداند.',
		},
		{
			name: 'بدون بدنه پاسخ',
			value: 'noData',
			description: 'بازگرداندن بدون بدنه',
		},
	],
	default: 'firstEntryJson',
	description:
		'چه داده‌ای باید بازگردانده شود. آیا باید تمام آیتم‌ها به صورت آرایه بازگردانده شوند یا فقط اولین آیتم به صورت شیء.',
};

export const responseBinaryPropertyNameProperty: INodeProperties = {
	displayName: 'نام ویژگی',
	name: 'responseBinaryPropertyName',
	type: 'string',
	required: true,
	default: 'data',
	displayOptions: {
		show: {
			responseData: ['firstEntryBinary'],
		},
	},
	description: 'نام ویژگی باینری که باید بازگردانده شود',
};

export const optionsProperty: INodeProperties = {
	displayName: 'گزینه‌ها',
	name: 'options',
	type: 'collection',
	placeholder: 'افزودن گزینه',
	default: {},
	options: [
		{
			displayName: 'فایل باینری',
			name: 'binaryData',
			type: 'boolean',
			displayOptions: {
				show: {
					'/httpMethod': ['PATCH', 'PUT', 'POST'],
					'@version': [1],
				},
			},
			default: false,
			description: 'آیا وبهوک داده‌های باینری دریافت خواهد کرد',
		},
		{
			displayName: 'قرار دادن فایل خروجی در فیلد',
			name: 'binaryPropertyName',
			type: 'string',
			default: 'data',
			displayOptions: {
				show: {
					binaryData: [true],
					'@version': [1],
				},
			},
			hint: 'نام فیلد خروجی باینری که فایل باید در آن قرار گیرد',
			description:
				'اگر داده‌ها از طریق "Form-Data Multipart" دریافت شوند، این پیش‌وند خواهد بود و عددی که از 0 شروع می‌شود به آن اضافه خواهد شد',
		},
		{
			displayName: 'نام فیلد برای داده‌های باینری',
			name: 'binaryPropertyName',
			type: 'string',
			default: 'data',
			displayOptions: {
				hide: {
					'@version': [1],
				},
			},
			description:
				'نام فیلد خروجی برای قرار دادن هر داده فایل باینری. فقط در صورتی که داده‌های باینری دریافت شود مرتبط است.',
		},
		{
			displayName: 'نادیده گرفتن ربات‌ها',
			name: 'ignoreBots',
			type: 'boolean',
			default: false,
			description:
				'آیا درخواست‌ها از ربات‌هایی مانند پیش‌نمایش‌دهنده‌های لینک و خزنده‌های وب نادیده گرفته شوند',
		},
		{
			displayName: 'فهرست سفید IP',
			name: 'ipWhitelist',
			type: 'string',
			placeholder: 'e.g. 127.0.0.1',
			default: '',
			description: 'فهرست جداشده با کاما از آدرس‌های IP مجاز. خالی بگذارید تا همه IPها مجاز باشند.',
		},
		{
			displayName: 'بدون بدنه پاسخ',
			name: 'noResponseBody',
			type: 'boolean',
			default: false,
			description: 'آیا باید بدنه‌ای در پاسخ ارسال شود',
			displayOptions: {
				hide: {
					rawBody: [true],
				},
				show: {
					'/responseMode': ['onReceived'],
				},
			},
		},
		{
			displayName: 'بدنه خام',
			name: 'rawBody',
			type: 'boolean',
			displayOptions: {
				show: {
					'@version': [1],
				},
				hide: {
					binaryData: [true],
					noResponseBody: [true],
				},
			},
			default: false,
			// eslint-disable-next-line n8n-nodes-base/node-param-description-boolean-without-whether
			description: 'بدنه خام (باینری)',
		},
		{
			displayName: 'بدنه خام',
			name: 'rawBody',
			type: 'boolean',
			displayOptions: {
				hide: {
					noResponseBody: [true],
					'@version': [1],
				},
			},
			default: false,
			description: 'آیا باید بدنه خام بازگردانده شود',
		},
		{
			displayName: 'داده پاسخ',
			name: 'responseData',
			type: 'string',
			displayOptions: {
				show: {
					'/responseMode': ['onReceived'],
				},
				hide: {
					noResponseBody: [true],
				},
			},
			default: '',
			placeholder: 'موفقیت',
			description: 'داده پاسخ سفارشی برای ارسال',
		},
		{
			displayName: 'نوع محتوای پاسخ',
			name: 'responseContentType',
			type: 'string',
			displayOptions: {
				show: {
					'/responseData': ['firstEntryJson'],
					'/responseMode': ['lastNode'],
				},
			},
			default: '',
			placeholder: 'application/xml',
			// eslint-disable-next-line n8n-nodes-base/node-param-description-miscased-json
			description:
				'نوع محتوای سفارشی برای بازگرداندن اگر نوع دیگری به جز "application/json" باید بازگردانده شود',
		},
		{
			displayName: 'هدرهای پاسخ',
			name: 'responseHeaders',
			placeholder: 'افزودن هدر پاسخ',
			description: 'افزودن هدرها به پاسخ وبهوک',
			type: 'fixedCollection',
			typeOptions: {
				multipleValues: true,
			},
			default: {},
			options: [
				{
					name: 'entries',
					displayName: 'ورودی‌ها',
					values: [
						{
							displayName: 'نام',
							name: 'name',
							type: 'string',
							default: '',
							description: 'نام هدر',
						},
						{
							displayName: 'مقدار',
							name: 'value',
							type: 'string',
							default: '',
							description: 'مقدار هدر',
						},
					],
				},
			],
		},
		{
			displayName: 'نام ویژگی',
			name: 'responsePropertyName',
			type: 'string',
			displayOptions: {
				show: {
					'/responseData': ['firstEntryJson'],
					'/responseMode': ['lastNode'],
				},
			},
			default: 'data',
			description: 'نام ویژگی برای بازگرداندن داده‌ها به جای کل JSON',
		},
	],
};

export const responseCodeSelector: INodeProperties = {
	displayName: 'کد پاسخ',
	name: 'responseCode',
	type: 'options',
	options: [
		{ name: '200', value: 200, description: 'OK - درخواست با موفقیت انجام شد' },
		{ name: '201', value: 201, description: 'Created - درخواست انجام شده است' },
		{
			name: '204',
			value: 204,
			description: 'No Content - درخواست پردازش شده، محتوایی بازگردانده نشد',
		},
		{
			name: '301',
			value: 301,
			description: 'Moved Permanently - منبع درخواست به طور دائم منتقل شده است',
		},
		{ name: '302', value: 302, description: 'Found - منبع درخواست به طور موقت منتقل شده است' },
		{ name: '304', value: 304, description: 'Not Modified - منبع تغییر نکرده است' },
		{ name: '400', value: 400, description: 'Bad Request - درخواست قابل درک نبود' },
		{
			name: '401',
			value: 401,
			description: 'Unauthorized - درخواست نیاز به احراز هویت کاربر دارد',
		},
		{
			name: '403',
			value: 403,
			description: 'Forbidden - سرور درخواست را فهمید، اما از انجام آن خودداری می‌کند',
		},
		{ name: '404', value: 404, description: 'Not Found - سرور مطابقتی پیدا نکرده است' },
		{
			name: 'کد سفارشی',
			value: 'customCode',
			description: 'هر کد پاسخ HTTP دلخواهی را مشخص کنید',
		},
	],
	default: 200,
	description: 'کد پاسخ HTTP برای بازگرداندن',
};

export const responseCodeOption: INodeProperties = {
	displayName: 'کد پاسخ',
	name: 'responseCode',
	placeholder: 'افزودن کد پاسخ',
	type: 'fixedCollection',
	default: {
		values: {
			responseCode: 200,
		},
	},
	options: [
		{
			name: 'values',
			displayName: 'مقادیر',
			values: [
				responseCodeSelector,
				{
					displayName: 'کد سفارشی',
					name: 'customCode',
					type: 'number',
					default: 200,
					placeholder: 'e.g. 400',
					typeOptions: {
						minValue: 100,
					},
					displayOptions: {
						show: {
							responseCode: ['customCode'],
						},
					},
				},
			],
		},
	],
	displayOptions: {
		show: {
			'@version': [{ _cnd: { gte: 2 } }],
		},
		hide: {
			'/responseMode': ['responseNode'],
		},
	},
};
