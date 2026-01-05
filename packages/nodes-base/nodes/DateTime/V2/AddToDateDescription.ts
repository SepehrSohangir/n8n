import type { INodeProperties } from 'n8n-workflow';

import { includeInputFields } from './common.descriptions';

export const AddToDateDescription: INodeProperties[] = [
	{
		displayName:
			"همچنین می‌توانید این کار را با استفاده از یک عبارت انجام دهید، مثلاً <code>{{your_date.plus(5, 'minutes')}}</code>. <a target='_blank' href='https://docs.n8n.io/code/cookbook/luxon/'>اطلاعات بیشتر</a>",
		name: 'notice',
		type: 'notice',
		default: '',
		displayOptions: {
			show: {
				operation: ['addToDate'],
			},
		},
	},
	{
		displayName: 'تاریخ برای افزودن',
		name: 'magnitude',
		type: 'string',
		description: 'تاریخی که می‌خواهید تغییر دهید',
		default: '',
		displayOptions: {
			show: {
				operation: ['addToDate'],
			},
		},
		required: true,
	},
	{
		displayName: 'واحد زمان برای افزودن',
		name: 'timeUnit',
		description: 'واحد زمان برای پارامتر مدت زمان زیر',
		displayOptions: {
			show: {
				operation: ['addToDate'],
			},
		},
		type: 'options',
		// eslint-disable-next-line n8n-nodes-base/node-param-options-type-unsorted-items
		options: [
			{
				name: 'سال',
				value: 'years',
			},
			{
				name: 'سه‌ماهه',
				value: 'quarters',
			},
			{
				name: 'ماه',
				value: 'months',
			},
			{
				name: 'هفته',
				value: 'weeks',
			},
			{
				name: 'روز',
				value: 'days',
			},
			{
				name: 'ساعت',
				value: 'hours',
			},
			{
				name: 'دقیقه',
				value: 'minutes',
			},
			{
				name: 'ثانیه',
				value: 'seconds',
			},
			{
				name: 'میلی‌ثانیه',
				value: 'milliseconds',
			},
		],
		default: 'days',
		required: true,
	},
	{
		displayName: 'مدت زمان',
		name: 'duration',
		type: 'number',
		description: 'تعداد واحدهای زمانی برای افزودن به تاریخ',
		default: 0,
		displayOptions: {
			show: {
				operation: ['addToDate'],
			},
		},
	},
	{
		displayName: 'نام فیلد خروجی',
		name: 'outputFieldName',
		type: 'string',
		default: 'newDate',
		description: 'نام فیلدی که خروجی در آن قرار می‌گیرد',
		displayOptions: {
			show: {
				operation: ['addToDate'],
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
				operation: ['addToDate'],
			},
		},
		default: {},
		options: [includeInputFields],
	},
];
