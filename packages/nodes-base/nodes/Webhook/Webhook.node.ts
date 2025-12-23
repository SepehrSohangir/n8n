/* eslint-disable n8n-nodes-base/node-execute-block-wrong-error-thrown */
import { createWriteStream } from 'fs';
import { stat } from 'fs/promises';
import isbot from 'isbot';
import type {
	IWebhookFunctions,
	IDataObject,
	INodeExecutionData,
	INodeTypeDescription,
	IWebhookResponseData,
	INodeProperties,
} from 'n8n-workflow';
import { BINARY_ENCODING, NodeOperationError, Node } from 'n8n-workflow';
import { pipeline } from 'stream/promises';
import { file as tmpFile } from 'tmp-promise';
import { v4 as uuid } from 'uuid';

import {
	authenticationProperty,
	credentialsProperty,
	defaultWebhookDescription,
	httpMethodsProperty,
	optionsProperty,
	responseBinaryPropertyNameProperty,
	responseCodeOption,
	responseCodeProperty,
	responseDataProperty,
	responseModeProperty,
	responseModePropertyStreaming,
} from './description';
import { WebhookAuthorizationError } from './error';
import {
	checkResponseModeConfiguration,
	configuredOutputs,
	handleFormData,
	isIpWhitelisted,
	setupOutputConnection,
	validateWebhookAuthentication,
} from './utils';

export class Webhook extends Node {
	authPropertyName = 'authentication';

