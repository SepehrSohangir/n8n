import type { INodeProperties } from 'n8n-workflow';

import { includeInputFields } from './common.descriptions';

export const CurrentDateDescription: INodeProperties[] = [
	{
		displayName:
			'همچنین می‌توانید با استفاده از <code>{{$now}}</code> یا <code>{{$today}}</code> به تاریخ فعلی در عبارت‌های n8n ارجاع دهید. <a target="_blank" href="https://docs.n8n.io/code/cookbook/luxon/">اطلاعات بیشتر</a>',
		name: 'notice',
		type: 'notice',
		default: '',
		displayOptions: {
			show: {
				operation: ['getCurrentDate'],
			},
		},
	},
	{
		displayName: 'شامل زمان فعلی',
		name: 'includeTime',
		type: 'boolean',
		default: true,
		// eslint-disable-next-line n8n-nodes-base/node-param-description-boolean-without-whether
		description: 'هنگام غیرفعال شدن، زمان به نیمه‌شب تنظیم می‌شود',
		displayOptions: {
			show: {
				operation: ['getCurrentDate'],
			},
		},
	},
	{
		displayName: 'نام فیلد خروجی',
		name: 'outputFieldName',
		type: 'string',
		default: 'currentDate',
		description: 'نام فیلدی که خروجی در آن قرار می‌گیرد',
		displayOptions: {
			show: {
				operation: ['getCurrentDate'],
			},
		},
	},
	{
		displayName: 'گزینه‌ها',
		name: 'options',
		type: 'collection',
		placeholder: 'افزودن گزینه',
		displayOptions: {
			show: {
				operation: ['getCurrentDate'],
			},
		},
		default: {},
		options: [
			includeInputFields,
			{
				displayName: 'منطقه زمانی',
				name: 'timezone',
				type: 'string',
				placeholder: 'America/New_York',
				default: '',
				description:
					"منطقه زمانی برای استفاده. اگر تنظیم نشود، منطقه زمانی نمونه n8n استفاده می‌شود. برای منطقه زمانی +00:00 از 'GMT' استفاده کنید.",
			},
		],
	},
];
