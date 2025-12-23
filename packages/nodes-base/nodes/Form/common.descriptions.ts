import type { INodeProperties } from 'n8n-workflow';

import { appendAttributionOption } from '../../utils/descriptions';

export const placeholder: string = `
<!-- Your custom HTML here --->


`.trimStart();

export const webhookPath: INodeProperties = {
	displayName: 'مسیر فرم',
	name: 'path',
	type: 'string',
	default: '',
	placeholder: 'وب‌هوک',
	required: true,
	description: 'آخرین بخش از URL فرم، هم برای تست و هم برای تولید',
};

export const formTitle: INodeProperties = {
	displayName: 'عنوان فرم',
	name: 'formTitle',
	type: 'string',
	default: '',
	placeholder: 'مثلاً تماس با ما',
	required: true,
	description: 'نمایش داده شده در بالای فرم',
};

export const formDescription: INodeProperties = {
	displayName: 'توضیحات فرم',
	name: 'formDescription',
	type: 'string',
	default: '',
	placeholder: 'مثلاً به زودی با شما تماس خواهیم گرفت!',
	description:
		'نمایش داده شده در زیر عنوان فرم. می‌تواند برای راهنمایی کاربر در تکمیل فرم استفاده شود. HTML را می‌پذیرد.',
	typeOptions: {
		rows: 2,
	},
};

