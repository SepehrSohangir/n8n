import type { INodeProperties } from 'n8n-workflow';

import * as append from './append';
import * as chooseBranch from './chooseBranch';
import * as combineAll from './combineAll';
import * as combineByFields from './combineByFields';
import * as combineByPosition from './combineByPosition';
import * as combineBySql from './combineBySql';

export { append, chooseBranch, combineAll, combineByFields, combineBySql, combineByPosition };

export const description: INodeProperties[] = [
	{
		displayName: 'حالت',
		name: 'mode',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: 'افزودن',
				value: 'append',
				description: 'خروجی آیتم‌های هر ورودی، یکی پس از دیگری',
			},
			{
				name: 'ترکیب',
				value: 'combine',
				description: 'ادغام آیتم‌های مطابق با هم',
			},
			{
				name: 'پرس‌وجوی SQL',
				value: 'combineBySql',
				description: 'نوشتن یک پرس‌وجو برای انجام ادغام',
			},
			{
				name: 'انتخاب شاخه',
				value: 'chooseBranch',
				description: 'خروجی داده از یک شاخه خاص، بدون تغییر آن',
			},
		],
		default: 'append',
		description: 'نحوه ادغام داده‌های ورودی',
	},
	{
		displayName: 'ترکیب بر اساس',
		name: 'combineBy',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: 'فیلدهای مطابق',
				value: 'combineByFields',
				description: 'ترکیب آیتم‌ها با مقادیر فیلد یکسان',
			},
			{
				name: 'موقعیت',
				value: 'combineByPosition',
				description: 'ترکیب آیتم‌ها بر اساس ترتیب آنها',
			},
			{
				name: 'همه ترکیب‌های ممکن',
				value: 'combineAll',
				description: 'هر جفت‌سازی از هر دو آیتم (اتصال متقاطع)',
			},
		],
		default: 'combineByFields',
		description: 'نحوه ادغام داده‌های ورودی',
		displayOptions: {
			show: { mode: ['combine'] },
		},
	},
	...append.description,
	...combineAll.description,
	...combineByFields.description,
	...combineBySql.description,
	...combineByPosition.description,
	...chooseBranch.description,
];
