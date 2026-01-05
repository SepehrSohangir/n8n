import type { INodeProperties } from 'n8n-workflow';

import { includeInputFields } from './common.descriptions';

export const FormatDateDescription: INodeProperties[] = [
	{
		displayName:
			"همچنین می‌توانید این کار را با استفاده از یک عبارت انجام دهید، مثلاً <code>{{your_date.format('yyyy-MM-dd')}}</code>. <a target='_blank' href='https://docs.n8n.io/code/cookbook/luxon/'>اطلاعات بیشتر</a>",
		name: 'notice',
		type: 'notice',
		default: '',
		displayOptions: {
			show: {
				operation: ['formatDate'],
			},
		},
	},
	{
		displayName: 'تاریخ',
		name: 'date',
		type: 'string',
		description: 'تاریخی که می‌خواهید فرمت کنید',
		default: '',
		displayOptions: {
			show: {
				operation: ['formatDate'],
			},
		},
	},
	{
		displayName: 'فرمت',
		name: 'format',
		type: 'options',
		displayOptions: {
			show: {
				operation: ['formatDate'],
			},
		},
		// eslint-disable-next-line n8n-nodes-base/node-param-options-type-unsorted-items
		options: [
			{
				name: 'فرمت سفارشی',
				value: 'custom',
			},
			{
				name: 'MM/DD/YYYY',
				value: 'MM/dd/yyyy',
				description: 'مثال: 09/04/1986',
			},
			{
				name: 'YYYY/MM/DD',
				value: 'yyyy/MM/dd',
				description: 'مثال: 1986/04/09',
			},
			{
				name: 'MMMM DD YYYY',
				value: 'MMMM dd yyyy',
				description: 'مثال: April 09 1986',
			},
			{
				name: 'MM-DD-YYYY',
				value: 'MM-dd-yyyy',
				description: 'مثال: 09-04-1986',
			},
			{
				name: 'YYYY-MM-DD',
				value: 'yyyy-MM-dd',
				description: 'مثال: 1986-04-09',
			},
			{
				name: 'برچسب زمانی Unix',
				value: 'X',
				description: 'مثال: 1672531200',
			},
			{
				name: 'برچسب زمانی Unix (میلی‌ثانیه)',
				value: 'x',
				description: 'مثال: 1674691200000',
			},
		],
		default: 'MM/dd/yyyy',
		description: 'فرمتی که تاریخ به آن تبدیل می‌شود',
	},
	{
		displayName: 'فرمت سفارشی',
		name: 'customFormat',
		type: 'string',
		displayOptions: {
			show: {
				format: ['custom'],
				operation: ['formatDate'],
			},
		},
		hint: 'فهرست نشانه‌های ویژه <a target="_blank" href="https://moment.github.io/luxon/#/formatting?id=table-of-tokens">اطلاعات بیشتر</a>',
		default: '',
		placeholder: 'yyyy-MM-dd',
	},
	{
		displayName: 'نام فیلد خروجی',
		name: 'outputFieldName',
		type: 'string',
		default: 'formattedDate',
		description: 'نام فیلدی که خروجی در آن قرار می‌گیرد',
		displayOptions: {
			show: {
				operation: ['formatDate'],
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
				operation: ['formatDate'],
			},
		},
		default: {},
		options: [
			includeInputFields,
			{
				displayName: 'از فرمت تاریخ',
				name: 'fromFormat',
				type: 'string',
				default: 'e.g yyyyMMdd',
				hint: 'نشانه‌ها به حروف کوچک و بزرگ حساس هستند',
				// eslint-disable-next-line n8n-nodes-base/node-param-description-miscased-id
				description:
					'فرمتی که ورودی \'تاریخ\' در آن است، زمانی مفید است که فرمت به طور خودکار تشخیص داده نشود. از این <a href="https://moment.github.io/luxon/#/formatting?id=table-of-tokens&id=table-of-tokens" target="_blank">نشانه‌ها</a> برای تعریف فرمت استفاده کنید.',
			},
			{
				displayName: 'استفاده از منطقه زمانی گردش کار',
				name: 'timezone',
				type: 'boolean',
				default: false,
				description: 'آیا از منطقه زمانی ورودی استفاده شود یا منطقه زمانی گردش کار',
			},
		],
	},
];