	description: INodeTypeDescription = {
		displayName: 'وب هوک',
		icon: { light: 'file:webhook.svg', dark: 'file:webhook.dark.svg' },
		name: 'webhook',
		group: ['trigger'],
		version: [1, 1.1, 2, 2.1],
		defaultVersion: 2.1,
		description: 'شروع جریان کاری زمانی که یک وب هوک فراخوانی می‌شود',
		eventTriggerDescription: 'در انتظار فراخوانی URL تست',
		activationMessage: 'اکنون می‌توانید به URL وب هوک تولید خود فراخوانی کنید.',
		defaults: {
			name: 'وب هوک',
		},
		supportsCORS: true,
		triggerPanel: {
			header: '',
			executionsHelp: {
				inactive:
					"وب هوک‌ها دو حالت دارند: تست و تولید. <br /> <br /> <b>در حین ساخت جریان کاری خود از حالت تست استفاده کنید</b>. روی دکمه 'گوش دادن' کلیک کنید، سپس یک درخواست به URL تست ارسال کنید. اجراها در ویرایشگر نمایش داده خواهند شد.<br /> <br /> <b>برای اجرای خودکار جریان کاری خود از حالت تولید استفاده کنید</b>. جریان کاری را منتشر کنید، سپس درخواست‌ها را به URL تولید ارسال کنید. این اجراها در فهرست اجراها نمایش داده می‌شوند، اما در ویرایشگر نمایش داده نمی‌شوند.",
				active:
					"وب هوک‌ها دو حالت دارند: تست و تولید. <br /> <br /> <b>در حین ساخت جریان کاری خود از حالت تست استفاده کنید</b>. روی دکمه 'گوش دادن' کلیک کنید، سپس یک درخواست به URL تست ارسال کنید. اجراها در ویرایشگر نمایش داده خواهند شد.<br /> <br /> <b>برای اجرای خودکار جریان کاری خود از حالت تولید استفاده کنید</b>. جریان کاری را منتشر کنید، سپس درخواست‌ها را به URL تولید ارسال کنید. این اجراها در فهرست اجراها نمایش داده می‌شوند، اما در ویرایشگر نمایش داده نمی‌شوند.",
			},
			activationHint:
				'زمانی که ساخت جریان کاری خود را به پایان رساندید، بدون نیاز به کلیک روی این دکمه، با استفاده از URL وب هوک تولید، آن را اجرا کنید.',
		},

		inputs: [],
		outputs: `={{(${configuredOutputs})($parameter)}}`,
		credentials: credentialsProperty(this.authPropertyName),
		webhooks: [defaultWebhookDescription],
		properties: [
			{
				displayName: 'اجازه به چندین متد HTTP',
				name: 'multipleMethods',
				type: 'boolean',
				default: false,
				isNodeSetting: true,
				description: 'آیا وبهوک باید به چندین متد HTTP گوش دهد',
			},
			{
				...httpMethodsProperty,
				displayOptions: {
					show: {
						multipleMethods: [false],
					},
				},
			},
			{
				displayName: 'متدهای HTTP',
				name: 'httpMethod',
				type: 'multiOptions',
				options: [
					{
						name: 'DELETE',
						value: 'DELETE',
					},
					{
						name: 'GET',
						value: 'GET',
					},
					{
						name: 'HEAD',
						value: 'HEAD',
					},
					{
						name: 'PATCH',
						value: 'PATCH',
					},
					{
						name: 'POST',
						value: 'POST',
					},
					{
						name: 'PUT',
						value: 'PUT',
					},
				],
				default: ['GET', 'POST'],
				description: 'متدهای HTTP برای گوش دادن',
				displayOptions: {
					show: {
						multipleMethods: [true],
					},
				},
			},
			{
				displayName: 'مسیر',
				name: 'path',
				type: 'string',
				default: '',
				placeholder: 'وب هوک',
				description:
					"مسیری که باید به آن گوش داده شود، مقادیر پویا می‌توانند با استفاده از ':' مشخص شوند، مثلاً 'your-path/:dynamic-value'. اگر مقادیر پویا تنظیم شوند، 'webhookId' به مسیر اضافه خواهد شد.",
			},
			authenticationProperty(this.authPropertyName),
			responseModeProperty,
			responseModePropertyStreaming,
			{
				displayName:
					'یک نود \'پاسخ به وبهوک\' اضافه کنید تا کنترل کنید چه زمانی و چگونه پاسخ دهید. <a href="https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.respondtowebhook/" target="_blank">جزئیات بیشتر</a>',
				name: 'webhookNotice',
				type: 'notice',
				displayOptions: {
					show: {
						responseMode: ['responseNode'],
					},
				},
				default: '',
			},
			{
				displayName:
					'یک نود که از پخش زنده پشتیبانی می‌کند (مثلاً \'AI Agent\') اضافه کنید و پخش زنده را فعال کنید تا داده‌ها به صورت مستقیم به پاسخ در حین اجرای جریان کاری پخش شوند. <a href="https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.respondtowebhook/" target="_blank">جزئیات بیشتر</a>',
				name: 'webhookStreamingNotice',
				type: 'notice',
				displayOptions: {
					show: {
						responseMode: ['streaming'],
					},
				},
				default: '',
			},
			{
				...responseCodeProperty,
				displayOptions: {
					show: {
						'@version': [1, 1.1],
					},
					hide: {
						responseMode: ['responseNode'],
					},
				},
			},
			responseDataProperty,
			responseBinaryPropertyNameProperty,
			{
				displayName:
					'اگر پاسخی ارسال می‌کنید، یک هدر پاسخ "Content-Type" با مقدار مناسب اضافه کنید تا از رفتار غیرمنتظره جلوگیری شود',
				name: 'contentTypeNotice',
				type: 'notice',
				default: '',
				displayOptions: {
					show: {
						responseMode: ['onReceived'],
					},
				},
			},

			{
				...optionsProperty,
				options: [...(optionsProperty.options as INodeProperties[]), responseCodeOption].sort(
					(a, b) => {
						const nameA = a.displayName.toUpperCase();
						const nameB = b.displayName.toUpperCase();
						if (nameA < nameB) return -1;
						if (nameA > nameB) return 1;
						return 0;
					},
				),
			},
		],
	};

