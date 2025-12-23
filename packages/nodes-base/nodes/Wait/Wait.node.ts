import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeTypeDescription,
	INodeProperties,
	IDisplayOptions,
	IWebhookFunctions,
} from 'n8n-workflow';
import {
	NodeConnectionTypes,
	WAIT_INDEFINITELY,
	FORM_TRIGGER_NODE_TYPE,
	tryToParseDateTime,
	NodeOperationError,
} from 'n8n-workflow';

import { validateWaitAmount, validateWaitUnit } from './validation';
import { updateDisplayOptions } from '../../utils/utilities';
import {
	formDescription,
	formFields,
	respondWithOptions,
	formRespondMode,
	formTitle,
	appendAttributionToForm,
} from '../Form/common.descriptions';
import { formWebhook } from '../Form/utils/utils';
import {
	authenticationProperty,
	credentialsProperty,
	defaultWebhookDescription,
	httpMethodsProperty,
	optionsProperty,
	responseBinaryPropertyNameProperty,
	responseCodeProperty,
	responseDataProperty,
	responseModeProperty,
} from '../Webhook/description';
import { Webhook } from '../Webhook/Webhook.node';

const toWaitAmount: INodeProperties = {
	displayName: 'زمان انتظار',
	name: 'amount',
	type: 'number',
	typeOptions: {
		minValue: 0,
		numberPrecision: 2,
	},
	default: 1,
	description: 'زمان انتظار',
	validateType: 'number',
};

const unitSelector: INodeProperties = {
	displayName: 'واحد زمان انتظار',
	name: 'unit',
	type: 'options',
	options: [
		{
			name: 'ثانیه',
			value: 'seconds',
		},
		{
			name: 'دقیقه',
			value: 'minutes',
		},
		{
			name: 'ساعت',
			value: 'hours',
		},
		{
			name: 'روز',
			value: 'days',
		},
	],
	default: 'hours',
	description: 'واحد زمان انتظار',
};

const waitTimeProperties: INodeProperties[] = [
	{
		displayName: 'محدود کردن زمان انتظار',
		name: 'limitWaitTime',
		type: 'boolean',
		default: false,
		description: 'آیا باید زمان انتظار این نود برای پاسخ کاربر قبل از ادامه اجرا محدود شود',
		displayOptions: {
			show: {
				resume: ['webhook', 'form'],
			},
		},
	},
	{
		displayName: 'نوع محدودیت',
		name: 'limitType',
		type: 'options',
		default: 'afterTimeInterval',
		description:
			'شرطی را برای ادامه اجرای جریان کاری تنظیم می‌کند. می‌تواند یک تاریخ مشخص یا پس از مدت زمان مشخص باشد.',
		displayOptions: {
			show: {
				limitWaitTime: [true],
				resume: ['webhook', 'form'],
			},
		},
		options: [
			{
				name: 'پس از بازه زمانی',
				description: 'منتظر مدت زمان مشخصی می‌ماند',
				value: 'afterTimeInterval',
			},
			{
				name: 'در زمان مشخص شده',
				description: 'منتظر می‌ماند تا تاریخ و زمان تعیین شده برای ادامه برسد',
				value: 'atSpecifiedTime',
			},
		],
	},
	{
		displayName: 'زمان انتظار',
		name: 'resumeAmount',
		type: 'number',
		displayOptions: {
			show: {
				limitType: ['afterTimeInterval'],
				limitWaitTime: [true],
				resume: ['webhook', 'form'],
			},
		},
		typeOptions: {
			minValue: 0,
			numberPrecision: 2,
		},
		default: 1,
		description: 'زمان انتظار',
	},
	{
		displayName: 'واحد',
		name: 'resumeUnit',
		type: 'options',
		displayOptions: {
			show: {
				limitType: ['afterTimeInterval'],
				limitWaitTime: [true],
				resume: ['webhook', 'form'],
			},
		},
		options: [
			{
				name: 'ثانیه',
				value: 'seconds',
			},
			{
				name: 'دقیقه',
				value: 'minutes',
			},
			{
				name: 'ساعت',
				value: 'hours',
			},
			{
				name: 'روز',
				value: 'days',
			},
		],
		default: 'hours',
		description: 'واحد مقدار بازه زمانی',
	},
	{
		displayName: 'حداکثر تاریخ و زمان',
		name: 'maxDateAndTime',
		type: 'dateTime',
		displayOptions: {
			show: {
				limitType: ['atSpecifiedTime'],
				limitWaitTime: [true],
				resume: ['webhook', 'form'],
			},
		},
		default: '',
		description: 'ادامه اجرای جریان کاری پس از تاریخ و زمان مشخص شده',
	},
];

