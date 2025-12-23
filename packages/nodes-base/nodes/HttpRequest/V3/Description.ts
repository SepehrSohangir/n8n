import type { INodeProperties } from 'n8n-workflow';

import { optimizeResponseProperties } from '../shared/optimizeResponse';

const preBuiltAgentsCallout: INodeProperties = {
	// eslint-disable-next-line n8n-nodes-base/node-param-display-name-miscased
	displayName: 'درخواست HTTP را با ابزارهای آماده اجرا کنید',
	name: 'preBuiltAgentsCalloutHttpRequest',
	type: 'callout',
	typeOptions: {
		calloutAction: {
			label: 'ربات جوک',
			icon: 'bot',
			type: 'openSampleWorkflowTemplate',
			templateId: 'joke_agent_with_http_tool',
		},
	},
	default: '',
};

export const mainProperties: INodeProperties[] = [
	preBuiltAgentsCallout,
	{
		displayName: '',
		name: 'curlImport',
		type: 'curlImport',
		default: '',
	},
	{
		displayName: 'روش درخواست',
		name: 'method',
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
				name: 'OPTIONS',
				value: 'OPTIONS',
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
		description: 'روش درخواست را برای استفاده انتخاب کنید',
	},
	{
		displayName: 'URL',
		name: 'url',
		type: 'string',
		default: '',
		placeholder: 'http://example.com/index.html',
		description: 'آدرس URL برای ارسال درخواست به آن',
		required: true,
	},
	{
		displayName: 'احراز هویت',
		name: 'authentication',
		noDataExpression: true,
		type: 'options',
		options: [
			{
				name: 'هیچکدام',
				value: 'none',
			},
			{
				name: 'نوع اعتبارنامه از پیش تعریف شده',
				value: 'predefinedCredentialType',
				description:
					'ما قبلاً احراز هویت را برای بسیاری از خدمات پیاده‌سازی کرده‌ایم تا نیازی به تنظیم دستی آن نداشته باشید',
			},
			{
				name: 'نوع اعتبارنامه عمومی',
				value: 'genericCredentialType',
				description: 'کاملاً قابل تنظیم. انتخاب بین basic، header، OAuth2 و غیره.',
			},
		],
		default: 'none',
	},
	{
		displayName: 'نوع اعتبارنامه',
		name: 'nodeCredentialType',
		type: 'credentialsSelect',
		noDataExpression: true,
		required: true,
		default: '',
		credentialTypes: ['extends:oAuth2Api', 'extends:oAuth1Api', 'has:authenticate'],
		displayOptions: {
			show: {
				authentication: ['predefinedCredentialType'],
			},
		},
	},
	{
		displayName: 'مطمئن شوید که دامنه(های) حساب سرویس را در اعتبارنامه مشخص کرده‌اید',
		name: 'googleApiWarning',
		type: 'notice',
		default: '',
		displayOptions: {
			show: {
				nodeCredentialType: ['googleApi'],
			},
		},
	},
	{
		displayName: 'نوع اعتبارنامه عمومی',
		name: 'genericAuthType',
		type: 'credentialsSelect',
		required: true,
		default: '',
		credentialTypes: ['has:genericAuth'],
		displayOptions: {
			show: {
				authentication: ['genericCredentialType'],
			},
		},
	},
	{
		displayName: 'گواهی‌های SSL',
		name: 'provideSslCertificates',
		type: 'boolean',
		default: false,
		isNodeSetting: true,
	},
	{
		displayName: "گواهی‌ها را در پارامتر 'اعتبارنامه برای گواهی‌های SSL' گره ارائه دهید",
		name: 'provideSslCertificatesNotice',
		type: 'notice',
		default: '',
		isNodeSetting: true,
		displayOptions: {
			show: {
				provideSslCertificates: [true],
			},
		},
	},
	{
		displayName: 'گواهی SSL',
		name: 'sslCertificate',
		type: 'credentials',
		default: '',
		displayOptions: {
			show: {
				provideSslCertificates: [true],
			},
		},
	},
	{
		displayName: 'ارسال پارامترهای Query',
		name: 'sendQuery',
		type: 'boolean',
		default: false,
		noDataExpression: true,
		description: 'آیا درخواست پارامترهای query دارد یا خیر',
	},
	{
		displayName: 'مشخص کردن پارامترهای Query',
		name: 'specifyQuery',
		type: 'options',
		displayOptions: {
			show: {
				sendQuery: [true],
			},
		},
		options: [
			{
				name: 'استفاده از فیلدهای زیر',
				value: 'keypair',
			},
			{
				name: 'استفاده از JSON',
				value: 'json',
			},
		],
		default: 'keypair',
	},
	{
		displayName: 'پارامترهای Query',
		name: 'queryParameters',
		type: 'fixedCollection',
		displayOptions: {
			show: {
				sendQuery: [true],
				specifyQuery: ['keypair'],
			},
		},
		typeOptions: {
			multipleValues: true,
		},
		placeholder: 'افزودن پارامتر',
		default: {
			parameters: [
				{
					name: '',
					value: '',
				},
			],
		},
		options: [
			{
				name: 'parameters',
				displayName: 'پارامتر',
				values: [
					{
						displayName: 'نام',
						name: 'name',
						type: 'string',
						default: '',
					},
					{
						displayName: 'مقدار',
						name: 'value',
						type: 'string',
						default: '',
					},
				],
			},
		],
	},
	{
		displayName: 'JSON',
		name: 'jsonQuery',
		type: 'json',
		displayOptions: {
			show: {
				sendQuery: [true],
				specifyQuery: ['json'],
			},
		},
		default: '',
	},
	{
		displayName: 'ارسال هدرها',
		name: 'sendHeaders',
		type: 'boolean',
		default: false,
		noDataExpression: true,
		description: 'آیا درخواست هدر دارد یا خیر',
	},
	{
		displayName: 'مشخص کردن هدرها',
		name: 'specifyHeaders',
		type: 'options',
		displayOptions: {
			show: {
				sendHeaders: [true],
			},
		},
		options: [
			{
				name: 'استفاده از فیلدهای زیر',
				value: 'keypair',
			},
			{
				name: 'استفاده از JSON',
				value: 'json',
			},
		],
		default: 'keypair',
	},
	{
		displayName: 'پارامترهای هدر',
		name: 'headerParameters',
		type: 'fixedCollection',
		displayOptions: {
			show: {
				sendHeaders: [true],
				specifyHeaders: ['keypair'],
			},
		},
		typeOptions: {
			multipleValues: true,
		},
		placeholder: 'افزودن پارامتر',
		default: {
			parameters: [
				{
					name: '',
					value: '',
				},
			],
		},
		options: [
			{
				name: 'parameters',
				displayName: 'پارامتر',
				values: [
					{
						displayName: 'نام',
						name: 'name',
						type: 'string',
						default: '',
					},
					{
						displayName: 'مقدار',
						name: 'value',
						type: 'string',
						default: '',
					},
				],
			},
		],
	},
	{
		displayName: 'JSON',
		name: 'jsonHeaders',
		type: 'json',
		displayOptions: {
			show: {
				sendHeaders: [true],
				specifyHeaders: ['json'],
			},
		},
		default: '',
	},
	{
		displayName: 'ارسال بدنه',
		name: 'sendBody',
		type: 'boolean',
		default: false,
		noDataExpression: true,
		description: 'آیا درخواست بدنه دارد یا خیر',
	},
	{
		displayName: 'نوع محتوای بدنه',
		name: 'contentType',
		type: 'options',
		displayOptions: {
			show: {
				sendBody: [true],
			},
		},
		options: [
			{
				name: 'از فرم کدگذاری شده (Form Urlencoded)',
				value: 'form-urlencoded',
			},
			{
				name: 'فرم-داده (Form-Data)',
				value: 'multipart-form-data',
			},
			{
				name: 'JSON',
				value: 'json',
			},
			{
				// eslint-disable-next-line n8n-nodes-base/node-param-display-name-miscased
				name: 'فایل باینری n8n',
				value: 'binaryData',
			},
			{
				name: 'خام (raw)',
				value: 'raw',
			},
		],
		default: 'json',
		description: 'Content-Type to use to send body parameters',
	},
	{
		displayName: 'مشخص کردن بدنه',
		name: 'specifyBody',
		type: 'options',
		displayOptions: {
			show: {
				sendBody: [true],
				contentType: ['json'],
			},
		},
		options: [
			{
				name: 'استفاده از فیلدهای زیر',
				value: 'keypair',
			},
			{
				name: 'استفاده از JSON',
				value: 'json',
			},
		],
		default: 'keypair',
		// eslint-disable-next-line n8n-nodes-base/node-param-description-miscased-json
		description:
			'بدنه می‌تواند با استفاده از فیلدهای صریح (<code>keypair</code>) یا با استفاده از یک شیء جاوااسکریپت (<code>json</code>) مشخص شود',
	},
	{
		displayName: 'پارامترهای بدنه',
		name: 'bodyParameters',
		type: 'fixedCollection',
		displayOptions: {
			show: {
				sendBody: [true],
				contentType: ['json'],
				specifyBody: ['keypair'],
			},
		},
		typeOptions: {
			multipleValues: true,
		},
		placeholder: 'افزودن پارامتر',
		default: {
			parameters: [
				{
					name: '',
					value: '',
				},
			],
		},
		options: [
			{
				name: 'parameters',
				displayName: 'پارامتر',
				values: [
					{
						displayName: 'نام',
						name: 'name',
						type: 'string',
						default: '',
						description:
							'شناسه فیلدی که باید تنظیم شود. از لیست انتخاب کنید، یا با استفاده از یک <a href="https://docs.n8n.io/code/expressions/">عبارت</a> یک شناسه مشخص کنید.',
					},
					{
						displayName: 'مقدار',
						name: 'value',
						type: 'string',
						default: '',
						description: 'مقدار فیلدی که باید تنظیم شود',
					},
				],
			},
		],
	},
	{
		displayName: 'JSON',
		name: 'jsonBody',
		type: 'json',
		displayOptions: {
			show: {
				sendBody: [true],
				contentType: ['json'],
				specifyBody: ['json'],
			},
		},
		default: '',
	},
	{
		displayName: 'پارامترهای بدنه',
		name: 'bodyParameters',
		type: 'fixedCollection',
		displayOptions: {
			show: {
				sendBody: [true],
				contentType: ['multipart-form-data'],
			},
		},
		typeOptions: {
			multipleValues: true,
		},
		placeholder: 'افزودن پارامتر',
		default: {
			parameters: [
				{
					name: '',
					value: '',
				},
			],
		},
		options: [
			{
				name: 'parameters',
				displayName: 'پارامتر',
				values: [
					{
						displayName: 'نوع پارامتر',
						name: 'parameterType',
						type: 'options',
						options: [
							{
								// eslint-disable-next-line n8n-nodes-base/node-param-display-name-miscased
								name: 'فایل باینری n8n',
								value: 'formBinaryData',
							},
							{
								name: 'فرم-داده (form-data)',
								value: 'formData',
							},
						],
						default: 'formData',
					},
					{
						displayName: 'نام',
						name: 'name',
						type: 'string',
						default: '',
						description:
							'شناسه فیلدی که باید تنظیم شود. از لیست انتخاب کنید، یا با استفاده از یک <a href="https://docs.n8n.io/code/expressions/">عبارت</a> یک شناسه مشخص کنید.',
					},
					{
						displayName: 'مقدار',
						name: 'value',
						type: 'string',
						displayOptions: {
							show: {
								parameterType: ['formData'],
							},
						},
						default: '',
						description: 'مقدار فیلدی که باید تنظیم شود',
					},
					{
						displayName: 'نام فیلد داده ورودی',
						name: 'inputDataFieldName',
						type: 'string',
						displayOptions: {
							show: {
								parameterType: ['formBinaryData'],
							},
						},
						default: '',
						description: 'نام فیلد ورودی حاوی داده فایل باینری که باید پردازش شود',
					},
				],
			},
		],
	},
	{
		displayName: 'مشخص کردن بدنه',
		name: 'specifyBody',
		type: 'options',
		displayOptions: {
			show: {
				sendBody: [true],
				contentType: ['form-urlencoded'],
			},
		},
		options: [
			{
				name: 'استفاده از فیلدهای زیر (keypair)',
				value: 'keypair',
			},
			{
				name: 'استفاده از یک فیلد تکی (string)',
				value: 'string',
			},
		],
		default: 'keypair',
	},
	{
		displayName: 'پارامترهای بدنه',
		name: 'bodyParameters',
		type: 'fixedCollection',
		displayOptions: {
			show: {
				sendBody: [true],
				contentType: ['form-urlencoded'],
				specifyBody: ['keypair'],
			},
		},
		typeOptions: {
			multipleValues: true,
		},
		placeholder: 'افزودن پارامتر',
		default: {
			parameters: [
				{
					name: '',
					value: '',
				},
			],
		},
		options: [
			{
				name: 'parameters',
				displayName: 'پارامتر',
				values: [
					{
						displayName: 'نام',
						name: 'name',
						type: 'string',
						default: '',
						description:
							'شناسه فیلدی که باید تنظیم شود. از لیست انتخاب کنید، یا با استفاده از یک <a href="https://docs.n8n.io/code/expressions/">عبارت</a> یک شناسه مشخص کنید.',
					},
					{
						displayName: 'مقدار',
						name: 'value',
						type: 'string',
						default: '',
						description: 'مقدار فیلدی که باید تنظیم شود',
					},
				],
			},
		],
	},
	{
		displayName: 'بدنه',
		name: 'body',
		type: 'string',
		displayOptions: {
			show: {
				sendBody: [true],
				specifyBody: ['string'],
			},
		},
		default: '',
		placeholder: 'field1=value1&field2=value2',
	},
	{
		displayName: 'نام فیلد داده ورودی',
		name: 'inputDataFieldName',
		type: 'string',
		displayOptions: {
			show: {
				sendBody: [true],
				contentType: ['binaryData'],
			},
		},
		default: '',
		description: 'نام فیلد ورودی حاوی داده فایل باینری که باید پردازش شود',
	},
	{
		displayName: 'نوع محتوای خام',
		name: 'rawContentType',
		type: 'string',
		displayOptions: {
			show: {
				sendBody: [true],
				contentType: ['raw'],
			},
		},
		default: '',
		placeholder: 'text/html',
	},
	{
		displayName: 'بدنه',
		name: 'body',
		type: 'string',
		displayOptions: {
			show: {
				sendBody: [true],
				contentType: ['raw'],
			},
		},
		default: '',
		placeholder: '',
	},
	{
		displayName: 'گزینه‌ها',
		name: 'options',
		type: 'collection',
		placeholder: 'افزودن گزینه',
		default: {},
		options: [
			{
				displayName: 'دسته‌بندی',
				name: 'batching',
				placeholder: 'افزودن دسته‌بندی',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: false,
				},
				default: {
					batch: {},
				},
				options: [
					{
						displayName: 'دسته‌بندی',
						name: 'batch',
						values: [
							{
								displayName: 'آیتم‌ها در هر دسته',
								name: 'batchSize',
								type: 'number',
								typeOptions: {
									minValue: -1,
								},
								default: 50,
								description:
									'ورودی به دسته‌هایی تقسیم می‌شود تا درخواست‌ها کنترل شوند. -1 برای غیرفعال. 0 به عنوان 1 در نظر گرفته می‌شود.',
							},
							{
								// eslint-disable-next-line n8n-nodes-base/node-param-display-name-miscased
								displayName: 'فاصله دسته (میلی‌ثانیه)',
								name: 'batchInterval',
								type: 'number',
								typeOptions: {
									minValue: 0,
								},
								default: 1000,
								description: 'زمان (بر حسب میلی‌ثانیه) بین هر دسته از درخواست‌ها. 0 برای غیرفعال.',
							},
						],
					},
				],
			},
			{
				displayName: 'نادیده گرفتن مشکلات SSL (ناامن)',
				name: 'allowUnauthorizedCerts',
				type: 'boolean',
				noDataExpression: true,
				default: false,
				// eslint-disable-next-line n8n-nodes-base/node-param-description-wrong-for-ignore-ssl-issues
				description: 'دانلود پاسخ حتی در صورت نامعتبر بودن گواهی SSL سرور (ناامن)',
			},
			{
				displayName: 'فرمت آرایه در پارامترهای Query',
				name: 'queryParameterArrays',
				type: 'options',
				displayOptions: {
					show: {
						'/sendQuery': [true],
					},
				},
				options: [
					{
						name: 'بدون براکت',
						value: 'repeat',
						// eslint-disable-next-line n8n-nodes-base/node-param-description-lowercase-first-char
						description: 'e.g. foo=bar&foo=qux',
					},
					{
						name: 'فقط براکت',
						value: 'brackets',
						// eslint-disable-next-line n8n-nodes-base/node-param-description-lowercase-first-char
						description: 'e.g. foo[]=bar&foo[]=qux',
					},
					{
						name: 'براکت‌ها با اندیس‌ها',
						value: 'indices',
						// eslint-disable-next-line n8n-nodes-base/node-param-description-lowercase-first-char
						description: 'e.g. foo[0]=bar&foo[1]=qux',
					},
				],
				default: 'brackets',
			},
			{
				displayName: 'ارسال هدرها با حروف کوچک (Lowercase)',
				name: 'lowercaseHeaders',
				type: 'boolean',
				default: true,
				description: 'هدر ها را با حروف کوچک ارسال کنید',
			},
			{
				displayName: 'ریدایرکت‌ها',
				name: 'redirect',
				placeholder: 'افزودن ریدایرکت',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: false,
				},
				default: { redirect: {} },
				options: [
					{
						displayName: 'ریدایرکت',
						name: 'redirect',
						values: [
							{
								displayName: 'دنبال کردن ریدایرکت‌ها',
								name: 'followRedirects',
								type: 'boolean',
								default: false,
								noDataExpression: true,
								description: 'دنبال کردن همه ریدایرکت‌ها',
							},
							{
								displayName: 'حداکثر ریدایرکت‌ها',
								name: 'maxRedirects',
								type: 'number',
								displayOptions: {
									show: {
										followRedirects: [true],
									},
								},
								default: 21,
								description: 'حداکثر تعداد ریدایرکت‌هایی که باید دنبال شوند',
							},
						],
					},
				],
				displayOptions: {
					show: {
						'@version': [1, 2, 3],
					},
				},
			},
			{
				displayName: 'ریدایرکت‌ها',
				name: 'redirect',
				placeholder: 'افزودن ریدایرکت',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: false,
				},
				default: {
					redirect: {},
				},
				options: [
					{
						displayName: 'ریدایرکت',
						name: 'redirect',
						values: [
							{
								displayName: 'دنبال کردن ریدایرکت‌ها',
								name: 'followRedirects',
								type: 'boolean',
								default: true,
								noDataExpression: true,
								description: 'دنبال کردن همه ریدایرکت‌ها',
							},
							{
								displayName: 'حداکثر ریدایرکت‌ها',
								name: 'maxRedirects',
								type: 'number',
								displayOptions: {
									show: {
										followRedirects: [true],
									},
								},
								default: 21,
								description: 'حداکثر تعداد ریدایرکت‌هایی که باید دنبال شوند',
							},
						],
					},
				],
				displayOptions: {
					hide: {
						'@version': [1, 2, 3],
					},
				},
			},
			{
				displayName: 'پاسخ',
				name: 'response',
				placeholder: 'افزودن پاسخ',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: false,
				},
				default: {
					response: {},
				},
				options: [
					{
						displayName: 'پاسخ',
						name: 'response',
						values: [
							{
								displayName: 'شامل هدرها و وضعیت پاسخ',
								name: 'fullResponse',
								type: 'boolean',
								default: false,
								description:
									'آیا باید پاسخ کامل (هدرها و کد وضعیت پاسخ) به جای فقط بدنه بازگردانده شود',
							},
							{
								displayName: 'هرگز خطا نده',
								name: 'neverError',
								type: 'boolean',
								default: false,
								description: 'آیا باید حتی زمانی که کد وضعیت 2xx نیست موفقیت‌آمیز باشد',
							},
							{
								displayName: 'فرمت پاسخ',
								name: 'responseFormat',
								type: 'options',
								noDataExpression: true,
								options: [
									{
										name: 'تشخیص خودکار (Autodetect)',
										value: 'autodetect',
									},
									{
										name: 'فایل',
										value: 'file',
									},
									{
										name: 'JSON',
										value: 'json',
									},
									{
										name: 'متن',
										value: 'text',
									},
								],
								default: 'autodetect',
								description: 'فرمت داده‌ای که انتظار دارید از سرور دریافت کنید',
							},
							{
								displayName: 'ذخیره خروجی در فیلد',
								name: 'outputPropertyName',
								type: 'string',
								default: 'data',
								required: true,
								displayOptions: {
									show: {
										responseFormat: ['file', 'text'],
									},
								},
								description: 'نام ویژگی باینری که داده‌های فایل خوانده شده در آن نوشته می‌شود',
							},
						],
					},
				],
			},
			{
				displayName: 'پیج بندی',
				name: 'pagination',
				placeholder: 'افزودن پیج بندی',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: false,
				},
				default: {
					pagination: {},
				},
				options: [
					{
						displayName: 'پیج بندی',
						name: 'pagination',
						values: [
							{
								displayName: 'حالت پیج بندی',
								name: 'paginationMode',
								type: 'options',
								typeOptions: {
									noDataExpression: true,
								},
								options: [
									{
										name: 'Off',
										value: 'off',
									},
									{
										name: 'آپدیت یک پارامتر در هر درخواست',
										value: 'updateAParameterInEachRequest',
									},
									{
										name: 'پاسخ شامل URL بعدی است',
										value: 'responseContainsNextURL',
									},
								],
								default: 'updateAParameterInEachRequest',
								description: 'روش پیج بندی برای استفاده را انتخاب کنید',
							},
							{
								displayName:
									'استفاده از متغیرهای $response برای دسترسی به داده‌های پاسخ قبلی. برای اطلاعات بیشتر به <a href="https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/#pagination/?utm_source=n8n_app&utm_medium=node_settings_modal-credential_link&utm_campaign=n8n-nodes-base.httprequest" target="_blank">مستندات</a> مراجعه کنید.',
								name: 'webhookNotice',
								displayOptions: {
									hide: {
										paginationMode: ['off'],
									},
								},
								type: 'notice',
								default: '',
							},
							{
								displayName: 'URL بعدی',
								name: 'nextURL',
								type: 'string',
								displayOptions: {
									show: {
										paginationMode: ['responseContainsNextURL'],
									},
								},
								default: '',
								description:
									'باید به URL صفحه بعد ارزیابی شود. <a href="https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/#pagination" target="_blank">اطلاعات بیشتر</a>.',
							},
							{
								displayName: 'پارامترها',
								name: 'parameters',
								type: 'fixedCollection',
								displayOptions: {
									show: {
										paginationMode: ['updateAParameterInEachRequest'],
									},
								},
								typeOptions: {
									multipleValues: true,
									noExpression: true,
								},
								placeholder: 'افزودن پارامتر',
								default: {
									parameters: [
										{
											type: 'qs',
											name: '',
											value: '',
										},
									],
								},
								options: [
									{
										name: 'parameters',
										displayName: 'پارامتر',
										values: [
											{
												displayName: 'نوع',
												name: 'type',
												type: 'options',
												options: [
													{
														name: 'بدنه',
														value: 'body',
													},
													{
														name: 'هدرها',
														value: 'headers',
													},
													{
														name: 'کوئری (Query)',
														value: 'qs',
													},
												],
												default: 'qs',
												description: 'جایی که پارامتر باید تنظیم شود',
											},
											{
												displayName: 'نام',
												name: 'name',
												type: 'string',
												default: '',
												placeholder: 'مثلاً صفحه',
											},
											{
												displayName: 'مقدار',
												name: 'value',
												type: 'string',
												default: '',
												hint: 'از حالت عبارت و $response برای دسترسی به داده‌های پاسخ استفاده کنید',
											},
										],
									},
								],
							},
							{
								displayName: 'زمان تکمیل صفحه‌بندی',
								name: 'paginationCompleteWhen',
								type: 'options',
								typeOptions: {
									noDataExpression: true,
								},
								displayOptions: {
									hide: {
										paginationMode: ['off'],
									},
								},
								options: [
									{
										name: 'پاسخ خالی است',
										value: 'responseIsEmpty',
									},
									{
										name: 'دریافت کد وضعیت خاص',
										value: 'receiveSpecificStatusCodes',
									},
									{
										name: 'سایر',
										value: 'other',
									},
								],
								default: 'responseIsEmpty',
								description: 'چه زمانی نباید درخواست‌های بیشتری ارسال شود؟',
							},
							{
								displayName: 'کد وضعیت(ها) هنگام تکمیل',
								name: 'statusCodesWhenComplete',
								type: 'string',
								typeOptions: {
									noDataExpression: true,
								},
								displayOptions: {
									show: {
										paginationCompleteWhen: ['receiveSpecificStatusCodes'],
									},
								},
								default: '',
								description: 'مقادیر جدا شده با کاما را می‌پذیرد',
							},
							{
								displayName: 'عبارت تکمیل',
								name: 'completeExpression',
								type: 'string',
								displayOptions: {
									show: {
										paginationCompleteWhen: ['other'],
									},
								},
								default: '',
								description:
									'باید زمانی که صفحه‌بندی کامل است به true ارزیابی شود. <a href="https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/#pagination" target="_blank">اطلاعات بیشتر</a>.',
							},
							{
								displayName: 'محدود کردن صفحات واکشی شده',
								name: 'limitPagesFetched',
								type: 'boolean',
								typeOptions: {
									noDataExpression: true,
								},
								displayOptions: {
									hide: {
										paginationMode: ['off'],
									},
								},
								default: false,
								noDataExpression: true,
								description: 'آیا می‌خواهید تعداد صفحات واکشی شده را محدود کنید؟',
							},
							{
								displayName: 'حداکثر درخواست‌ها',
								name: 'maxRequests',
								type: 'number',
								typeOptions: {
									noDataExpression: true,
								},
								displayOptions: {
									show: {
										limitPagesFetched: [true],
									},
								},
								default: 100,
								description: 'حداکثر تعداد درخواست‌هایی که باید انجام شود',
							},
							{
								// eslint-disable-next-line n8n-nodes-base/node-param-display-name-miscased
								displayName: 'فاصله بین درخواست‌ها (میلی‌ثانیه)',
								name: 'requestInterval',
								type: 'number',
								displayOptions: {
									hide: {
										paginationMode: ['off'],
									},
								},
								default: 0,
								description: 'زمان (بر حسب میلی‌ثانیه) برای صبر بین درخواست‌ها',
								hint: 'اگر 0 باشد، هیچ زمانی صبر نخواهد شد',
								typeOptions: {
									minValue: 0,
								},
							},
						],
					},
				],
			},
			{
				displayName: 'پروکسی',
				name: 'proxy',
				type: 'string',
				default: '',
				placeholder: 'e.g. http://myproxy:3128',
				description: 'HTTP proxy to use',
			},
			{
				displayName: 'تایم اوت درخواست (ms)',
				name: 'timeout',
				type: 'number',
				typeOptions: {
					minValue: 1,
				},
				default: 10000,
				description: 'زمان (بر حسب میلی‌ثانیه) قبل از اینکه درخواست منقضی شود و خطا دهد',
			},
		],
	},
	...optimizeResponseProperties.map((prop) => ({
		...prop,
		displayOptions: {
			...prop.displayOptions,
			show: { ...prop.displayOptions?.show, '@tool': [true] },
		},
	})),
	{
		displayName:
			'این گره برای ارسال درخواست‌های HTTP استفاده می‌شود و می‌تواند با هر API یا وب‌سرویسی که از HTTP استفاده می‌کند کار کند. برای اطلاعات بیشتر به <a href="https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/?utm_source=n8n_app&utm_medium=node_settings_modal-documentation_link&utm_campaign=n8n-nodes-base.httprequest" target="_blank">مستندات</a> مراجعه کنید.',
		name: 'infoMessage',
		type: 'notice',
		default: '',
	},
];
