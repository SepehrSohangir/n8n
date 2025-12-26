import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeBaseDescription,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

import type { IncludeMods, SetField, SetNodeOptions } from './helpers/interfaces';
import { INCLUDE } from './helpers/interfaces';
import * as manual from './manual.mode';
import * as raw from './raw.mode';

type Mode = 'manual' | 'raw';

const versionDescription: INodeTypeDescription = {
	displayName: 'ویرایش فیلدها (Set)',
	name: 'set',
	iconColor: 'blue',
	group: ['input'],
	version: [3, 3.1, 3.2, 3.3, 3.4],
	description: 'تغییر، افزودن یا حذف فیلدهای آیتم',
	subtitle: '={{$parameter["mode"]}}',
	defaults: {
		name: 'ویرایش فیلدها',
	},
	inputs: [NodeConnectionTypes.Main],
	outputs: [NodeConnectionTypes.Main],
	properties: [
		{
			displayName: 'حالت',
			name: 'mode',
			type: 'options',
			noDataExpression: true,
			options: [
				{
					name: 'نگاشت دستی',
					value: 'manual',
					description: 'ویرایش فیلدهای آیتم یکی یکی',
					action: 'ویرایش فیلدهای آیتم یکی یکی',
				},
				{
					name: 'JSON',
					value: 'raw',
					description: 'سفارشی‌سازی خروجی آیتم با JSON',
					action: 'سفارشی‌سازی خروجی آیتم با JSON',
				},
			],
			default: 'manual',
		},
		{
			displayName: 'تکرار آیتم',
			name: 'duplicateItem',
			type: 'boolean',
			default: false,
			isNodeSetting: true,
			description: 'آیا این آیتم باید به تعداد مشخصی تکرار شود',
		},
		{
			displayName: 'تعداد تکرار آیتم',
			name: 'duplicateCount',
			type: 'number',
			default: 0,
			typeOptions: {
				minValue: 0,
			},
			description: 'چند بار آیتم باید تکرار شود، عمدتاً برای تست و دیباگ استفاده می‌شود',
			isNodeSetting: true,
			displayOptions: {
				show: {
					duplicateItem: [true],
				},
			},
		},
		{
			displayName:
				'تکرار آیتم در تنظیمات نود تنظیم شده است. این گزینه زمانی که گردش کار به صورت خودکار اجرا می‌شود نادیده گرفته خواهد شد.',
			name: 'duplicateWarning',
			type: 'notice',
			default: '',
			displayOptions: {
				show: {
					duplicateItem: [true],
				},
			},
		},
		...raw.description,
		...manual.description,
		{
			displayName: 'شامل در خروجی',
			name: 'include',
			type: 'options',
			description: 'نحوه انتخاب فیلدهایی که می‌خواهید در آیتم‌های خروجی خود شامل کنید',
			default: 'all',
			displayOptions: {
				show: {
					'@version': [3, 3.1, 3.2],
				},
			},
			options: [
				{
					name: 'همه فیلدهای ورودی',
					value: INCLUDE.ALL,
					description: 'همچنین شامل همه فیلدهای تغییر نیافته از ورودی',
				},
				{
					name: 'بدون فیلدهای ورودی',
					value: INCLUDE.NONE,
					description: 'فقط شامل فیلدهای مشخص شده در بالا',
				},
				{
					name: 'فیلدهای ورودی انتخاب شده',
					value: INCLUDE.SELECTED,
					description: 'همچنین شامل فیلدهای فهرست شده در پارامتر "فیلدهای برای شامل کردن"',
				},
				{
					name: 'همه فیلدهای ورودی به جز',
					value: INCLUDE.EXCEPT,
					description: 'حذف فیلدهای فهرست شده در پارامتر "فیلدهای برای حذف"',
				},
			],
		},
		{
			displayName: 'شامل سایر فیلدهای ورودی',
			name: 'includeOtherFields',
			type: 'boolean',
			default: false,
			description:
				"آیا همه فیلدهای ورودی به خروجی منتقل شوند (همراه با فیلدهای تنظیم شده در 'فیلدهای برای تنظیم')",
			displayOptions: {
				hide: {
					'@version': [3, 3.1, 3.2],
				},
			},
		},
		{
			displayName: 'فیلدهای ورودی برای شامل کردن',
			name: 'include',
			type: 'options',
			description: 'نحوه انتخاب فیلدهایی که می‌خواهید در آیتم‌های خروجی خود شامل کنید',
			default: 'all',
			displayOptions: {
				hide: {
					'@version': [3, 3.1, 3.2],
					'/includeOtherFields': [false],
				},
			},
			options: [
				{
					name: 'همه',
					value: INCLUDE.ALL,
					description: 'همچنین شامل همه فیلدهای تغییر نیافته از ورودی',
				},
				{
					name: 'انتخاب شده',
					value: INCLUDE.SELECTED,
					description: 'همچنین شامل فیلدهای فهرست شده در پارامتر "فیلدهای برای شامل کردن"',
				},
				{
					name: 'همه به جز',
					value: INCLUDE.EXCEPT,
					description: 'حذف فیلدهای فهرست شده در پارامتر "فیلدهای برای حذف"',
				},
			],
		},
		{
			displayName: 'فیلدهای برای شامل کردن',
			name: 'includeFields',
			type: 'string',
			default: '',
			placeholder: 'مثلاً fieldToInclude1,fieldToInclude2',
			description:
				'لیست جدا شده با کاما از نام فیلدهایی که می‌خواهید در خروجی شامل کنید. می‌توانید فیلدهای انتخاب شده را از پنل ورودی بکشید.',
			requiresDataPath: 'multiple',
			displayOptions: {
				show: {
					include: ['selected'],
					'@version': [3, 3.1, 3.2],
				},
			},
		},
		{
			displayName: 'فیلدهای برای حذف',
			name: 'excludeFields',
			type: 'string',
			default: '',
			placeholder: 'مثلاً fieldToExclude1,fieldToExclude2',
			description:
				'لیست جدا شده با کاما از نام فیلدهایی که می‌خواهید از خروجی حذف کنید. می‌توانید فیلدهای انتخاب شده را از پنل ورودی بکشید.',
			requiresDataPath: 'multiple',
			displayOptions: {
				show: {
					include: ['except'],
					'@version': [3, 3.1, 3.2],
				},
			},
		},
		{
			displayName: 'فیلدهای برای شامل کردن',
			name: 'includeFields',
			type: 'string',
			default: '',
			placeholder: 'مثلاً fieldToInclude1,fieldToInclude2',
			description:
				'لیست جدا شده با کاما از نام فیلدهایی که می‌خواهید در خروجی شامل کنید. می‌توانید فیلدهای انتخاب شده را از پنل ورودی بکشید.',
			requiresDataPath: 'multiple',
			displayOptions: {
				show: {
					include: ['selected'],
					'/includeOtherFields': [true],
				},
				hide: {
					'@version': [3, 3.1, 3.2],
				},
			},
		},
		{
			displayName: 'فیلدهای برای حذف',
			name: 'excludeFields',
			type: 'string',
			default: '',
			placeholder: 'مثلاً fieldToExclude1,fieldToExclude2',
			description:
				'لیست جدا شده با کاما از نام فیلدهایی که می‌خواهید از خروجی حذف کنید. می‌توانید فیلدهای انتخاب شده را از پنل ورودی بکشید.',
			requiresDataPath: 'multiple',
			displayOptions: {
				show: {
					include: ['except'],
					'/includeOtherFields': [true],
				},
				hide: {
					'@version': [3, 3.1, 3.2],
				},
			},
		},
		{
			displayName: 'گزینه‌ها',
			name: 'options',
			type: 'collection',
			placeholder: 'افزودن گزینه',
			default: {},
			options: [
				{
					displayName: 'شامل فایل باینری',
					name: 'includeBinary',
					type: 'boolean',
					default: true,
					displayOptions: {
						hide: {
							'@version': [{ _cnd: { gte: 3.4 } }],
						},
					},
					description: 'آیا داده باینری باید شامل شود اگر در آیتم ورودی موجود باشد',
				},
				{
					displayName: 'حذف داده باینری',
					name: 'stripBinary',
					type: 'boolean',
					default: true,
					description:
						'آیا داده باینری باید از آیتم ورودی حذف شود. فقط زمانی اعمال می‌شود که "شامل سایر فیلدهای ورودی" فعال باشد.',
					displayOptions: {
						show: {
							'@version': [{ _cnd: { gte: 3.4 } }],
							'/includeOtherFields': [true],
						},
					},
				},
				{
					displayName: 'نادیده گرفتن خطاهای تبدیل نوع',
					name: 'ignoreConversionErrors',
					type: 'boolean',
					default: false,
					description: 'آیا خطاهای نوع فیلد نادیده گرفته شوند و تبدیل نوع کمتر سخت‌گیرانه اعمال شود',
					displayOptions: {
						show: {
							'/mode': ['manual'],
						},
					},
				},
				{
					displayName: 'پشتیبانی از نماد نقطه',
					name: 'dotNotation',
					type: 'boolean',
					default: true,
					// eslint-disable-next-line n8n-nodes-base/node-param-description-boolean-without-whether
					description:
						'به طور پیش‌فرض، نماد نقطه در نام ویژگی‌ها استفاده می‌شود. این به معنای آن است که "a.b" ویژگی "b" را زیر "a" تنظیم می‌کند بنابراین { "a": { "b": value} }. اگر این مورد نظر نیست می‌تواند غیرفعال شود، سپس { "a.b": value } را تنظیم می‌کند.',
				},
			],
		},
	],
};

