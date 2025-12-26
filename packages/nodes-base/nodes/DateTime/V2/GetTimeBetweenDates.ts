import type { INodeProperties } from 'n8n-workflow';

import { includeInputFields } from './common.descriptions';

export const GetTimeBetweenDatesDescription: INodeProperties[] = [
	{
		displayName: 'تاریخ شروع',
		name: 'startDate',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				operation: ['getTimeBetweenDates'],
			},
		},
	},
	{
		displayName: 'تاریخ پایان',
		name: 'endDate',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				operation: ['getTimeBetweenDates'],
			},
		},
	},
	{
		displayName: 'واحدها',
		name: 'units',
		type: 'multiOptions',
		// eslint-disable-next-line n8n-nodes-base/node-param-multi-options-type-unsorted-items
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
			{
				name: 'میلی‌ثانیه',
				value: 'millisecond',
			},
		],
		displayOptions: {
			show: {
				operation: ['getTimeBetweenDates'],
			},
		},
		default: ['day'],
	},
	{
		displayName: 'نام فیلد خروجی',
		name: 'outputFieldName',
		type: 'string',
		default: 'timeDifference',
		description: 'نام فیلدی که خروجی در آن قرار می‌گیرد',
		displayOptions: {
			show: {
				operation: ['getTimeBetweenDates'],
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
				operation: ['getTimeBetweenDates'],
			},
		},
		default: {},
		options: [
			includeInputFields,
			{
				displayName: 'خروجی به صورت رشته ISO',
				name: 'isoString',
				type: 'boolean',
				default: false,
				description: 'آیا تاریخ به صورت رشته ISO خروجی داده شود یا خیر',
			},
		],
	},
];
