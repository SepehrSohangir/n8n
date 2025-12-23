import type { INodeProperties } from 'n8n-workflow';

import { getCursorPaginator } from './GenericFunctions';
import { workflowIdLocator } from './WorkflowLocator';

export const executionOperations: INodeProperties[] = [
	{
		displayName: 'عملیات',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		default: 'getAll',
		displayOptions: {
			show: {
				resource: ['execution'],
			},
		},
		options: [
			{
				name: 'دریافت',
				value: 'get',
				action: 'دریافت یک اجرا',
				routing: {
					request: {
						method: 'GET',
						url: '=/executions/{{ $parameter.executionId }}',
					},
				},
			},
			{
				name: 'دریافت چندگانه',
				value: 'getAll',
				action: 'دریافت بسیاری اجراها',
				routing: {
					request: {
						method: 'GET',
						url: '/executions',
					},
					send: {
						paginate: true,
					},
					operations: {
						pagination: getCursorPaginator(),
					},
				},
			},
			{
				name: 'حذف',
				value: 'delete',
				action: 'حذف یک اجرا',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/executions/{{ $parameter.executionId }}',
					},
				},
			},
		],
	},
];

const deleteOperation: INodeProperties[] = [
	{
		displayName: 'شناسه اجرا',
		name: 'executionId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['execution'],
				operation: ['delete'],
			},
		},
		default: '',
	},
];

const getAllOperation: INodeProperties[] = [
	{
		displayName: 'بازگرداندن همه',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['execution'],
				operation: ['getAll'],
			},
		},
		description: 'همه نتایج را برگردانید بدون توجه به محدودیت',
	},
	{
		displayName: 'محدودیت',
		name: 'limit',
		type: 'number',
		default: 100,
		typeOptions: {
			minValue: 1,
			maxValue: 250,
		},
		displayOptions: {
			show: {
				resource: ['execution'],
				operation: ['getAll'],
				returnAll: [false],
			},
		},
		routing: {
			request: {
				qs: {
					limit: '={{ $value }}',
				},
			},
		},
		description: 'حداکثر تعداد نتایج برای بازگرداندن',
	},
	{
		displayName: 'فیلترها',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: {
			show: {
				resource: ['execution'],
				operation: ['getAll'],
			},
		},
		options: [
			{
				// Use the common workflowIdLocator, but provide a custom routing
				...workflowIdLocator,
				routing: {
					send: {
						type: 'query',
						property: 'workflowId',
						value: '={{ $value || undefined }}',
					},
				},
				description: 'شناسه جریان کاری برای فیلتر کردن اجراها براساس آن',
			},
			{
				displayName: 'وضعیت',
				name: 'status',
				type: 'options',
				options: [
					{
						name: 'خطا',
						value: 'error',
					},
					{
						name: 'موفقیت آمیز',
						value: 'success',
					},
					{
						name: 'در انتظار',
						value: 'waiting',
					},
				],
				default: 'success',
				routing: {
					send: {
						type: 'query',
						property: 'status',
						value: '={{ $value }}',
					},
				},
				description: 'وضعیت برای فیلتر کردن اجراها براساس آن',
			},
		],
	},
	{
		displayName: 'گزینه‌ها',
		name: 'options',
		type: 'collection',
		default: {},
		placeholder: 'افزودن گزینه',
		displayOptions: {
			show: {
				resource: ['execution'],
				operation: ['getAll'],
			},
		},
		options: [
			{
				displayName: 'شامل جزئیات اجرا',
				name: 'activeWorkflows',
				type: 'boolean',
				default: false,
				routing: {
					send: {
						type: 'query',
						property: 'includeData',
						value: '={{ $value }}',
					},
				},
				description: 'آیا جزئیات دقیق اجرا را شامل شود',
			},
		],
	},
];

const getOperation: INodeProperties[] = [
	{
		displayName: 'شناسه اجرا',
		name: 'executionId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['execution'],
				operation: ['get'],
			},
		},
	},
	{
		displayName: 'گزینه‌ها',
		name: 'options',
		type: 'collection',
		default: {},
		placeholder: 'افزودن گزینه',
		displayOptions: {
			show: {
				resource: ['execution'],
				operation: ['get'],
			},
		},
		options: [
			{
				displayName: 'شامل جزئیات اجرا',
				name: 'activeWorkflows',
				type: 'boolean',
				default: false,
				routing: {
					send: {
						type: 'query',
						property: 'includeData',
						value: '={{ $value }}',
					},
				},
				description: 'آیا جزئیات دقیق اجرا را شامل شود',
			},
		],
	},
];

export const executionFields: INodeProperties[] = [
	...deleteOperation,
	...getAllOperation,
	...getOperation,
];
