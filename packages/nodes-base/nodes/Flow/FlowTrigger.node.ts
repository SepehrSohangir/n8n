import type {
	IHookFunctions,
	IWebhookFunctions,
	IDataObject,
	INodeType,
	INodeTypeDescription,
	IWebhookResponseData,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

import { flowApiRequest } from './GenericFunctions';

export class FlowTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'تریگر Flow',
		name: 'flowTrigger',
		icon: 'file:flow.svg',
		group: ['trigger'],
		version: 1,
		description: 'مدیریت رویدادهای Flow از طریق وب هوک‌ها',
		defaults: {
			name: 'تریگر Flow',
		},
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'flowApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'منبع',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				default: '',
				options: [
					{
						name: 'پروژه',
						value: 'list',
					},
					{
						name: 'وظیفه',
						value: 'task',
					},
				],
				description: 'منبعی که وب هوک را تریگر می‌کند',
			},
			{
				displayName: 'شناسه پروژه',
				name: 'listIds',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['list'],
					},
					hide: {
						resource: ['task'],
					},
				},
				description: 'شناسه‌های لیست، شاید بهتر به عنوان "پروژه‌ها" شناخته شوند، جدا شده با کاما (,)',
			},
			{
				displayName: 'شناسه وظیفه',
				name: 'taskIds',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['task'],
					},
					hide: {
						resource: ['list'],
					},
				},
				description: 'شناسه‌های وظیفه جدا شده با کاما (,)',
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const credentials = await this.getCredentials('flowApi');

				let webhooks;
				const qs: IDataObject = {};
				const webhookData = this.getWorkflowStaticData('node');
				if (!Array.isArray(webhookData.webhookIds)) {
					webhookData.webhookIds = [];
				}
				if (!(webhookData.webhookIds as [number]).length) {
					return false;
				}
				qs.organization_id = credentials.organizationId as number;
				const endpoint = '/integration_webhooks';
				webhooks = await flowApiRequest.call(this, 'GET', endpoint, {}, qs);
				webhooks = webhooks.integration_webhooks;
				for (const webhook of webhooks) {
					// @ts-ignore
					if (webhookData.webhookIds.includes(webhook.id)) {
						continue;
					} else {
						return false;
					}
				}
				return true;
			},
			async create(this: IHookFunctions): Promise<boolean> {
				const credentials = await this.getCredentials('flowApi');

				let resourceIds, body, responseData;
				const webhookUrl = this.getNodeWebhookUrl('default');
				const webhookData = this.getWorkflowStaticData('node');
				const resource = this.getNodeParameter('resource') as string;
				const endpoint = '/integration_webhooks';
				if (resource === 'list') {
					resourceIds = (this.getNodeParameter('listIds') as string).split(',');
				}
				if (resource === 'task') {
					resourceIds = (this.getNodeParameter('taskIds') as string).split(',');
				}
				// @ts-ignore
				for (const resourceId of resourceIds) {
					body = {
						organization_id: credentials.organizationId as number,
						integration_webhook: {
							name: 'n8n-trigger',
							url: webhookUrl,
							resource_type: resource,
							resource_id: parseInt(resourceId, 10),
						},
					};
					try {
						responseData = await flowApiRequest.call(this, 'POST', endpoint, body);
					} catch (error) {
						return false;
					}
					if (
						responseData.integration_webhook === undefined ||
						responseData.integration_webhook.id === undefined
					) {
						// Required data is missing so was not successful
						return false;
					}
					// @ts-ignore
					webhookData.webhookIds.push(responseData.integration_webhook.id);
				}
				return true;
			},
			async delete(this: IHookFunctions): Promise<boolean> {
				const credentials = await this.getCredentials('flowApi');

				const qs: IDataObject = {};
				const webhookData = this.getWorkflowStaticData('node');
				qs.organization_id = credentials.organizationId as number;
				// @ts-ignore
				if (webhookData.webhookIds.length > 0) {
					// @ts-ignore
					for (const webhookId of webhookData.webhookIds) {
						const endpoint = `/integration_webhooks/${webhookId}`;
						try {
							await flowApiRequest.call(this, 'DELETE', endpoint, {}, qs);
						} catch (error) {
							return false;
						}
					}
					delete webhookData.webhookIds;
				}
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const req = this.getRequestObject();
		return {
			workflowData: [this.helpers.returnJsonArray(req.body as IDataObject[])],
		};
	}
}