export const formFields: INodeProperties = {
	displayName: 'عناصر فرم',
	name: 'formFields',
	placeholder: 'افزودن عنصر فرم',
	type: 'fixedCollection',
	default: {},
	typeOptions: {
		multipleValues: true,
		sortable: true,
	},
	options: [
		{
			displayName: 'مقادیر',
			name: 'values',
			values: [
				{
					displayName: 'نام فیلد',
					name: 'fieldName',
					description:
						'نام فیلد، که در ویژگی‌های ورودی استفاده می‌شود و توسط جریان کاری ارجاع داده می‌شود',
					required: true,
					type: 'string',
					default: '',
					displayOptions: {
						hide: {
							fieldType: ['html'],
						},
						show: {
							'@version': [{ _cnd: { gte: 2.4 } }],
						},
					},
				},
				{
					displayName: 'لیبل فیلد',
					name: 'fieldLabel',
					type: 'string',
					default: '',
					placeholder: 'مثلاً نام شما چیست؟',
					description: 'لیبلی که بالای فیلد ورودی نمایش داده می‌شود',
					required: true,
					displayOptions: {
						hide: {
							fieldType: ['hiddenField', 'html'],
						},
						show: {
							'@version': [{ _cnd: { gte: 2.4 } }],
						},
					},
				},
				{
					displayName: 'لیبل فیلد',
					name: 'fieldLabel',
					type: 'string',
					default: '',
					placeholder: 'مثلاً نام شما چیست؟',
					description: 'لیبلی که بالای فیلد ورودی نمایش داده می‌شود',
					required: true,
					displayOptions: {
						hide: {
							fieldType: ['hiddenField', 'html'],
						},
						show: {
							'@version': [{ _cnd: { lt: 2.4 } }],
						},
					},
				},
				{
					displayName: 'نام فیلد',
					name: 'fieldName',
					description:
						'نام فیلد، که در ویژگی‌های ورودی استفاده می‌شود و توسط جریان کاری ارجاع داده می‌شود',
					type: 'string',
					default: '',
					displayOptions: {
						show: {
							fieldType: ['hiddenField'],
							'@version': [{ _cnd: { lt: 2.4 } }],
						},
					},
				},
				{
					displayName: 'نوع عنصر',
					name: 'fieldType',
					type: 'options',
					default: 'text',
					description: 'نوع فیلدی که به فرم اضافه می‌شود',
					// Update ALLOWED_FIELD_TYPES in packages/workflow/src/type-validation.ts when adding new field types
					options: [
						{
							name: 'چک‌باکس‌ها',
							value: 'checkbox',
						},
						{
							name: 'HTML سفارشی',
							value: 'html',
						},
						{
							name: 'تاریخ',
							value: 'date',
						},
						{
							name: 'فهرست کشویی',
							value: 'dropdown',
						},
						{
							name: 'ایمیل',
							value: 'email',
						},
						{
							name: 'فایل',
							value: 'file',
						},
						{
							name: 'فیلد مخفی',
							value: 'hiddenField',
						},
						{
							name: 'عدد',
							value: 'number',
						},
						{
							name: 'رمز عبور',
							value: 'password',
						},
						{
							name: 'دکمه‌های رادیویی',
							value: 'radio',
						},
						{
							name: 'متن',
							value: 'text',
						},
						{
							name: 'متن چندخطی',
							value: 'textarea',
						},
					],
					required: true,
				},
				{
					displayName: 'نام عنصر',
					name: 'elementName',
					type: 'string',
					default: '',
					placeholder: 'مثلاً content-section',
					description: 'فیلد اختیاری. می‌تواند برای وارد کردن HTML در خروجی استفاده شود.',
					displayOptions: {
						show: {
							fieldType: ['html'],
						},
					},
				},
				{
					displayName: 'متن جایگزین',
					name: 'placeholder',
					description: 'متنی نمونه برای نمایش درون فیلد',
					type: 'string',
					default: '',
					displayOptions: {
						hide: {
							fieldType: ['dropdown', 'date', 'file', 'html', 'hiddenField', 'radio', 'checkbox'],
						},
					},
				},
				{
					displayName: 'مقدار پیش‌فرض',
					name: 'defaultValue',
					description: 'مقدار پیش‌فرضی که در فیلد فرم پر می‌شود',
					type: 'string',
					default: '',
					displayOptions: {
						show: {
							fieldType: ['text', 'number', 'email', 'textarea'],
						},
					},
				},
				{
					displayName: 'مقدار پیش‌فرض',
					name: 'defaultValue',
					description: 'مقدار پیش‌فرض تاریخ که در فیلد فرم پر می‌شود (فرمت: YYYY-MM-DD)',
					type: 'dateTime',
					typeOptions: {
						dateOnly: true,
					},
					default: '',
					displayOptions: {
						show: {
							fieldType: ['date'],
						},
					},
				},
				{
					displayName: 'مقدار پیش‌فرض',
					name: 'defaultValue',
					description:
						'مقدار پیش‌فرضی که انتخاب خواهد شد. باید با یکی از برچسب‌های گزینه مطابقت داشته باشد.',
					type: 'string',
					default: '',
					displayOptions: {
						show: {
							fieldType: ['dropdown', 'radio'],
						},
					},
				},
				{
					displayName: 'مقدار پیش‌فرض',
					name: 'defaultValue',
					description:
						'مقدار پیش‌فرضی که انتخاب خواهد شد. باید با یکی از برچسب‌های گزینه مطابقت داشته باشد. گزینه‌های پیش‌انتخاب شده متعدد را با کاما جدا کنید.',
					type: 'string',
					default: '',
					displayOptions: {
						show: {
							fieldType: ['checkbox'],
						},
					},
				},
				{
					displayName: 'مقدار فیلد',
					name: 'fieldValue',
					description:
						'مقدار ورودی می‌تواند در اینجا تنظیم شود یا اگر مقداری تنظیم نشود، به عنوان پارامتر پرس‌وجو از طریق نام فیلد ارسال خواهد شد',
					type: 'string',
					default: '',
					displayOptions: {
						show: {
							fieldType: ['hiddenField'],
						},
					},
				},

				{
					displayName: 'گزینه‌های فیلد',
					name: 'fieldOptions',
					placeholder: 'افزودن گزینه',
					description: 'لیستی از گزینه‌ها که می‌توان از فهرست کشویی انتخاب کرد',
					type: 'fixedCollection',
					default: { values: [{ option: '' }] },
					required: true,
					displayOptions: {
						show: {
							fieldType: ['dropdown'],
						},
					},
					typeOptions: {
						multipleValues: true,
						sortable: true,
					},
					options: [
						{
							displayName: 'مقادیر',
							name: 'values',
							values: [
								{
									displayName: 'گزینه',
									name: 'option',
									type: 'string',
									default: '',
								},
							],
						},
					],
				},
				{
					displayName: 'چک‌باکس‌ها',
					name: 'fieldOptions',
					placeholder: 'افزودن چک‌باکس',
					type: 'fixedCollection',
					default: { values: [{ option: '' }] },
					required: true,
					displayOptions: {
						show: {
							fieldType: ['checkbox'],
						},
					},
					typeOptions: {
						multipleValues: true,
						sortable: true,
					},
					options: [
						{
							displayName: 'مقادیر',
							name: 'values',
							values: [
								{
									displayName: 'برچسب چک‌باکس',
									name: 'option',
									type: 'string',
									default: '',
								},
							],
						},
					],
				},
				{
					displayName: 'دکمه‌های رادیویی',
					name: 'fieldOptions',
					placeholder: 'افزودن دکمه رادیویی',
					type: 'fixedCollection',
					default: { values: [{ option: '' }] },
					required: true,
					displayOptions: {
						show: {
							fieldType: ['radio'],
						},
					},
					typeOptions: {
						multipleValues: true,
						sortable: true,
					},
					options: [
						{
							displayName: 'مقادیر',
							name: 'values',
							values: [
								{
									displayName: 'برچسب دکمه رادیویی',
									name: 'option',
									type: 'string',
									default: '',
								},
							],
						},
					],
				},
				{
					displayName:
						'گزینه چندگانه یک گزینه قدیمی است، لطفاً به جای آن از نوع فیلد چک‌باکس‌ها یا دکمه‌های رادیویی استفاده کنید',
					name: 'multiselectLegacyNotice',
					type: 'notice',
					default: '',
					displayOptions: {
						show: {
							multiselect: [true],
							fieldType: ['dropdown'],
							'@version': [{ _cnd: { lt: 2.3 } }],
						},
					},
				},
				{
					displayName: 'انتخاب چندگانه',
					name: 'multiselect',
					type: 'boolean',
					default: false,
					description: 'آیا به کاربر اجازه داده شود چندین گزینه را از فهرست کشویی انتخاب کند',
					displayOptions: {
						show: {
							fieldType: ['dropdown'],
							'@version': [{ _cnd: { lt: 2.3 } }],
						},
					},
				},
				{
					displayName: 'محدودیت انتخاب',
					name: 'limitSelection',
					type: 'options',
					default: 'unlimited',
					options: [
						{
							name: 'تعداد دقیق',
							value: 'exact',
						},
						{
							name: 'محدوده',
							value: 'range',
						},
						{
							name: 'نامحدود',
							value: 'unlimited',
						},
					],
					displayOptions: {
						show: {
							fieldType: ['checkbox'],
						},
					},
				},
				{
					displayName: 'تعداد انتخاب‌ها',
					name: 'numberOfSelections',
					type: 'number',
					default: 1,
					typeOptions: {
						numberPrecision: 0,
						minValue: 1,
					},
					displayOptions: {
						show: {
							fieldType: ['checkbox'],
							limitSelection: ['exact'],
						},
					},
				},
				{
					displayName: 'حداقل انتخاب‌ها',
					name: 'minSelections',
					type: 'number',
					default: 0,
					typeOptions: {
						numberPrecision: 0,
						minValue: 0,
					},
					displayOptions: {
						show: {
							fieldType: ['checkbox'],
							limitSelection: ['range'],
						},
					},
				},
				{
					displayName: 'حداکثر انتخاب‌ها',
					name: 'maxSelections',
					type: 'number',
					default: 1,
					typeOptions: {
						numberPrecision: 0,
						minValue: 1,
					},
					displayOptions: {
						show: {
							fieldType: ['checkbox'],
							limitSelection: ['range'],
						},
					},
				},
				{
					displayName: 'HTML',
					name: 'html',
					typeOptions: {
						editor: 'htmlEditor',
					},
					type: 'string',
					noDataExpression: true,
					default: placeholder,
					description: 'عناصر HTML برای نمایش در صفحه فرم',
					hint: 'قابل قبول نیست <code>&lt;script&gt;</code>, <code>&lt;style&gt;</code> یا <code>&lt;input&gt;</code> تگ‌ها',
					displayOptions: {
						show: {
							fieldType: ['html'],
						},
					},
				},
				{
					displayName: 'چندین فایل',
					name: 'multipleFiles',
					type: 'boolean',
					default: true,
					description:
						'آیا به کاربر اجازه داده شود چندین فایل را از ورودی فایل انتخاب کند یا فقط یکی',
					displayOptions: {
						show: {
							fieldType: ['file'],
						},
					},
				},
				{
					displayName: 'انواع فایل‌های پذیرفته شده',
					name: 'acceptFileTypes',
					type: 'string',
					default: '',
					description: 'فهرست جدا شده با کاما از پسوندهای فایل مجاز',
					hint: 'خالی بگذارید تا همه نوع فایل مجاز باشد',
					placeholder: 'مثلاً .jpg, .png',
					displayOptions: {
						show: {
							fieldType: ['file'],
						},
					},
				},
				{
					displayName: 'تاریخ نمایش داده شده بر اساس زبان مرورگر کاربر قالب‌بندی شده است',
					name: 'formatDate',
					type: 'notice',
					default: '',
					displayOptions: {
						show: {
							fieldType: ['date'],
						},
					},
				},
				{
					displayName: 'فیلد اجباری',
					name: 'requiredField',
					type: 'boolean',
					default: false,
					description: 'آیا از کاربر خواسته شود قبل از ارسال فرم، مقداری برای این فیلد وارد کند',
					displayOptions: {
						hide: {
							fieldType: ['html', 'hiddenField'],
						},
					},
				},
			],
		},
	],
};