const webhookSuffix: INodeProperties = {
	displayName: 'پسوند وب هوک',
	name: 'webhookSuffix',
	type: 'string',
	default: '',
	placeholder: 'webhook',
	noDataExpression: true,
	description:
		'این مسیر پسوند به URL راه‌اندازی مجدد اضافه می‌شود. هنگام استفاده از چندین نود انتظار مفید است.',
};

const displayOnWebhook: IDisplayOptions = {
	show: {
		resume: ['webhook'],
	},
};

const displayOnFormSubmission = {
	show: {
		resume: ['form'],
	},
};

const onFormSubmitProperties = updateDisplayOptions(displayOnFormSubmission, [
	formTitle,
	formDescription,
	formFields,
	formRespondMode,
]);

const onWebhookCallProperties = updateDisplayOptions(displayOnWebhook, [
	{
		...httpMethodsProperty,
		description: 'روش HTTP تماس وب هوک',
	},
	responseCodeProperty,
	responseModeProperty,
	responseDataProperty,
	responseBinaryPropertyNameProperty,
]);

const webhookPath = '={{$parameter["options"]["webhookSuffix"] || ""}}';

const waitingTooltip = (
	parameters: { resume: string; options?: Record<string, string> },
	resumeUrl: string,
	formResumeUrl: string,
) => {
	const resume = parameters.resume;

	if (['webhook', 'form'].includes(resume as string)) {
		const { webhookSuffix } = (parameters.options ?? {}) as { webhookSuffix: string };
		const suffix = webhookSuffix && typeof webhookSuffix !== 'object' ? `/${webhookSuffix}` : '';

		let message = '';
		const url = `${resume === 'form' ? formResumeUrl : resumeUrl}${suffix}`;

		if (resume === 'form') {
			message = 'Execution will continue when form is submitted on ';
		}

		if (resume === 'webhook') {
			message = 'Execution will continue when webhook is received on ';
		}

		return `${message}<a href="${url}" target="_blank">${url}</a>`;
	}

	return 'Execution will continue when wait time is over';
};

export class Wait extends Webhook {
	authPropertyName = 'incomingAuthentication';

