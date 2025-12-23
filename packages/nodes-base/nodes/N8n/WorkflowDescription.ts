import type { INodeProperties } from 'n8n-workflow';

import {
	getCursorPaginator,
	parseAndSetBodyJson,
	prepareWorkflowCreateBody,
	prepareWorkflowUpdateBody,
} from './GenericFunctions';
import { workflowIdLocator } from './WorkflowLocator';

export const workflowOperations: INodeProperties[] = [
	{
		displayName: 'عملیات',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		default: 'getAll',
		displayOptions: {
			show: {
				resource: ['workflow'],
			},
		},
		options: [
			{
				name: 'انتشار',
				value: 'activate',
				action: 'انتشار یک جریان کاری',
			},
			{
				name: 'ایجاد',
				value: 'create',
				action: 'ایجاد یک جریان کاری',
				routing: {
					request: {
						method: 'POST',
						url: '/workflows',
					},
				},
			},
			{
				name: 'لغو انتشار',
				value: 'deactivate',
				action: 'لغو انتشار یک جریان کاری',
			},
			{
				name: 'حذف',
				value: 'delete',
				action: 'حذف یک جریان کاری',
			},
			{
				name: 'دریافت',
				value: 'get',
				action: 'دریافت یک جریان کاری',
			},
			{
				name: 'دریافت بسیاری',
				value: 'getAll',
				action: 'دریافت بسیاری جریان‌های کاری',
				routing: {
					request: {
						method: 'GET',
						url: '/workflows',
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
				name: 'دریافت نسخه',
				value: 'getVersion',
				action: 'دریافت یک نسخه از جریان کاری',
			},
			{
				name: 'به‌روزرسانی',
				value: 'update',
				action: 'به‌روزرسانی یک جریان کاری',
			},
		],
	},
];

const activateOperation: INodeProperties[] = [
	{
		...workflowIdLocator,
		required: true,
		displayOptions: {
			show: {
				resource: ['workflow'],
				operation: ['activate'],
			},
		},
		// The routing for resourceLocator-enabled properties currently needs to
		// happen in the property block where the property itself is defined, or
		// extractValue won't work when used with $parameter in routing.request.url.
		routing: {
			request: {
				method: 'POST',
				url: '=/workflows/{{ $value }}/activate',
			},
		},
	},
	{
		displayName: 'فیلدهای اضافی',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'افزودن فیلد',
		default: {},
		displayOptions: {
			show: {
				resource: ['workflow'],
				operation: ['activate'],
			},
		},
		options: [
			{
				displayName: 'شناسه نسخه',
				name: 'versionId',
				type: 'string',
				default: '',
				routing: {
					send: {
						type: 'body',
						property: 'versionId',
					},
				},
				description: 'شناسه نسخه جریان کاری برای انتشار',
			},
			{
				displayName: 'نام',
				name: 'name',
				type: 'string',
				default: '',
				routing: {
					send: {
						type: 'body',
						property: 'name',
					},
				},
				description: 'نام نسخه منتشر شده (بازنویسی خواهد شد)',
			},
			{
				displayName: 'توضیحات',
				name: 'description',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				routing: {
					send: {
						type: 'body',
						property: 'description',
					},
				},
				description: 'توضیحات نسخه منتشر شده (بازنویسی خواهد شد)',
			},
		],
	},
];

const createOperation: INodeProperties[] = [
	{
		displayName: 'شیء جریان کاری',
		name: 'workflowObject',
		type: 'json',
		default: '{ "name": "My workflow", "nodes": [], "connections": {}, "settings": {} }',
		placeholder:
			'{\n  "name": "My workflow",\n  "nodes": [],\n  "connections": {},\n  "settings": {}\n}',
		required: true,
		typeOptions: {
			alwaysOpenEditWindow: true,
		},
		displayOptions: {
			show: {
				resource: ['workflow'],
				operation: ['create'],
			},
		},
		routing: {
			send: {
				preSend: [parseAndSetBodyJson('workflowObject'), prepareWorkflowCreateBody],
			},
		},
		description:
			"یک شیء JSON معتبر با فیلدهای مورد نیاز: 'name'، 'nodes'، 'connections' و 'settings'. اطلاعات بیشتر را می‌توان در <a href=\"https://docs.n8n.io/api/api-reference/#tag/workflow/paths/~1workflows/post\">مستندات</a> یافت.",
	},
];

const deactivateOperation: INodeProperties[] = [
	{
		...workflowIdLocator,
		required: true,
		displayOptions: {
			show: {
				resource: ['workflow'],
				operation: ['deactivate'],
			},
		},
		routing: {
			request: {
				method: 'POST',
				url: '=/workflows/{{ $value }}/deactivate',
			},
		},
	},
];

const deleteOperation: INodeProperties[] = [
	{
		...workflowIdLocator,
		required: true,
		displayOptions: {
			show: {
				resource: ['workflow'],
				operation: ['delete'],
			},
		},
		routing: {
			request: {
				method: 'DELETE',
				url: '=/workflows/{{ $value }}',
			},
		},
	},
];

const getAllOperation: INodeProperties[] = [
	{
		displayName: 'بازگرداندن همه',
		name: 'returnAll',
		type: 'boolean',
		default: true,
		displayOptions: {
			show: {
				resource: ['workflow'],
				operation: ['getAll'],
			},
		},
		description: 'آیا همه نتایج بازگردانده شود یا فقط تا حد مشخصی',
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
				resource: ['workflow'],
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
		default: {},
		displayOptions: {
			show: {
				resource: ['workflow'],
				operation: ['getAll'],
			},
		},
		options: [
			{
				displayName: 'فقط جریان‌های کاری منتشر شده را بازگردان',
				name: 'activeWorkflows',
				type: 'boolean',
				default: true,
				routing: {
					request: {
						qs: {
							active: '={{ $value }}',
						},
					},
				},
			},
			{
				displayName: 'برچسب‌ها',
				name: 'tags',
				type: 'string',
				default: '',
				routing: {
					// Only include the 'tags' query parameter if it's non-empty
					send: {
						type: 'query',
						property: 'tags',
						value: '={{ $value !== "" ? $value : undefined }}',
					},
				},
				description: 'فقط جریان‌های کاری با این برچسب‌ها را شامل شود',
				hint: 'فهرست برچسب‌ها جدا شده با کاما (مقدار خالی نادیده گرفته می‌شود)',
			},
			{
				displayName: 'نام',
				name: 'name',
				type: 'string',
				default: '',
				routing: {
					request: {
						qs: {
							name: '={{ $value }}',
						},
					},
				},
			},
			{
				displayName: 'شناسه پروژه',
				name: 'projectId',
				type: 'string',
				default: '',
				routing: {
					request: {
						qs: {
							projectId: '={{ $value }}',
						},
					},
				},
			},
			{
				displayName: 'حذف داده‌های پین شده',
				name: 'excludePinnedData',
				description: 'آیا داده‌های پین شده از پاسخ حذف شوند',
				type: 'boolean',
				default: false,
				routing: {
					request: {
						qs: {
							excludePinnedData: '={{ $value }}',
						},
					},
				},
			},
		],
	},
];

const getOperation: INodeProperties[] = [
	{
		...workflowIdLocator,
		required: true,
		displayOptions: {
			show: {
				resource: ['workflow'],
				operation: ['get'],
			},
		},
		routing: {
			request: {
				method: 'GET',
				url: '=/workflows/{{ $value }}',
			},
		},
	},
];

const getVersionOperation: INodeProperties[] = [
	{
		...workflowIdLocator,
		required: true,
		displayOptions: {
			show: {
				resource: ['workflow'],
				operation: ['getVersion'],
			},
		},
		routing: {
			request: {
				method: 'GET',
				url: '=/workflows/{{ $value }}/{{ $parameter["versionId"] }}',
			},
		},
	},
	{
		displayName: 'شناسه نسخه',
		name: 'versionId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['workflow'],
				operation: ['getVersion'],
			},
		},
		description: 'شناسه نسخه برای بازیابی',
	},
];