export const formRespondMode: INodeProperties = {
	displayName: 'زمان پاسخ',
	name: 'responseMode',
	type: 'options',
	options: [
		{
			name: 'فرم ارسال شد',
			value: 'onReceived',
			description: 'به محض دریافت فرم پاسخ دهید',
		},
		{
			name: 'جریان کاری کامل شد',
			value: 'lastNode',
			description: 'وقتی آخرین گره جریان کاری اجرا می‌شود',
		},
		{
			name: "استفاده از گره 'Respond to Webhook'",
			value: 'responseNode',
			description: "وقتی گره 'Respond to Webhook' اجرا می‌شود",
		},
	],
	default: 'onReceived',
	description: 'زمان پاسخ به ارسال فرم',
};

export const formTriggerPanel = {
	header: 'کشیدن یک ارسال فرم آزمایشی',
	executionsHelp: {
		inactive:
			"Form Trigger has two modes: test and production. <br /> <br /> <b>Use test mode while you build your workflow</b>. Click the 'Execute step' button, then fill out the test form that opens in a popup tab. The executions will show up in the editor.<br /> <br /> <b>Use production mode to run your workflow automatically</b>. Publish the workflow, then make requests to the production URL. Then every time there's a form submission via the Production Form URL, the workflow will execute. These executions will show up in the executions list, but not in the editor.",
		active:
			"Form Trigger has two modes: test and production. <br /> <br /> <b>Use test mode while you build your workflow</b>. Click the 'Execute step' button, then fill out the test form that opens in a popup tab. The executions will show up in the editor.<br /> <br /> <b>Use production mode to run your workflow automatically</b>. Publish the workflow, then make requests to the production URL. Then every time there's a form submission via the Production Form URL, the workflow will execute. These executions will show up in the executions list, but not in the editor.",
	},
	activationHint: {
		active:
			"This node will also trigger automatically on new form submissions (but those executions won't show up here).",
		inactive:
			'Publish this workflow to have it also run automatically for new form submissions created via the Production URL.',
	},
};

