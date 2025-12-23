import type { INodeProperties } from 'n8n-workflow';

import * as deleteRows from './delete.operation';
import * as rowExists from './rowExists.operation';
import * as rowNotExists from './rowNotExists.operation';
import * as get from './get.operation';
import * as insert from './insert.operation';
import * as update from './update.operation';
import * as upsert from './upsert.operation';
import { DATA_TABLE_ID_FIELD } from '../../common/fields';

export { insert, get, rowExists, rowNotExists, deleteRows, update, upsert };

export const description: INodeProperties[] = [
	{
		displayName: 'عملیات',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['row'],
			},
		},
		options: [
			{
				name: 'حذف',
				value: deleteRows.FIELD,
				description: 'حذف ردیف(ها)',
				action: 'Delete row(s)',
			},
			{
				name: 'گرفتن',
				value: get.FIELD,
				description: 'گرفتن ردیف(ها)',
				action: 'Get row(s)',
			},
			{
				name: 'اگر ردیف وجود دارد',
				value: rowExists.FIELD,
				description: 'مطابقت ورودی‌هایی که در جدول داده‌ها وجود دارند',
				action: 'If row exists',
			},
			{
				name: 'اگر ردیف وجود ندارد',
				value: rowNotExists.FIELD,
				description: 'مطابقت ورودی‌هایی که در جدول داده‌ها وجود ندارند',
				action: 'If row does not exist',
			},
			{
				name: 'درج',
				value: insert.FIELD,
				description: 'درج یک ردیف جدید',
				action: 'Insert row',
			},
			{
				name: 'به‌روزرسانی',
				value: update.FIELD,
				description: 'به‌روزرسانی ردیف(ها)',
				action: 'Update row(s)',
			},
			{
				name: 'درج یا به‌روزرسانی',
				value: upsert.FIELD,
				description: 'درج یا به‌روزرسانی ردیف(ها)',
				action: 'Upsert row(s)',
			},
		],
		default: 'insert',
	},
	{
		// eslint-disable-next-line n8n-nodes-base/node-param-display-name-miscased
		displayName: 'جدول داده',
		name: DATA_TABLE_ID_FIELD,
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		required: true,
		modes: [
			{
				displayName: 'از لیست',
				name: 'list',
				type: 'list',
				typeOptions: {
					searchListMethod: 'tableSearch',
					searchable: true,
					allowNewResource: {
						label: 'resourceLocator.dataTable.createNew',
						url: '/projects/{{$projectId}}/datatables/new',
					},
				},
			},
			{
				displayName: 'شناسه',
				name: 'id',
				type: 'string',
			},
		],
		displayOptions: { show: { resource: ['row'] } },
	},
	...deleteRows.description,
	...insert.description,
	...get.description,
	...rowExists.description,
	...rowNotExists.description,
	...update.description,
	...upsert.description,
];
