import jwt from 'jsonwebtoken';
import set from 'lodash/set';
import type {
	IDataObject,
	IExecuteFunctions,
	IN8nHttpFullResponse,
	IN8nHttpResponse,
	INodeExecutionData,
	INodeProperties,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import {
	jsonParse,
	NodeOperationError,
	NodeConnectionTypes,
	WEBHOOK_NODE_TYPE,
	FORM_TRIGGER_NODE_TYPE,
	CHAT_TRIGGER_NODE_TYPE,
	WAIT_NODE_TYPE,
	WAIT_INDEFINITELY,
} from 'n8n-workflow';
import type { Readable } from 'stream';

import { getBinaryResponse } from './utils/binary';
import { configuredOutputs } from './utils/outputs';
import { formatPrivateKey, generatePairedItemData } from '../../utils/utilities';

const respondWithProperty: INodeProperties = {
	displayName: 'پاسخ با',
	name: 'respondWith',
	type: 'options',
	options: [
		{
			name: 'همه آیتم‌های ورودی',
			value: 'allIncomingItems',
			description: 'پاسخ با همه آیتم‌های JSON ورودی',
		},
		{
			name: 'فایل باینری',
			value: 'binary',
			description: 'پاسخ با داده‌های باینری فایل ورودی',
		},
		{
			name: 'اولین آیتم ورودی',
			value: 'firstIncomingItem',
			description: 'پاسخ با اولین آیتم JSON ورودی',
		},
		{
			name: 'JSON',
			value: 'json',
			description: 'پاسخ با بدنه JSON سفارشی',
		},
		{
			name: 'توکن JWT',
			value: 'jwt',
			description: 'پاسخ با یک توکن JWT',
		},
		{
			name: 'بدون داده',
			value: 'noData',
			description: 'پاسخ با بدنه خالی',
		},
		{
			name: 'تغییر مسیر',
			value: 'redirect',
			description: 'پاسخ با تغییر مسیر به یک URL مشخص',
		},
		{
			name: 'متن',
			value: 'text',
			description: 'پاسخ با بدنه پیام متنی ساده',
		},
	],
	default: 'firstIncomingItem',
	description: 'داده‌ای که باید برگردانده شود',
};

export class RespondToWebhook implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'پاسخ به Webhook',
		icon: { light: 'file:webhook.svg', dark: 'file:webhook.dark.svg' },
		name: 'respondToWebhook',
		group: ['transform'],
		version: [1, 1.1, 1.2, 1.3, 1.4, 1.5],
		defaultVersion: 1.5,
		description: 'برگرداندن داده برای Webhook',
		defaults: {
			name: 'پاسخ به Webhook',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: `={{(${configuredOutputs})($nodeVersion, $parameter)}}`,
		credentials: [
			{
				name: 'jwtAuth',
				required: true,
				displayOptions: {
					show: {
						respondWith: ['jwt'],
					},
				},
			},
		],
		properties: [
			{
				displayName: 'فعال‌سازی شاخه خروجی پاسخ',
				name: 'enableResponseOutput',
				type: 'boolean',
				default: false,
				description: 'آیا یک شاخه خروجی اضافی با پاسخ ارسال شده به webhook ارائه شود',
				isNodeSetting: true,
				displayOptions: { show: { '@version': [{ _cnd: { gte: 1.4 } }] } },
			},
			{
				displayName:
					'تأیید کنید که پارامتر "پاسخ" نود "Webhook" روی "استفاده از نود پاسخ به Webhook" تنظیم شده است. <a href="https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.respondtowebhook/" target="_blank">جزئیات بیشتر',
				name: 'generalNotice',
				type: 'notice',
				default: '',
			},
			{
				...respondWithProperty,
				displayOptions: { show: { '@version': [1, 1.1] } },
			},
			{
				...respondWithProperty,
				noDataExpression: true,
				displayOptions: { show: { '@version': [{ _cnd: { gte: 1.2 } }] } },
			},
			{
				displayName: 'Credentials',
				name: 'credentials',
				type: 'credentials',
				default: '',
				displayOptions: {
					show: {
						respondWith: ['jwt'],
					},
				},
			},
			{
				displayName:
					'هنگام استفاده از عبارات، توجه داشته باشید که این نود فقط برای اولین آیتم در داده‌های ورودی اجرا می‌شود',
				name: 'webhookNotice',
				type: 'notice',
				displayOptions: {
					show: {
						respondWith: ['json', 'text', 'jwt'],
					},
				},
				default: '',
			},
			{
				displayName: 'URL تغییر مسیر',
				name: 'redirectURL',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						respondWith: ['redirect'],
					},
				},
				default: '',
				placeholder: 'مثلاً http://www.n8n.io',
				description: 'URL برای تغییر مسیر به',
				validateType: 'url',
			},
			{
				displayName: 'بدنه پاسخ',
				name: 'responseBody',
				type: 'json',
				displayOptions: {
					show: {
						respondWith: ['json'],
					},
				},
				default: '{\n  "myField": "value"\n}',
				typeOptions: {
					rows: 4,
				},
				description: 'داده‌های JSON پاسخ HTTP',
			},
			{
				displayName: 'Payload',
				name: 'payload',
				type: 'json',
				displayOptions: {
					show: {
						respondWith: ['jwt'],
					},
				},
				default: '{\n  "myField": "value"\n}',
				typeOptions: {
					rows: 4,
				},
				validateType: 'object',
				description: 'Payload برای گنجاندن در توکن JWT',
			},
			{
				displayName: 'بدنه پاسخ',
				name: 'responseBody',
				type: 'string',
				displayOptions: {
					show: {
						respondWith: ['text'],
					},
				},
				typeOptions: {
					rows: 2,
				},
				default: '',
				placeholder: 'مثلاً گردش کار تکمیل شد',
				description: 'داده‌های متنی پاسخ HTTP',
			},
			{
				displayName: 'منبع داده پاسخ',
				name: 'responseDataSource',
				type: 'options',
				displayOptions: {
					show: {
						respondWith: ['binary'],
					},
				},
				options: [
					{
						name: 'انتخاب خودکار از ورودی',
						value: 'automatically',
						description: 'استفاده کنید اگر داده‌های ورودی شامل یک قطعه داده باینری باشد',
					},
					{
						name: 'مشخص کردن خودم',
						value: 'set',
						description: 'نام فیلد ورودی که داده‌های باینری در آن قرار دارد را وارد کنید',
					},
				],
				default: 'automatically',
			},
			{
				displayName: 'نام فیلد ورودی',
				name: 'inputFieldName',
				type: 'string',
				required: true,
				default: 'data',
				displayOptions: {
					show: {
						respondWith: ['binary'],
						responseDataSource: ['set'],
					},
				},
				description: 'نام فیلد ورودی نود با داده‌های باینری',
			},
			{
				displayName:
					'برای جلوگیری از رفتار غیرمنتظره، یک هدر پاسخ "Content-Type" با مقدار مناسب اضافه کنید',
				name: 'contentTypeNotice',
				type: 'notice',
				default: '',
				displayOptions: {
					show: {
						respondWith: ['text'],
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
						displayName: 'کد پاسخ',
						name: 'responseCode',
						type: 'number',
						typeOptions: {
							minValue: 100,
							maxValue: 599,
						},
						default: 200,
						description: 'کد پاسخ HTTP برای برگرداندن. پیش‌فرض 200 است.',
					},
					{
						displayName: 'هدرهای پاسخ',
						name: 'responseHeaders',
						placeholder: 'افزودن هدر پاسخ',
						description: 'افزودن هدرها به پاسخ webhook',
						type: 'fixedCollection',
						typeOptions: {
							multipleValues: true,
						},
						default: {},
						options: [
							{
								name: 'entries',
								displayName: 'ورودی‌ها',
								values: [
									{
										displayName: 'نام',
										name: 'name',
										type: 'string',
										default: '',
										description: 'نام هدر',
									},
									{
										displayName: 'مقدار',
										name: 'value',
										type: 'string',
										default: '',
										description: 'مقدار هدر',
									},
								],
							},
						],
					},
					{
						displayName: 'قرار دادن پاسخ در فیلد',
						name: 'responseKey',
						type: 'string',
						displayOptions: {
							show: {
								['/respondWith']: ['allIncomingItems', 'firstIncomingItem'],
							},
						},
						default: '',
						description: 'نام فیلد پاسخ برای قرار دادن همه آیتم‌ها در آن',
						placeholder: 'مثلاً data',
					},
					{
						displayName: 'فعال‌سازی استریمینگ',
						name: 'enableStreaming',
						type: 'boolean',
						default: true,
						description: 'آیا استریمینگ به پاسخ فعال شود',
						displayOptions: {
							show: {
								['/respondWith']: ['allIncomingItems', 'firstIncomingItem', 'text', 'json', 'jwt'],
								'@version': [{ _cnd: { gte: 1.5 } }],
							},
						},
					},
				],
			},
		],
	};

	async onMessage(
		context: IExecuteFunctions,
		_data: INodeExecutionData,
	): Promise<INodeExecutionData[][]> {
		const inputData = context.getInputData();
		return [inputData];
	}

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const nodeVersion = this.getNode().typeVersion;

		const WEBHOOK_NODE_TYPES = [
			WEBHOOK_NODE_TYPE,
			FORM_TRIGGER_NODE_TYPE,
			CHAT_TRIGGER_NODE_TYPE,
			WAIT_NODE_TYPE,
		];

		let response: IN8nHttpFullResponse;

		const connectedNodes = this.getParentNodes(this.getNode().name, {
			includeNodeParameters: true,
		});

		const options = this.getNodeParameter('options', 0, {});

		const shouldStream =
			nodeVersion >= 1.5 && this.isStreaming() && options.enableStreaming !== false;

		try {
			if (nodeVersion >= 1.1) {
				if (!connectedNodes.some(({ type }) => WEBHOOK_NODE_TYPES.includes(type))) {
					throw new NodeOperationError(
						this.getNode(),
						new Error('No Webhook node found in the workflow'),
						{
							description:
								'Insert a Webhook node to your workflow and set the “Respond” parameter to “Using Respond to Webhook Node” ',
						},
					);
				}
			}

			const respondWith = this.getNodeParameter('respondWith', 0) as string;

			const headers = {} as IDataObject;
			if (options.responseHeaders) {
				for (const header of (options.responseHeaders as IDataObject).entries as IDataObject[]) {
					if (typeof header.name !== 'string') {
						header.name = header.name?.toString();
					}
					headers[header.name?.toLowerCase() as string] = header.value?.toString();
				}
			}

			let statusCode = (options.responseCode as number) || 200;
			let responseBody: IN8nHttpResponse | Readable;
			if (respondWith === 'json') {
				const responseBodyParameter = this.getNodeParameter('responseBody', 0) as string;
				if (responseBodyParameter) {
					if (typeof responseBodyParameter === 'object') {
						responseBody = responseBodyParameter;
					} else {
						try {
							responseBody = jsonParse(responseBodyParameter);
						} catch (error) {
							throw new NodeOperationError(this.getNode(), error as Error, {
								message: "Invalid JSON in 'Response Body' field",
								description:
									"Check that the syntax of the JSON in the 'Response Body' parameter is valid",
							});
						}
					}
				}

				if (shouldStream) {
					this.sendChunk('begin', 0);
					this.sendChunk('item', 0, responseBody as IDataObject);
					this.sendChunk('end', 0);
				}
			} else if (respondWith === 'jwt') {
				try {
					const { keyType, secret, algorithm, privateKey } = await this.getCredentials<{
						keyType: 'passphrase' | 'pemKey';
						privateKey: string;
						secret: string;
						algorithm: jwt.Algorithm;
					}>('jwtAuth');

					let secretOrPrivateKey;

					if (keyType === 'passphrase') {
						secretOrPrivateKey = secret;
					} else {
						secretOrPrivateKey = formatPrivateKey(privateKey);
					}
					const payload = this.getNodeParameter('payload', 0, {}) as IDataObject;
					const token = jwt.sign(payload, secretOrPrivateKey, { algorithm });
					responseBody = { token };

					if (shouldStream) {
						this.sendChunk('begin', 0);
						this.sendChunk('item', 0, responseBody as IDataObject);
						this.sendChunk('end', 0);
					}
				} catch (error) {
					throw new NodeOperationError(this.getNode(), error as Error, {
						message: 'Error signing JWT token',
					});
				}
			} else if (respondWith === 'allIncomingItems') {
				const respondItems = items.map((item, index) => {
					this.sendChunk('begin', index);
					this.sendChunk('item', index, item.json);
					this.sendChunk('end', index);
					return item.json;
				});
				responseBody = options.responseKey
					? set({}, options.responseKey as string, respondItems)
					: respondItems;
			} else if (respondWith === 'firstIncomingItem') {
				responseBody = options.responseKey
					? set({}, options.responseKey as string, items[0].json)
					: items[0].json;
				if (shouldStream) {
					this.sendChunk('begin', 0);
					this.sendChunk('item', 0, items[0].json);
					this.sendChunk('end', 0);
				}
			} else if (respondWith === 'text') {
				const rawBody = this.getNodeParameter('responseBody', 0) as string;
				responseBody = rawBody;

				// Send the raw body to the stream
				if (shouldStream) {
					this.sendChunk('begin', 0);
					this.sendChunk('item', 0, rawBody);
					this.sendChunk('end', 0);
				}
			} else if (respondWith === 'binary') {
				const item = items[0];

				if (item.binary === undefined) {
					throw new NodeOperationError(this.getNode(), 'No binary data exists on the first item!');
				}

				let responseBinaryPropertyName: string;

				const responseDataSource = this.getNodeParameter('responseDataSource', 0) as string;

				if (responseDataSource === 'set') {
					responseBinaryPropertyName = this.getNodeParameter('inputFieldName', 0) as string;
				} else {
					const binaryKeys = Object.keys(item.binary);
					if (binaryKeys.length === 0) {
						throw new NodeOperationError(
							this.getNode(),
							'No binary data exists on the first item!',
						);
					}
					responseBinaryPropertyName = binaryKeys[0];
				}

				const binaryData = this.helpers.assertBinaryData(0, responseBinaryPropertyName);

				responseBody = getBinaryResponse(binaryData, headers);
			} else if (respondWith === 'redirect') {
				headers.location = this.getNodeParameter('redirectURL', 0) as string;
				statusCode = (options.responseCode as number) ?? 307;
			} else if (respondWith !== 'noData') {
				throw new NodeOperationError(
					this.getNode(),
					`The Response Data option "${respondWith}" is not supported!`,
				);
			}

			const chatTrigger = connectedNodes.find(
				(node) => node.type === CHAT_TRIGGER_NODE_TYPE && !node.disabled,
			);

			const parameters = chatTrigger?.parameters as {
				options: { responseMode: string };
			};

			// if workflow is started from chat trigger and responseMode is set to "responseNodes"
			// response to chat will be send by ChatService
			if (
				chatTrigger &&
				!chatTrigger.disabled &&
				parameters.options.responseMode === 'responseNodes'
			) {
				let message = '';

				if (responseBody && typeof responseBody === 'object' && !Array.isArray(responseBody)) {
					message =
						(((responseBody as IDataObject).output ??
							(responseBody as IDataObject).text ??
							(responseBody as IDataObject).message) as string) ?? '';

					if (message === '' && Object.keys(responseBody).length > 0) {
						try {
							message = JSON.stringify(responseBody, null, 2);
						} catch (e) {}
					}
				}

				await this.putExecutionToWait(WAIT_INDEFINITELY);
				return [[{ json: {}, sendMessage: message }]];
			}

			response = {
				body: responseBody,
				headers,
				statusCode,
			};

			if (!shouldStream || respondWith === 'binary') {
				this.sendResponse(response);
			}
		} catch (error) {
			if (this.continueOnFail()) {
				const itemData = generatePairedItemData(items.length);
				const returnData = this.helpers.constructExecutionMetaData(
					[{ json: { error: error.message } }],
					{ itemData },
				);
				return [returnData];
			}

			throw error;
		}

		if (nodeVersion === 1.3) {
			return [items, [{ json: { response } }]];
		} else if (nodeVersion >= 1.4 && this.getNodeParameter('enableResponseOutput', 0, false)) {
			return [items, [{ json: { response } }]];
		}

		return [items];
	}
}