export const respondWithOptions: INodeProperties = {
	displayName: 'Form Response',
	name: 'respondWithOptions',
	type: 'fixedCollection',
	placeholder: 'Add option',
	default: { values: { respondWith: 'text' } },
	options: [
		{
			displayName: 'Values',
			name: 'values',
			values: [
				{
					displayName: 'Respond With',
					name: 'respondWith',
					type: 'options',
					default: 'text',
					options: [
						{
							name: 'Form Submitted Text',
							value: 'text',
							description: 'Show a response text to the user',
						},
						{
							name: 'Redirect URL',
							value: 'redirect',
							description: 'Redirect the user to a URL',
						},
					],
				},
				{
					displayName: 'Text to Show',
					name: 'formSubmittedText',
					description:
						"The text displayed to users after they fill the form. Leave it empty if don't want to show any additional text.",
					type: 'string',
					default: 'Your response has been recorded',
					displayOptions: {
						show: {
							respondWith: ['text'],
						},
					},
				},
				{
					// eslint-disable-next-line n8n-nodes-base/node-param-display-name-miscased
					displayName: 'URL to Redirect to',
					name: 'redirectUrl',
					description:
						'The URL to redirect users to after they fill the form. Must be a valid URL.',
					type: 'string',
					default: '',
					validateType: 'url',
					placeholder: 'e.g. http://www.n8n.io',
					displayOptions: {
						show: {
							respondWith: ['redirect'],
						},
					},
				},
			],
		},
	],
};

export const appendAttributionToForm: INodeProperties = {
	...appendAttributionOption,
	description: 'Whether to include the link “Form automated with n8n” at the bottom of the form',
};
