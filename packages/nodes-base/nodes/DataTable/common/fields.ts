import type { INodeProperties } from 'n8n-workflow';

export const DATA_TABLE_ID_FIELD = 'dataTableId';

export const DRY_RUN = {
	displayName: 'شبیه‌سازی اجرا',
	name: 'dryRun',
	type: 'boolean',
	default: false,
	description: 'آیا عملیات شبیه‌سازی شده و ردیف‌های متاثر در حالت‌های "قبل" و "بعد" را بازمی‌گرداند',
} satisfies INodeProperties;
