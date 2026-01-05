import type { INodeProperties } from 'n8n-workflow';

import { includeInputFields } from './common.descriptions';

export const ExtractDateDescription: INodeProperties[] = [
	{
		displayName:
			'همچنین می‌توانید این کار را با استفاده از یک عبارت انجام دهید، مثلاً <code>{{ your_date.extract("month") }}}</code>. <a target="_blank" href="https://docs.n8n.io/code/cookbook/luxon/">اطلاعات بیشتر</a>',
		name: 'notice',
		type: 'notice',
		default: '',
		displayOptions: {
			show: {
				operation: ['extractDate'],
			},
		},
	},
	{
		displayName: 'تاریخ',
		name: 'date',
		type: 'string',
		description: 'تاریخی که می‌خواهید بخشی از آن را استخراج کنید',
		default: '',
		displayOptions: {
			show: {
				operation: ['extractDate'],
			},
		},
	},
	{
		displayName: 'بخش',
		name: 'part',
		type: 'options',
		// eslint-disable-next-line n8n-nodes-base/node-param-options-type-unsorted-items
		options: [
			{
				name: 'سال',
				value: 'year',
			},
			{
				name: 'ماه',
				value: 'month',
			},
			{
				name: 'هفته',
				value: 'week',
			},
			{
				name: 'روز',
				value: 'day',
			},
			{
				name: 'ساعت',
				value: 'hour',
			},
			{
				name: 'دقیقه',
				value: 'minute',
			},
			{
				name: 'ثانیه',
				value: 'second',
			},
		],
		default: 'month',
		displayOptions: {
			show: {
				operation: ['extractDate'],
			},
		},
	},
	{
		displayName: 'نام فیلد خروجی',
		name: 'outputFieldName',
		type: 'string',
		default: 'datePart',
		description: 'نام فیلدی که خروجی در آن قرار می‌گیرد',
		displayOptions: {
			show: {
				operation: ['extractDate'],
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
				operation: ['extractDate'],
			},
		},
		default: {},
		options: [includeInputFields],
	},
];
