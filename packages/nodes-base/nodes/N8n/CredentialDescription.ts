import type { INodeProperties } from 'n8n-workflow';

import { parseAndSetBodyJson } from './GenericFunctions';

export const credentialOperations: INodeProperties[] = [
	{
		displayName: 'عملیات',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		default: 'create',
		displayOptions: {
			show: {
				resource: ['credential'],
			},
		},
		options: [
			{
				name: 'ایجاد',
				value: 'create',
				action: 'ایجاد یک اعتبارسنجی',
				routing: {
					request: {
						method: 'POST',
						url: '/credentials',
					},
				},
			},
			{
				name: 'حذف',
				value: 'delete',
				action: 'حذف یک اعتبارسنجی',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/credentials/{{ $parameter.credentialId }}',
					},
				},
			},
			{
				name: 'دریافت طرح',
				value: 'getSchema',
				action: 'دریافت طرح داده اعتبارسنجی برای نوع',
				routing: {
					request: {
						method: 'GET',
						url: '=/credentials/schema/{{ $parameter.credentialTypeName }}',
					},
				},
			},
		],
	},
];

const createOperation: INodeProperties[] = [
	{
		displayName: 'نام',
		name: 'name',
		type: 'string',
		default: '',
		placeholder: 'e.g. n8n account',
		required: true,
		displayOptions: {
			show: {
				resource: ['credential'],
				operation: ['create'],
			},
		},
		routing: {
			request: {
				body: {
					name: '={{ $value }}',
				},
			},
		},
		description: 'نام اعتبارسنجی جدید',
	},
	{
		displayName: 'نوع اعتبارسنجی',
		name: 'credentialTypeName',
		type: 'string',
		placeholder: 'e.g. n8nApi',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['credential'],
				operation: ['create'],
			},
		},
		routing: {
			request: {
				body: {
					type: '={{ $value }}',
				},
			},
		},
		description:
			"نوع‌های موجود به گره‌های نصب شده در نمونه n8n بستگی دارد. برخی از نوع‌های داخلی شامل e.g. 'githubApi', 'notionApi', و 'slackApi' هستند.",
	},
	{
		displayName: 'داده',
		name: 'data',
		type: 'json',
		default: '',
		placeholder:
			'// e.g. for n8nApi \n{\n  "apiKey": "my-n8n-api-key",\n  "baseUrl": "https://<name>.app.n8n.cloud/api/v1",\n}',
		required: true,
		typeOptions: {
			alwaysOpenEditWindow: true,
		},
		displayOptions: {
			show: {
				resource: ['credential'],
				operation: ['create'],
			},
		},
		routing: {
			send: {
				// Validate that the 'data' property is parseable as JSON and
				// set it into the request as body.data.
				preSend: [parseAndSetBodyJson('data', 'data')],
			},
		},
		description:
			"یک شیء JSON معتبر با ویژگی‌های مورد نیاز برای این نوع اعتبارسنجی. برای مشاهده فرمت مورد انتظار، می‌توانید از عملیات 'دریافت طرح' استفاده کنید.",
	},
];

const deleteOperation: INodeProperties[] = [
	{
		displayName: 'شناسه اعتبارسنجی',
		name: 'credentialId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['credential'],
				operation: ['delete'],
			},
		},
	},
];

const getSchemaOperation: INodeProperties[] = [
	{
		displayName: 'نوع اعتبارسنجی',
		name: 'credentialTypeName',
		default: '',
		placeholder: 'e.g. n8nApi',
		required: true,
		type: 'string',
		displayOptions: {
			show: {
				resource: ['credential'],
				operation: ['getSchema'],
			},
		},
		description:
			"نوع‌های موجود به گره‌های نصب شده در نمونه n8n بستگی دارد. برخی از نوع‌های داخلی شامل e.g. 'githubApi', 'notionApi', و 'slackApi' هستند.",
	},
];

export const credentialFields: INodeProperties[] = [
	...createOperation,
	...deleteOperation,
	...getSchemaOperation,
];
