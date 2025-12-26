import type { INodeProperties } from 'n8n-workflow';

import { includeInputFields } from './common.descriptions';

export const RoundDateDescription: INodeProperties[] = [
	{
		displayName:
			"همچنین می‌توانید این کار را با استفاده از یک عبارت انجام دهید، مثلاً <code>{{ your_date.beginningOf('month') }}</code> یا <code>{{ your_date.endOfMonth() }}</code>. <a target='_blank' href='https://docs.n8n.io/code/cookbook/luxon/'>اطلاعات بیشتر</a>",
		name: 'notice',
		type: 'notice',
		default: '',
		displayOptions: {
			show: {
				operation: ['roundDate'],
			},
		},
	},
	{
		displayName: 'تاریخ',
		name: 'date',
		type: 'string',
		description: 'تاریخی که می‌خواهید گرد کنید',
		default: '',
		displayOptions: {
			show: {
				operation: ['roundDate'],
			},
		},
	},
	{
		displayName: 'حالت',
		name: 'mode',
		type: 'options',
		options: [
			{
				name: 'گرد کردن به پایین',
				value: 'roundDown',
			},
			{
				name: 'گرد کردن به بالا',
				value: 'roundUp',
			},
		],
		default: 'roundDown',
		displayOptions: {
			show: {
				operation: ['roundDate'],
			},
		},
	},
	{
		displayName: 'به نزدیکترین',
		name: 'toNearest',
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
				operation: ['roundDate'],
				mode: ['roundDown'],
			},
		},
	},
	{
		displayName: 'به',
		name: 'to',
		type: 'options',
		options: [
			{
				name: 'پایان ماه',
				value: 'month',
			},
		],
		default: 'month',
		displayOptions: {
			show: {
				operation: ['roundDate'],
				mode: ['roundUp'],
			},
		},
	},
	{
		displayName: 'نام فیلد خروجی',
		name: 'outputFieldName',
		type: 'string',
		default: 'roundedDate',
		description: 'نام فیلدی که خروجی در آن قرار می‌گیرد',
		displayOptions: {
			show: {
				operation: ['roundDate'],
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
				operation: ['roundDate'],
			},
		},
		default: {},
		options: [includeInputFields],
	},
];
