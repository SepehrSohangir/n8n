import {
	ADD_FORM_NOTICE,
	type INodePropertyOptions,
	NodeConnectionTypes,
	type INodeProperties,
	type INodeType,
	type INodeTypeBaseDescription,
	type INodeTypeDescription,
	type IWebhookFunctions,
} from 'n8n-workflow';

import {
	appendAttributionToForm,
	formDescription,
	formFields,
	formRespondMode,
	formTitle,
	formTriggerPanel,
	respondWithOptions,
	webhookPath,
} from '../common.descriptions';
import { cssVariables } from '../cssVariables';
import { FORM_TRIGGER_AUTHENTICATION_PROPERTY } from '../interfaces';
import { formWebhook } from '../utils/utils';

const useWorkflowTimezone: INodeProperties = {
	displayName: 'استفاده از منطقه زمانی جریان کاری',
	name: 'useWorkflowTimezone',
	type: 'boolean',
	default: false,
	description: "آیا از منطقه زمانی جریان کاری در فیلد 'submittedAt' یا UTC استفاده شود",
};

const descriptionV2: INodeTypeDescription = {
	displayName: 'تریگر فرم n8n',
	name: 'formTrigger',
	icon: 'file:form.svg',
	group: ['trigger'],
	// since trigger and node are sharing descriptions and logic we need to sync the versions
	// and keep them aligned in both nodes
	version: [2, 2.1, 2.2, 2.3, 2.4],
	description: 'ساخت و مدیریت فرم‌های وب برای جمع‌آوری داده‌ها از کاربران',
	defaults: {
		name: 'هنگام ارسال فرم صبر کنید',
	},

	inputs: [],
	outputs: [NodeConnectionTypes.Main],
	webhooks: [
		{
			name: 'setup',
			httpMethod: 'GET',
			responseMode: 'onReceived',
			isFullPath: true,
			path: '={{ $parameter["path"] || $parameter["options"]?.path || $webhookId }}',
			ndvHideUrl: true,
			nodeType: 'form',
		},
		{
			name: 'default',
			httpMethod: 'POST',
			responseMode: '={{$parameter["responseMode"]}}',
			responseData: '={{$parameter["responseMode"] === "lastNode" ? "noData" : undefined}}',
			isFullPath: true,
			path: '={{ $parameter["path"] || $parameter["options"]?.path || $webhookId }}',
			ndvHideMethod: true,
			nodeType: 'form',
		},
	],
	eventTriggerDescription: 'هنگامی که یک فرم ارسال می‌شود، این تریگر فعال می‌شود',
	activationMessage: 'فرم آماده است و می‌توانید آن را با استفاده از لینک زیر مشاهده کنید:',
	triggerPanel: formTriggerPanel,
	credentials: [
		{
			// eslint-disable-next-line n8n-nodes-base/node-class-description-credentials-name-unsuffixed
			name: 'httpBasicAuth',
			required: true,
			displayOptions: {
				show: {
					[FORM_TRIGGER_AUTHENTICATION_PROPERTY]: ['basicAuth'],
				},
			},
		},
	],
	properties: [
		{
			displayName: 'احراز هویت',
			name: FORM_TRIGGER_AUTHENTICATION_PROPERTY,
			type: 'options',
			options: [
				{
					name: 'Basic Auth',
					value: 'basicAuth',
				},
				{
					name: 'هیچ‌کدام',
					value: 'none',
				},
			],
			default: 'none',
		},
		{ ...webhookPath, displayOptions: { show: { '@version': [{ _cnd: { lte: 2.1 } }] } } },
		formTitle,
		formDescription,
		formFields,
		{ ...formRespondMode, displayOptions: { show: { '@version': [{ _cnd: { lte: 2.1 } }] } } },
		{
			...formRespondMode,
			options: (formRespondMode.options as INodePropertyOptions[])?.filter(
				(option) => option.value !== 'responseNode',
			),
			displayOptions: { show: { '@version': [{ _cnd: { gte: 2.2 } }] } },
		},
		{
			displayName:
				"در گره 'پاسخ به وب‌هوک'، 'پاسخ با JSON' را انتخاب کنید و کلید <strong>formSubmittedText</strong> را برای نمایش پاسخ سفارشی در فرم، یا کلید <strong>redirectURL</strong> را برای هدایت کاربران به یک URL تنظیم کنید",
			name: 'formNotice',
			type: 'notice',
			displayOptions: {
				show: { responseMode: ['responseNode'] },
			},
			default: '',
		},
		// notice would be shown if no Form node was connected to trigger
		{
			displayName: 'ساخت فرم‌های چند مرحله‌ای با افزودن یک صفحه فرم بعدی در جریان کاری',
			name: ADD_FORM_NOTICE,
			type: 'notice',
			default: '',
		},
		{
			displayName: 'گزینه‌ها',
			name: 'options',
			type: 'collection',
			placeholder: 'افزودن گزینه',
			default: {},
			options: [
				appendAttributionToForm,
				{
					displayName: 'برچسب دکمه',
					description: 'برچسب دکمه ارسال در فرم',
					name: 'buttonLabel',
					type: 'string',
					default: 'ارسال',
				},
				{
					...webhookPath,
					required: false,
					displayOptions: { show: { '@version': [{ _cnd: { gte: 2.2 } }] } },
				},
				{
					...respondWithOptions,
					displayOptions: {
						hide: {
							'/responseMode': ['responseNode'],
						},
					},
				},
				{
					displayName: 'نادیده گرفتن ربات‌ها',
					name: 'ignoreBots',
					type: 'boolean',
					default: false,
					description:
						'آیا درخواست‌ها از ربات‌هایی مانند پیش‌نمایش‌دهنده‌های لینک و خزنده‌های وب نادیده گرفته شوند',
				},
				{
					...useWorkflowTimezone,
					default: false,
					description:
						"آیا باید از منطقه زمانی جریان کاری در فیلد 'submittedAt' استفاده شود یا UTC",
					displayOptions: {
						show: {
							'@version': [2],
						},
					},
				},
				{
					...useWorkflowTimezone,
					default: true,
					description:
						"آیا باید از منطقه زمانی جریان کاری در فیلد 'submittedAt' استفاده شود یا UTC",
					displayOptions: {
						show: {
							'@version': [{ _cnd: { gt: 2 } }],
						},
					},
				},
				{
					displayName: 'استایل فرم سفارشی CSS',
					name: 'customCss',
					type: 'string',
					typeOptions: {
						rows: 10,
						editor: 'cssEditor',
					},
					displayOptions: {
						show: {
							'@version': [{ _cnd: { gt: 2 } }],
						},
					},
					default: cssVariables.trim(),
					description: 'بازنویسی استایل پیش‌فرض رابط فرم عمومی با CSS',
				},
			],
		},
	],
};

export class FormTriggerV2 implements INodeType {
	description: INodeTypeDescription;

	constructor(baseDescription: INodeTypeBaseDescription) {
		this.description = {
			...baseDescription,
			...descriptionV2,
		};
	}

	async webhook(this: IWebhookFunctions) {
		return await formWebhook(this);
	}
}