export class SetV2 implements INodeType {
	description: INodeTypeDescription;

	constructor(baseDescription: INodeTypeBaseDescription) {
		this.description = {
			...baseDescription,
			...versionDescription,
		};
	}

	async execute(this: IExecuteFunctions) {
		const items = this.getInputData();
		const mode = this.getNodeParameter('mode', 0) as Mode;
		const duplicateItem = this.getNodeParameter('duplicateItem', 0, false) as boolean;

		const setNode = { raw, manual };

		const returnData: INodeExecutionData[] = [];

		const rawData: IDataObject = {};

		if (mode === 'raw') {
			const jsonOutput = this.getNodeParameter('jsonOutput', 0, '', {
				rawExpressions: true,
			}) as string | undefined;

			if (jsonOutput?.startsWith('=')) {
				rawData.jsonOutput = jsonOutput.replace(/^=+/, '');
			}
		} else {
			const workflowFieldsJson = this.getNodeParameter('fields.values', 0, [], {
				rawExpressions: true,
			}) as SetField[];

			for (const entry of workflowFieldsJson) {
				if (entry.type === 'objectValue' && (entry.objectValue as string).startsWith('=')) {
					rawData[entry.name] = (entry.objectValue as string).replace(/^=+/, '');
				}
			}
		}

		for (let i = 0; i < items.length; i++) {
			const includeOtherFields = this.getNodeParameter('includeOtherFields', i, false) as boolean;
			const include = this.getNodeParameter('include', i, 'all') as IncludeMods;
			const options = this.getNodeParameter('options', i, {});
			const node = this.getNode();

			if (node.typeVersion >= 3.3) {
				options.include = includeOtherFields ? include : 'none';
			} else {
				options.include = include;
			}

			const newItem = await setNode[mode].execute.call(
				this,
				items[i],
				i,
				options as SetNodeOptions,
				rawData,
				node,
			);

			if (duplicateItem && this.getMode() === 'manual') {
				const duplicateCount = this.getNodeParameter('duplicateCount', 0, 0) as number;
				for (let j = 0; j <= duplicateCount; j++) {
					returnData.push(newItem);
				}
			} else {
				returnData.push(newItem);
			}
		}

		return [returnData];
	}
}