	description: INodeTypeDescription = {
		displayName: 'انتظار',
		name: 'wait',
		icon: 'fa:pause-circle',
		iconColor: 'crimson',
		group: ['organization'],
		version: [1, 1.1],
		description: 'منتظر می‌ماند قبل از ادامه اجرای جریان کاری',
		defaults: {
			name: 'انتظار',
			color: '#804050',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: credentialsProperty(this.authPropertyName),
		waitingNodeTooltip: `={{ (${waitingTooltip})($parameter, $execution.resumeUrl, $execution.resumeFormUrl) }}`,
		webhooks: [
			{
				...defaultWebhookDescription,
				responseData: '={{$parameter["responseData"]}}',
				path: webhookPath,
				restartWebhook: true,
			},
			{
				name: 'default',
				httpMethod: 'GET',
				responseMode: 'onReceived',
				path: webhookPath,
				restartWebhook: true,
				isFullPath: true,
				nodeType: 'form',
			},
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: '={{$parameter["responseMode"]}}',
				responseData: '={{$parameter["responseMode"] === "lastNode" ? "noData" : undefined}}',
				path: webhookPath,
				restartWebhook: true,
				isFullPath: true,
				nodeType: 'form',
			},
		],
		properties: [
			{
				displayName: 'ادامه',
				name: 'resume',
				type: 'options',
				options: [
					{
						name: 'پس از بازه زمانی',
						value: 'timeInterval',
						description: 'منتظر می‌ماند برای مقدار مشخصی از زمان',
					},
					{
						name: 'در زمان مشخص شده',
						value: 'specificTime',
						description: 'منتظر می‌ماند تا تاریخ و زمان مشخص شده برای ادامه',
					},
					{
						name: 'در تماس وب هوک',
						value: 'webhook',
						description: 'منتظر می‌ماند تا تماس وب هوک برای ادامه',
					},
					{
						name: 'در ارسال فرم',
						value: 'form',
						description: 'منتظر می‌ماند تا ارسال فرم برای ادامه',
					},
				],
				default: 'timeInterval',
				description: 'تعیین می‌کند که از کدام حالت انتظار قبل از ادامه جریان کاری استفاده شود',
			},
			{
				displayName: 'احراز هویت',
				name: 'incomingAuthentication',
				type: 'options',
				options: [
					{
						name: 'Basic Auth',
						value: 'basicAuth',
					},
					{
						name: 'هیچکدام',
						value: 'none',
					},
				],
				default: 'none',
				description:
					'اگر و چگونه درخواست‌های وب هوک ادامه‌دهنده ورودی به $execution.resumeFormUrl باید برای امنیت بیشتر احراز هویت شوند',
				displayOptions: {
					show: {
						resume: ['form'],
					},
				},
			},
			{
				...authenticationProperty(this.authPropertyName),
				description:
					'اگر و چگونه درخواست‌های وب هوک ادامه‌دهنده ورودی به $execution.resumeUrl باید برای امنیت بیشتر احراز هویت شوند',
				displayOptions: displayOnWebhook,
			},

			// ----------------------------------
			//         resume:specificTime
			// ----------------------------------
			{
				displayName: 'تاریخ و زمان',
				name: 'dateTime',
				type: 'dateTime',
				displayOptions: {
					show: {
						resume: ['specificTime'],
					},
				},
				default: '',
				description: 'تاریخ و زمان برای انتظار قبل از ادامه',
				required: true,
			},

			// ----------------------------------
			//         resume:timeInterval
			// ----------------------------------
			{
				...toWaitAmount,
				displayOptions: {
					show: {
						resume: ['timeInterval'],
						'@version': [1],
					},
				},
			},
			{
				...toWaitAmount,
				default: 5,
				displayOptions: {
					show: {
						resume: ['timeInterval'],
					},
					hide: {
						'@version': [1],
					},
				},
			},
			{
				...unitSelector,
				displayOptions: {
					show: {
						resume: ['timeInterval'],
						'@version': [1],
					},
				},
			},
			{
				...unitSelector,
				default: 'seconds',
				displayOptions: {
					show: {
						resume: ['timeInterval'],
					},
					hide: {
						'@version': [1],
					},
				},
			},

			// ----------------------------------
			//         resume:webhook & form
			// ----------------------------------
			{
				displayName:
					'آدرس وب هوک در زمان اجرا تولید خواهد شد. می‌توان به آن با متغیر <strong>$execution.resumeUrl</strong> ارجاع داد. قبل از رسیدن به این گره، آن را جایی ارسال کنید. <a href="https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.wait/?utm_source=n8n_app&utm_medium=node_settings_modal-credential_link&utm_campaign=n8n-nodes-base.wait" target="_blank">اطلاعات بیشتر</a>',
				name: 'webhookNotice',
				type: 'notice',
				displayOptions: displayOnWebhook,
				default: '',
			},
			{
				displayName:
					'آدرس فرم در زمان اجرا تولید خواهد شد. می‌توان به آن با متغیر <strong>$execution.resumeFormUrl</strong> ارجاع داد. قبل از رسیدن به این گره، آن را جایی ارسال کنید. <a href="https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.wait/?utm_source=n8n_app&utm_medium=node_settings_modal-credential_link&utm_campaign=n8n-nodes-base.wait" target="_blank">اطلاعات بیشتر</a>',
				name: 'formNotice',
				type: 'notice',
				displayOptions: displayOnFormSubmission,
				default: '',
			},
			...onFormSubmitProperties,
			...onWebhookCallProperties,
			...waitTimeProperties,
			{
				...optionsProperty,
				displayOptions: displayOnWebhook,
				options: [...(optionsProperty.options as INodeProperties[]), webhookSuffix],
			},
			{
				displayName: 'گزینه‌ها',
				name: 'options',
				type: 'collection',
				placeholder: 'افزودن گزینه',
				default: {},
				displayOptions: {
					show: {
						resume: ['form'],
					},
					hide: {
						responseMode: ['responseNode'],
					},
				},
				options: [appendAttributionToForm, respondWithOptions, webhookSuffix],
			},
			{
				displayName: 'گزینه‌ها',
				name: 'options',
				type: 'collection',
				placeholder: 'افزودن گزینه',
				default: {},
				displayOptions: {
					show: {
						resume: ['form'],
					},
					hide: {
						responseMode: ['onReceived', 'lastNode'],
					},
				},
				options: [appendAttributionToForm, webhookSuffix],
			},
		],
	};

