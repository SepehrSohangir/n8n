import type { INodeProperties } from 'n8n-workflow';

export const includeInputFields: INodeProperties = {
	displayName: 'شامل فیلدهای ورودی',
	name: 'includeInputFields',
	type: 'boolean',
	default: false,
	description: 'آیا همه فیلدهای آیتم ورودی در آیتم خروجی گنجانده شوند',
};