const updateOperation: INodeProperties[] = [
	{
		...workflowIdLocator,
		required: true,
		displayOptions: {
			show: {
				resource: ['workflow'],
				operation: ['update'],
			},
		},
		routing: {
			request: {
				method: 'PUT',
				url: '=/workflows/{{ $value }}',
			},
		},
	},
	{
		displayName: 'شیء جریان کاری',
		name: 'workflowObject',
		type: 'json',
		default: '',
		placeholder:
			'{\n  "name": "My workflow",\n  "nodes": [],\n  "connections": {},\n  "settings": {}\n}',
		required: true,
		typeOptions: {
			alwaysOpenEditWindow: true,
		},
		displayOptions: {
			show: {
				resource: ['workflow'],
				operation: ['update'],
			},
		},
		routing: {
			send: {
				preSend: [parseAndSetBodyJson('workflowObject'), prepareWorkflowUpdateBody],
			},
		},
		description:
			"یک شیء JSON معتبر با فیلدهای مورد نیاز: 'name'، 'nodes'، 'connections' و 'settings'. اطلاعات بیشتر را می‌توانید در <a href=\"https://docs.n8n.io/api/api-reference/#tag/workflow/paths/~1workflows~1%7bid%7d/put\">مستندات</a> بیابید.",
	},
];

export const workflowFields: INodeProperties[] = [
	...activateOperation,
	...createOperation,
	...deactivateOperation,
	...deleteOperation,
	...getAllOperation,
	...getOperation,
	...getVersionOperation,
	...updateOperation,
];