	async webhook(context: IWebhookFunctions) {
		const resume = context.getNodeParameter('resume', 0) as string;
		if (resume === 'form') return await formWebhook(context, this.authPropertyName);
		return await super.webhook(context);
	}

	async execute(context: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const resume = context.getNodeParameter('resume', 0) as string;

		if (['webhook', 'form'].includes(resume)) {
			let hasFormTrigger = false;

			if (resume === 'form') {
				const parentNodes = context.getParentNodes(context.getNode().name);
				hasFormTrigger = parentNodes.some((node) => node.type === FORM_TRIGGER_NODE_TYPE);
			}

			const returnData = await this.configureAndPutToWait(context);

			if (resume === 'form' && hasFormTrigger) {
				context.sendResponse({
					headers: {
						location: context.evaluateExpression('{{ $execution.resumeFormUrl }}', 0),
					},
					statusCode: 307,
				});
			}

			return returnData;
		}

		let waitTill: Date;
		if (resume === 'timeInterval') {
			const unit = context.getNodeParameter('unit', 0);

			if (!validateWaitUnit(unit)) {
				throw new NodeOperationError(
					context.getNode(),
					"Invalid wait unit. Valid units are 'seconds', 'minutes', 'hours', or 'days'.",
				);
			}

			let waitAmount = context.getNodeParameter('amount', 0);

			if (!validateWaitAmount(waitAmount)) {
				throw new NodeOperationError(
					context.getNode(),
					'Invalid wait amount. Please enter a number that is 0 or greater.',
				);
			}

			if (unit === 'minutes') {
				waitAmount *= 60;
			}
			if (unit === 'hours') {
				waitAmount *= 60 * 60;
			}
			if (unit === 'days') {
				waitAmount *= 60 * 60 * 24;
			}

			waitAmount *= 1000;

			// Timezone does not change relative dates, since they are just
			// a number of seconds added to the current timestamp
			waitTill = new Date(new Date().getTime() + waitAmount);
		} else {
			try {
				const dateTimeStrRaw = context.getNodeParameter('dateTime', 0);
				const parsedDateTime = tryToParseDateTime(dateTimeStrRaw, context.getTimezone());

				waitTill = parsedDateTime.toUTC().toJSDate();
			} catch (e) {
				throw new NodeOperationError(
					context.getNode(),
					'Cannot put execution to wait because `dateTime` parameter is not a valid date. Please pick a specific date and time to wait until.',
				);
			}
		}

		const waitValue = Math.max(waitTill.getTime() - new Date().getTime(), 0);

		if (waitValue < 65000) {
			// If wait time is shorter than 65 seconds leave execution active because
			// we just check the database every 60 seconds.
			return await new Promise((resolve) => {
				const timer = setTimeout(() => resolve([context.getInputData()]), waitValue);
				context.onExecutionCancellation(() => clearTimeout(timer));
			});
		}

		// If longer than 65 seconds put execution to wait
		return await this.putToWait(context, waitTill);
	}

	private async configureAndPutToWait(context: IExecuteFunctions) {
		let waitTill = WAIT_INDEFINITELY;
		const limitWaitTime = context.getNodeParameter('limitWaitTime', 0);

		if (limitWaitTime === true) {
			const limitType = context.getNodeParameter('limitType', 0);

			if (limitType === 'afterTimeInterval') {
				let waitAmount = context.getNodeParameter('resumeAmount', 0) as number;
				const resumeUnit = context.getNodeParameter('resumeUnit', 0);

				if (resumeUnit === 'minutes') {
					waitAmount *= 60;
				}
				if (resumeUnit === 'hours') {
					waitAmount *= 60 * 60;
				}
				if (resumeUnit === 'days') {
					waitAmount *= 60 * 60 * 24;
				}

				waitAmount *= 1000;
				waitTill = new Date(new Date().getTime() + waitAmount);
			} else {
				waitTill = new Date(context.getNodeParameter('maxDateAndTime', 0) as string);
			}
		}

		return await this.putToWait(context, waitTill);
	}

	private async putToWait(context: IExecuteFunctions, waitTill: Date) {
		await context.putExecutionToWait(waitTill);
		return [context.getInputData()];
	}
}