	async webhook(context: IWebhookFunctions): Promise<IWebhookResponseData> {
		const { typeVersion: nodeVersion, type: nodeType } = context.getNode();
		const responseMode = context.getNodeParameter('responseMode', 'onReceived') as string;

		if (nodeVersion >= 2 && nodeType === 'n8n-nodes-base.webhook') {
			checkResponseModeConfiguration(context);
		}

		const options = context.getNodeParameter('options', {}) as {
			binaryData: boolean;
			ignoreBots: boolean;
			rawBody: boolean;
			responseData?: string;
			ipWhitelist?: string;
		};
		const req = context.getRequestObject();
		const resp = context.getResponseObject();
		const requestMethod = context.getRequestObject().method;

		if (!isIpWhitelisted(options.ipWhitelist, req.ips, req.ip)) {
			resp.writeHead(403);
			resp.end('IP is not whitelisted to access the webhook!');
			return { noWebhookResponse: true };
		}

		let validationData: IDataObject | undefined;
		try {
			if (options.ignoreBots && isbot(req.headers['user-agent']))
				throw new WebhookAuthorizationError(403);
			validationData = await this.validateAuth(context);
		} catch (error) {
			if (error instanceof WebhookAuthorizationError) {
				resp.writeHead(error.responseCode, { 'WWW-Authenticate': 'Basic realm="Webhook"' });
				resp.end(error.message);
				return { noWebhookResponse: true };
			}
			throw error;
		}

		const prepareOutput = setupOutputConnection(context, requestMethod, {
			jwtPayload: validationData,
		});

		if (options.binaryData) {
			return await this.handleBinaryData(context, prepareOutput);
		}

		if (req.contentType === 'multipart/form-data') {
			return await handleFormData(context, prepareOutput);
		}

		if (nodeVersion > 1 && !req.body && !options.rawBody) {
			try {
				return await this.handleBinaryData(context, prepareOutput);
			} catch (error) {}
		}

		if (options.rawBody && !req.rawBody) {
			await req.readRawBody();
		}

		const response: INodeExecutionData = {
			json: {
				headers: req.headers,
				params: req.params,
				query: req.query,
				body: req.body,
			},
			binary: options.rawBody
				? {
						data: {
							data: (req.rawBody ?? '').toString(BINARY_ENCODING),
							mimeType: req.contentType ?? 'application/json',
						},
					}
				: undefined,
		};

		if (responseMode === 'streaming') {
			const res = context.getResponseObject();

			// Set up streaming response headers
			res.writeHead(200, {
				'Content-Type': 'application/json; charset=utf-8',
				'Transfer-Encoding': 'chunked',
				'Cache-Control': 'no-cache',
				Connection: 'keep-alive',
			});

			// Flush headers immediately
			res.flushHeaders();

			return {
				noWebhookResponse: true,
				workflowData: prepareOutput(response),
			};
		}

		return {
			webhookResponse: options.responseData,
			workflowData: prepareOutput(response),
		};
	}

	private async validateAuth(context: IWebhookFunctions) {
		return await validateWebhookAuthentication(context, this.authPropertyName);
	}

	private async handleBinaryData(
		context: IWebhookFunctions,
		prepareOutput: (data: INodeExecutionData) => INodeExecutionData[][],
	): Promise<IWebhookResponseData> {
		const req = context.getRequestObject();
		const options = context.getNodeParameter('options', {}) as IDataObject;

		// TODO: create empty binaryData placeholder, stream into that path, and then finalize the binaryData
		const binaryFile = await tmpFile({ prefix: 'n8n-webhook-' });

		try {
			await pipeline(req, createWriteStream(binaryFile.path));

			const returnItem: INodeExecutionData = {
				json: {
					headers: req.headers,
					params: req.params,
					query: req.query,
					body: {},
				},
			};

			const stats = await stat(binaryFile.path);
			if (stats.size) {
				const binaryPropertyName = (options.binaryPropertyName ?? 'data') as string;
				const fileName = req.contentDisposition?.filename ?? uuid();
				const binaryData = await context.nodeHelpers.copyBinaryFile(
					binaryFile.path,
					fileName,
					req.contentType ?? 'application/octet-stream',
				);
				returnItem.binary = { [binaryPropertyName]: binaryData };
			}

			return { workflowData: prepareOutput(returnItem) };
		} catch (error) {
			throw new NodeOperationError(context.getNode(), error as Error);
		} finally {
			await binaryFile.cleanup();
		}
	}
}
