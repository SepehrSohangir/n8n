import type {
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeBaseDescription,
	INodeTypeDescription,
	JsonObject,
	IHttpRequestMethods,
	IRequestOptions,
	ICredentialDataDecryptedObject,
} from 'n8n-workflow';
import {
	NodeApiError,
	NodeOperationError,
	sleep,
	removeCircularRefs,
	NodeConnectionTypes,
	isDomainAllowed,
} from 'n8n-workflow';
import type { Readable } from 'stream';

import type { IAuthDataSanitizeKeys } from '../GenericFunctions';
import { replaceNullValues, sanitizeUiMessage } from '../GenericFunctions';
interface OptionData {
	name: string;
	displayName: string;
}

interface OptionDataParameters {
	[key: string]: OptionData;
}

type IRequestOptionsKeys = keyof IRequestOptions;

export class HttpRequestV1 implements INodeType {
	description: INodeTypeDescription;

	constructor(baseDescription: INodeTypeBaseDescription) {
		this.description = {
			...baseDescription,
			version: 1,
			defaults: {
				name: 'درخوست HTTP',
				color: '#2200DD',
			},
			inputs: [NodeConnectionTypes.Main],
			outputs: [NodeConnectionTypes.Main],
			credentials: [
				// ----------------------------------
				//            v1 creds
				// ----------------------------------
				{
					name: 'httpBasicAuth',
					required: true,
					displayOptions: {
						show: {
							authentication: ['basicAuth'],
						},
					},
				},
				{
					name: 'httpDigestAuth',
					required: true,
					displayOptions: {
						show: {
							authentication: ['digestAuth'],
						},
					},
				},
				{
					name: 'httpHeaderAuth',
					required: true,
					displayOptions: {
						show: {
							authentication: ['headerAuth'],
						},
					},
				},
				{
					name: 'httpQueryAuth',
					required: true,
					displayOptions: {
						show: {
							authentication: ['queryAuth'],
						},
					},
				},
				{
					name: 'oAuth1Api',
					required: true,
					displayOptions: {
						show: {
							authentication: ['oAuth1'],
						},
					},
				},
				{
					name: 'oAuth2Api',
					required: true,
					displayOptions: {
						show: {
							authentication: ['oAuth2'],
						},
					},
				},
			],
			properties: [
				// ----------------------------------
				//           v1 params
				// ----------------------------------
				{
					displayName: 'احراز هویت',
					name: 'authentication',
					type: 'options',
					options: [
						{
							name: 'Basic Auth',
							value: 'basicAuth',
						},
						{
							name: 'Digest Auth',
							value: 'digestAuth',
						},
						{
							name: 'Header Auth',
							value: 'headerAuth',
						},
						{
							name: 'None',
							value: 'none',
						},
						{
							name: 'OAuth1',
							value: 'oAuth1',
						},
						{
							name: 'OAuth2',
							value: 'oAuth2',
						},
						{
							name: 'Query Auth',
							value: 'queryAuth',
						},
					],
					default: 'none',
					description: 'روش احراز هویت برای استفاده در این درخواست',
				},

				// ----------------------------------
				//        versionless params
				// ----------------------------------
				{
					displayName: 'متد درخواست (Request Method)',
					name: 'requestMethod',
					type: 'options',
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
							name: 'OPTIONS',
							value: 'OPTIONS',
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
					default: 'GET',
					description: 'روش درخواست برای استفاده',
				},
				{
					displayName: 'URL',
					name: 'url',
					type: 'string',
					default: '',
					placeholder: 'http://example.com/index.html',
					description: 'The URL to make the request to',
					required: true,
				},
				{
					displayName: 'نادیده گرفتن مشکلات SSL (ناامن)',
					name: 'allowUnauthorizedCerts',
					type: 'boolean',
					default: false,
					// eslint-disable-next-line n8n-nodes-base/node-param-description-wrong-for-ignore-ssl-issues
					description:
						'دانلود گواهی‌های SSL خودامضا شده یا نامعتبر و ادامه درخواست‌ها در هر صورت (ناامن)',
				},
				{
					displayName: 'فرمت پاسخ',
					name: 'responseFormat',
					type: 'options',
					options: [
						{
							name: 'فایل',
							value: 'file',
						},
						{
							name: 'JSON',
							value: 'json',
						},
						{
							name: 'رشته',
							value: 'string',
						},
					],
					default: 'json',
					description: 'فرمتی که پاسخ باید در آن بازگردانده شود',
				},
				{
					displayName: 'نام فیلد داده‌ها',
					name: 'dataPropertyName',
					type: 'string',
					default: 'data',
					required: true,
					displayOptions: {
						show: {
							responseFormat: ['string'],
						},
					},
					description: 'نام فیلد خروجی برای قرار دادن داده‌های پاسخ',
				},
				{
					displayName: 'قرار دادن فایل خروجی در فیلد',
					name: 'dataPropertyName',
					type: 'string',
					default: 'data',
					required: true,
					displayOptions: {
						show: {
							responseFormat: ['file'],
						},
					},
					hint: 'نام فیلد باینری خروجی که فایل در آن قرار می‌گیرد.',
				},

				{
					displayName: 'پارامترهای به صورت JSON/RAW',
					name: 'jsonParameters',
					type: 'boolean',
					default: false,
					description:
						'اینکه پارامتر query و/یا body باید از طریق رابط کاربری جفت مقدار-کلید (value-key) یا به صورت JSON/RAW تنظیم شود.',
				},

				{
					displayName: 'تنظیمات',
					name: 'options',
					type: 'collection',
					placeholder: 'اضافه کردن تنظیمات',
					default: {},
					options: [
						{
							displayName: 'فواصل دسته‌ای (Batch Intervals)',
							name: 'batchInterval',
							type: 'number',
							typeOptions: {
								minValue: 0,
							},
							default: 1000,
							description:
								'زمان (بر حسب میلی‌ثانیه) بین هر دسته از درخواست‌ها. مقدار ۰ به معنی غیرفعال بودن است.',
						},
						{
							displayName: ' اندازه دسته‌ای (Batch Size)',
							name: 'batchSize',
							type: 'number',
							typeOptions: {
								minValue: -1,
							},
							default: 50,
							description: 'حداکثر تعداد درخواست‌ها در هر دسته. مقدار -1 به معنی غیرفعال بودن است.',
						},
						{
							displayName: 'نوع محتوای بدنه (Body Content Type)',
							name: 'bodyContentType',
							type: 'options',
							displayOptions: {
								show: {
									'/requestMethod': ['PATCH', 'POST', 'PUT'],
								},
							},
							options: [
								{
									name: 'JSON',
									value: 'json',
								},
								{
									name: 'RAW/Custom',
									value: 'raw',
								},
								{
									name: 'Form-Data Multipart',
									value: 'multipart-form-data',
								},
								{
									name: 'Form Urlencoded',
									value: 'form-urlencoded',
								},
							],
							default: 'json',
							description: 'نوع محتوای بدنه که باید ارسال شود',
						},
						{
							displayName: 'پاسخ کامل',
							name: 'fullResponse',
							type: 'boolean',
							default: false,
							description: 'آیا کل داده‌های پاسخ برگردانده شود یا فقط بدنه آن',
						},
						{
							displayName: 'همه ریدایرکت‌ها را دنبال کن',
							name: 'followAllRedirects',
							type: 'boolean',
							default: false,
							description: 'آیا باید تمام ریدایرکت‌های HTTP را دنبال کند',
						},
						{
							displayName: 'ریدایرکت های Get/Head را دنبال کن',
							name: 'followRedirect',
							type: 'boolean',
							default: true,
							description: 'آیا ریدایرکت‌های HTTP 3xx برای GET یا HEAD دنبال شوند یا نه.',
						},
						{
							displayName: 'نادیده گرفتن کد وضعیت پاسخ',
							name: 'ignoreResponseCode',
							type: 'boolean',
							default: false,
							description:
								'آیا عملیات حتی زمانی که کد وضعیت غیر از 2xx است نیز موفقیت‌آمیز تلقی شود یا نه.',
						},
						{
							displayName: 'نوع فایل (Mime Type)',
							name: 'bodyContentCustomMimeType',
							type: 'string',
							default: '',
							placeholder: 'text/xml',
							description: 'نوع فایل سفارشی برای ارسال در صورت انتخاب RAW/Custom',
							displayOptions: {
								show: {
									'/requestMethod': ['PATCH', 'POST', 'PUT'],
								},
							},
						},
						{
							displayName: 'پروکسی',
							name: 'proxy',
							type: 'string',
							default: '',
							placeholder: 'http://myproxy:3128',
							description: 'HTTP proxy to use',
						},
						{
							displayName: 'تقسیم به آیتم‌ها',
							name: 'splitIntoItems',
							type: 'boolean',
							default: false,
							description: 'آیا هر عنصر از آرایه به عنوان آیتم جداگانه خروجی داده شود یا نه',
							displayOptions: {
								show: {
									'/responseFormat': ['json'],
								},
							},
						},
						{
							displayName: 'تایم اوت',
							name: 'timeout',
							type: 'number',
							typeOptions: {
								minValue: 1,
							},
							default: 10000,
							description:
								'زمان به میلی‌ثانیه برای انتظار دریافت هدرهای پاسخ از سرور (و شروع بدنه پاسخ) قبل از لغو درخواست.',
						},
						{
							displayName: 'استفاده از Query String',
							name: 'useQueryString',
							type: 'boolean',
							default: false,
							description:
								'آیا نیاز دارید آرایه‌ها به صورت foo=bar&foo=baz سریال شوند به جای حالت پیش‌فرض foo[0]=bar&foo[1]=baz',
						},
					],
				},

				// Body Parameter
				{
					displayName: 'ارسال داده‌های باینری به عنوان فایل',
					name: 'sendBinaryData',
					type: 'boolean',
					displayOptions: {
						show: {
							// TODO: Make it possible to use dot-notation
							// 'options.bodyContentType': [
							// 	'raw',
							// ],
							jsonParameters: [true],
							requestMethod: ['PATCH', 'POST', 'PUT'],
						},
					},
					default: false,
					description: 'آیا داده‌های باینری از ورودی به عنوان فایل ارسال شوند یا نه',
				},
				{
					displayName: 'فیلد باینری ورودی',
					name: 'binaryPropertyName',
					type: 'string',
					required: true,
					default: 'data',
					displayOptions: {
						hide: {
							sendBinaryData: [false],
						},
						show: {
							jsonParameters: [true],
							requestMethod: ['PATCH', 'POST', 'PUT'],
						},
					},
					hint: 'نام فیلد باینری ورودی که شامل داده فایل برای ارسال است.',
					description:
						'برای Form-Data Multipart، می‌توان آن‌ها را به فرمت زیر ارائه داد:<code>"sendKey1:binaryProperty1,sendKey2:binaryProperty2</code>',
				},
				{
					displayName: 'پارامترهای بدنه (Body Parameters)',
					name: 'bodyParametersJson',
					type: 'json',
					displayOptions: {
						hide: {
							sendBinaryData: [true],
						},
						show: {
							jsonParameters: [true],
							requestMethod: ['PATCH', 'POST', 'PUT', 'DELETE'],
						},
					},
					default: '',
					description: 'پارامترهای بدنه به صورت JSON یا RAW',
				},
				{
					displayName: 'پارامترهای بدنه (Body Parameters)',
					name: 'bodyParametersUi',
					placeholder: 'اضافه کردن پارامتر',
					type: 'fixedCollection',
					typeOptions: {
						multipleValues: true,
					},
					displayOptions: {
						show: {
							jsonParameters: [false],
							requestMethod: ['PATCH', 'POST', 'PUT', 'DELETE'],
						},
					},
					description: 'پارامترهای بدنه که باید ارسال شوند',
					default: {},
					options: [
						{
							name: 'parameter',
							displayName: 'پارامتر',
							values: [
								{
									displayName: 'نام',
									name: 'name',
									type: 'string',
									default: '',
									description: 'نام پارامتر',
								},
								{
									displayName: 'مقدار',
									name: 'value',
									type: 'string',
									default: '',
									description: 'مقدار پارامتر',
								},
							],
						},
					],
				},

				// Header Parameters
				{
					displayName: 'هدرها',
					name: 'headerParametersJson',
					type: 'json',
					displayOptions: {
						show: {
							jsonParameters: [true],
						},
					},
					default: '',
					description: 'پارامترهای هدر به صورت JSON (شیء مسطح)',
				},
				{
					displayName: 'هدرها',
					name: 'headerParametersUi',
					placeholder: 'اضافه کردن هدر',
					type: 'fixedCollection',
					typeOptions: {
						multipleValues: true,
					},
					displayOptions: {
						show: {
							jsonParameters: [false],
						},
					},
					description: 'هدرهایی که باید ارسال شوند',
					default: {},
					options: [
						{
							name: 'parameter',
							displayName: 'هدر',
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

				// Query Parameter
				{
					displayName: 'پارامترهای Query',
					name: 'queryParametersJson',
					type: 'json',
					displayOptions: {
						show: {
							jsonParameters: [true],
						},
					},
					default: '',
					description: 'پارامترهای query به صورت JSON یا RAW',
				},
				{
					displayName: 'پارامترهای Query',
					name: 'queryParametersUi',
					placeholder: 'اضافه کردن پارامتر',
					type: 'fixedCollection',
					typeOptions: {
						multipleValues: true,
					},
					displayOptions: {
						show: {
							jsonParameters: [false],
						},
					},
					description: 'پارامترهای query که باید ارسال شوند',
					default: {},
					options: [
						{
							name: 'parameter',
							displayName: 'پارامتر',
							values: [
								{
									displayName: 'نام',
									name: 'name',
									type: 'string',
									default: '',
									description: 'نام پارامتر',
								},
								{
									displayName: 'مقدار',
									name: 'value',
									type: 'string',
									default: '',
									description: 'مقدار پارامتر',
								},
							],
						},
					],
				},
				{
					displayName:
						'شما می‌توانید درخواست‌های خام این گره را در کنسول توسعه‌دهنده مرورگر خود مشاهده کنید',
					name: 'infoMessage',
					type: 'notice',
					default: '',
				},
			],
		};
	}

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		const fullResponseProperties = ['body', 'headers', 'statusCode', 'statusMessage'];

		const responseFormat = this.getNodeParameter('responseFormat', 0) as string;

		let httpBasicAuth;
		let httpDigestAuth;
		let httpHeaderAuth;
		let httpQueryAuth;
		let oAuth1Api;
		let oAuth2Api;

		try {
			httpBasicAuth = await this.getCredentials('httpBasicAuth');
		} catch {}
		try {
			httpDigestAuth = await this.getCredentials('httpDigestAuth');
		} catch {}
		try {
			httpHeaderAuth = await this.getCredentials('httpHeaderAuth');
		} catch {}
		try {
			httpQueryAuth = await this.getCredentials('httpQueryAuth');
		} catch {}
		try {
			oAuth1Api = await this.getCredentials('oAuth1Api');
		} catch {}
		try {
			oAuth2Api = await this.getCredentials('oAuth2Api');
		} catch {}

		let requestOptions: IRequestOptions;
		let setUiParameter: IDataObject;

		const uiParameters: IDataObject = {
			bodyParametersUi: 'body',
			headerParametersUi: 'headers',
			queryParametersUi: 'qs',
		};

		const jsonParameters: OptionDataParameters = {
			bodyParametersJson: {
				name: 'body',
				displayName: 'پارامترهای بدنه',
			},
			headerParametersJson: {
				name: 'headers',
				displayName: 'هدرها',
			},
			queryParametersJson: {
				name: 'qs',
				displayName: 'پارامترهای Query',
			},
		};
		let returnItems: INodeExecutionData[] = [];
		const requestPromises = [];
		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			const requestMethod = this.getNodeParameter(
				'requestMethod',
				itemIndex,
			) as IHttpRequestMethods;
			const parametersAreJson = this.getNodeParameter('jsonParameters', itemIndex);

			const options = this.getNodeParameter('options', itemIndex, {});
			const url = this.getNodeParameter('url', itemIndex) as string;

			if (!url.startsWith('http://') && !url.startsWith('https://')) {
				throw new NodeOperationError(
					this.getNode(),
					`Invalid URL: ${url}. URL must start with "http" or "https".`,
				);
			}

			const checkDomainRestrictions = async (
				credentialData: ICredentialDataDecryptedObject,
				url: string,
				credentialType?: string,
			) => {
				if (credentialData.allowedHttpRequestDomains === 'domains') {
					const allowedDomains = credentialData.allowedDomains as string;

					if (!allowedDomains || allowedDomains.trim() === '') {
						throw new NodeOperationError(
							this.getNode(),
							'No allowed domains specified. Configure allowed domains or change restriction setting.',
						);
					}

					if (!isDomainAllowed(url, { allowedDomains })) {
						const credentialInfo = credentialType ? ` (${credentialType})` : '';
						throw new NodeOperationError(
							this.getNode(),
							`Domain not allowed: This credential${credentialInfo} is restricted from accessing ${url}. ` +
								`Only the following domains are allowed: ${allowedDomains}`,
						);
					}
				} else if (credentialData.allowedHttpRequestDomains === 'none') {
					throw new NodeOperationError(
						this.getNode(),
						'This credential is configured to prevent use within an HTTP Request node',
					);
				}
			};

			if (httpBasicAuth) await checkDomainRestrictions(httpBasicAuth, url);
			if (httpDigestAuth) await checkDomainRestrictions(httpDigestAuth, url);
			if (httpHeaderAuth) await checkDomainRestrictions(httpHeaderAuth, url);
			if (httpQueryAuth) await checkDomainRestrictions(httpQueryAuth, url);
			if (oAuth1Api) await checkDomainRestrictions(oAuth1Api, url);
			if (oAuth2Api) await checkDomainRestrictions(oAuth2Api, url);

			if (
				itemIndex > 0 &&
				(options.batchSize as number) >= 0 &&
				(options.batchInterval as number) > 0
			) {
				// defaults batch size to 1 of it's set to 0
				const batchSize: number =
					(options.batchSize as number) > 0 ? (options.batchSize as number) : 1;
				if (itemIndex % batchSize === 0) {
					await sleep(options.batchInterval as number);
				}
			}

			const fullResponse = !!options.fullResponse;

			requestOptions = {
				headers: {},
				method: requestMethod,
				uri: url,
				gzip: true,
				rejectUnauthorized: !this.getNodeParameter('allowUnauthorizedCerts', itemIndex, false),
			} satisfies IRequestOptions;

			if (fullResponse) {
				requestOptions.resolveWithFullResponse = true;
			}

			if (options.followRedirect !== undefined) {
				requestOptions.followRedirect = options.followRedirect as boolean;
			}

			if (options.followAllRedirects !== undefined) {
				requestOptions.followAllRedirects = options.followAllRedirects as boolean;
			}

			if (options.ignoreResponseCode === true) {
				requestOptions.simple = false;
			}
			if (options.proxy !== undefined) {
				requestOptions.proxy = options.proxy as string;
			}
			if (options.timeout !== undefined) {
				requestOptions.timeout = options.timeout as number;
			} else {
				requestOptions.timeout = 3600000; // 1 hour
			}

			if (options.useQueryString === true) {
				requestOptions.useQuerystring = true;
			}

			if (parametersAreJson) {
				// Parameters are defined as JSON
				let optionData: OptionData;
				for (const parameterName of Object.keys(jsonParameters)) {
					optionData = jsonParameters[parameterName];
					const tempValue = this.getNodeParameter(parameterName, itemIndex, '') as string | object;
					const sendBinaryData = this.getNodeParameter(
						'sendBinaryData',
						itemIndex,
						false,
					) as boolean;

					if (optionData.name === 'body' && parametersAreJson) {
						if (sendBinaryData) {
							const contentTypesAllowed = ['raw', 'multipart-form-data'];

							if (!contentTypesAllowed.includes(options.bodyContentType as string)) {
								// As n8n-workflow.NodeHelpers.getParameterResolveOrder can not be changed
								// easily to handle parameters in dot.notation simply error for now.
								throw new NodeOperationError(
									this.getNode(),
									'Sending binary data is only supported when option "Body Content Type" is set to "RAW/CUSTOM" or "FORM-DATA/MULTIPART"!',
									{ itemIndex },
								);
							}

							if (options.bodyContentType === 'raw') {
								const binaryPropertyName = this.getNodeParameter('binaryPropertyName', itemIndex);
								this.helpers.assertBinaryData(itemIndex, binaryPropertyName);
								const binaryDataBuffer = await this.helpers.getBinaryDataBuffer(
									itemIndex,
									binaryPropertyName,
								);
								requestOptions.body = binaryDataBuffer;
							} else if (options.bodyContentType === 'multipart-form-data') {
								requestOptions.body = {};
								const binaryPropertyNameFull = this.getNodeParameter(
									'binaryPropertyName',
									itemIndex,
								);
								const binaryPropertyNames = binaryPropertyNameFull
									.split(',')
									.map((key) => key.trim());

								for (const propertyData of binaryPropertyNames) {
									let propertyName = 'file';
									let binaryPropertyName = propertyData;
									if (propertyData.includes(':')) {
										const propertyDataParts = propertyData.split(':');
										propertyName = propertyDataParts[0];
										binaryPropertyName = propertyDataParts[1];
									} else if (binaryPropertyNames.length > 1) {
										throw new NodeOperationError(
											this.getNode(),
											'If more than one property should be send it is needed to define the in the format:<code>"sendKey1:binaryProperty1,sendKey2:binaryProperty2"</code>',
											{ itemIndex },
										);
									}

									const binaryData = this.helpers.assertBinaryData(itemIndex, binaryPropertyName);
									const binaryDataBuffer = await this.helpers.getBinaryDataBuffer(
										itemIndex,
										binaryPropertyName,
									);

									requestOptions.body[propertyName] = {
										value: binaryDataBuffer,
										options: {
											filename: binaryData.fileName,
											contentType: binaryData.mimeType,
										},
									};
								}
							}
							continue;
						}
					}

					if (tempValue === '') {
						// Parameter is empty so skip it
						continue;
					}

					// @ts-ignore
					requestOptions[optionData.name] = tempValue;

					if (
						// @ts-ignore
						typeof requestOptions[optionData.name] !== 'object' &&
						options.bodyContentType !== 'raw'
					) {
						// If it is not an object && bodyContentType is not 'raw' it must be JSON so parse it
						try {
							// @ts-ignore
							requestOptions[optionData.name] = JSON.parse(
								requestOptions[optionData.name as IRequestOptionsKeys] as string,
							);
						} catch (error) {
							throw new NodeOperationError(
								this.getNode(),
								`The data in "${optionData.displayName}" is no valid JSON. Set Body Content Type to "RAW/Custom" for XML or other types of payloads`,
								{ itemIndex },
							);
						}
					}
				}
			} else {
				// Parameters are defined in UI
				let optionName: string;
				for (const parameterName of Object.keys(uiParameters)) {
					setUiParameter = this.getNodeParameter(parameterName, itemIndex, {}) as IDataObject;
					optionName = uiParameters[parameterName] as string;
					if (setUiParameter.parameter !== undefined) {
						// @ts-ignore
						requestOptions[optionName] = {};
						for (const parameterData of setUiParameter!.parameter as IDataObject[]) {
							const parameterDataName = parameterData.name as string;
							const newValue = parameterData.value;
							if (optionName === 'qs') {
								const computeNewValue = (oldValue: unknown) => {
									if (typeof oldValue === 'string') {
										return [oldValue, newValue];
									} else if (Array.isArray(oldValue)) {
										return [...oldValue, newValue];
									} else {
										return newValue;
									}
								};
								requestOptions[optionName]![parameterDataName] = computeNewValue(
									requestOptions[optionName]![parameterDataName],
								);
							} else if (optionName === 'headers') {
								// @ts-ignore
								requestOptions[optionName][parameterDataName.toString().toLowerCase()] = newValue;
							} else {
								// @ts-ignore
								requestOptions[optionName][parameterDataName] = newValue;
							}
						}
					}
				}
			}

			// Change the way data get send in case a different content-type than JSON got selected
			if (['PATCH', 'POST', 'PUT'].includes(requestMethod)) {
				if (options.bodyContentType === 'multipart-form-data') {
					requestOptions.formData = requestOptions.body;
					delete requestOptions.body;
				} else if (options.bodyContentType === 'form-urlencoded') {
					requestOptions.form = requestOptions.body;
					delete requestOptions.body;
				}
			}

			if (responseFormat === 'file') {
				requestOptions.encoding = null;
				requestOptions.useStream = true;

				if (options.bodyContentType !== 'raw') {
					requestOptions.body = JSON.stringify(requestOptions.body);
					if (requestOptions.headers === undefined) {
						requestOptions.headers = {};
					}
					if (['POST', 'PUT', 'PATCH'].includes(requestMethod)) {
						requestOptions.headers['Content-Type'] = 'application/json';
					}
				}
			} else if (options.bodyContentType === 'raw') {
				requestOptions.json = false;
				requestOptions.useStream = true;
			} else {
				requestOptions.json = true;
			}

			// Add Content Type if any are set
			if (options.bodyContentCustomMimeType) {
				if (requestOptions.headers === undefined) {
					requestOptions.headers = {};
				}
				requestOptions.headers['Content-Type'] = options.bodyContentCustomMimeType;
			}

			const authDataKeys: IAuthDataSanitizeKeys = {};

			// Add credentials if any are set
			if (httpBasicAuth !== undefined) {
				requestOptions.auth = {
					user: httpBasicAuth.user as string,
					pass: httpBasicAuth.password as string,
				};
				authDataKeys.auth = ['pass'];
			}
			if (httpHeaderAuth !== undefined) {
				requestOptions.headers![httpHeaderAuth.name as string] = httpHeaderAuth.value;
				authDataKeys.headers = [httpHeaderAuth.name as string];
			}
			if (httpQueryAuth !== undefined) {
				if (!requestOptions.qs) {
					requestOptions.qs = {};
				}
				requestOptions.qs[httpQueryAuth.name as string] = httpQueryAuth.value;
				authDataKeys.qs = [httpQueryAuth.name as string];
			}
			if (httpDigestAuth !== undefined) {
				requestOptions.auth = {
					user: httpDigestAuth.user as string,
					pass: httpDigestAuth.password as string,
					sendImmediately: false,
				};
				authDataKeys.auth = ['pass'];
			}

			if (requestOptions.headers!.accept === undefined) {
				if (responseFormat === 'json') {
					requestOptions.headers!.accept = 'application/json,text/*;q=0.99';
				} else if (responseFormat === 'string') {
					requestOptions.headers!.accept =
						'application/json,text/html,application/xhtml+xml,application/xml,text/*;q=0.9, */*;q=0.1';
				} else {
					requestOptions.headers!.accept =
						'application/json,text/html,application/xhtml+xml,application/xml,text/*;q=0.9, image/*;q=0.8, */*;q=0.7';
				}
			}

			try {
				this.sendMessageToUI(sanitizeUiMessage(requestOptions, authDataKeys));
			} catch (e) {}

			if (oAuth1Api) {
				const requestOAuth1 = this.helpers.requestOAuth1.call(this, 'oAuth1Api', requestOptions);
				requestOAuth1.catch(() => {});
				requestPromises.push(requestOAuth1);
			} else if (oAuth2Api) {
				const requestOAuth2 = this.helpers.requestOAuth2.call(this, 'oAuth2Api', requestOptions, {
					tokenType: 'Bearer',
				});
				requestOAuth2.catch(() => {});
				requestPromises.push(requestOAuth2);
			} else {
				// bearerAuth, queryAuth, headerAuth, digestAuth, none
				const request = this.helpers.request(requestOptions);
				request.catch(() => {});
				requestPromises.push(request);
			}
		}

		const promisesResponses = await Promise.allSettled(requestPromises);

		let response: any;
		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			response = promisesResponses.shift();

			if (response!.status !== 'fulfilled') {
				if (!this.continueOnFail()) {
					// throw error;
					throw new NodeApiError(this.getNode(), response as JsonObject, { itemIndex });
				} else {
					removeCircularRefs(response.reason as JsonObject);
					// Return the actual reason as error
					returnItems.push({
						json: {
							error: response.reason,
						},
						pairedItem: {
							item: itemIndex,
						},
					});
					continue;
				}
			}

			response = response.value;
			if (response?.request?.constructor.name === 'ClientRequest') delete response.request;

			const options = this.getNodeParameter('options', itemIndex, {});

			const fullResponse = !!options.fullResponse;

			if (responseFormat === 'file') {
				const dataPropertyName = this.getNodeParameter('dataPropertyName', 0);

				const newItem: INodeExecutionData = {
					json: {},
					binary: {},
					pairedItem: {
						item: itemIndex,
					},
				};

				if (items[itemIndex].binary !== undefined) {
					// Create a shallow copy of the binary data so that the old
					// data references which do not get changed still stay behind
					// but the incoming data does not get changed.
					// @ts-ignore
					Object.assign(newItem.binary, items[itemIndex].binary);
				}

				let binaryData: Buffer | Readable;
				if (fullResponse) {
					const returnItem: IDataObject = {};
					for (const property of fullResponseProperties) {
						if (property === 'body') {
							continue;
						}
						returnItem[property] = response![property];
					}

					newItem.json = returnItem;
					binaryData = response!.body;
				} else {
					newItem.json = items[itemIndex].json;
					binaryData = response;
				}

				newItem.binary![dataPropertyName] = await this.helpers.prepareBinaryData(binaryData);
				returnItems.push(newItem);
			} else if (responseFormat === 'string') {
				const dataPropertyName = this.getNodeParameter('dataPropertyName', 0);

				if (fullResponse) {
					const returnItem: IDataObject = {};
					for (const property of fullResponseProperties) {
						if (property === 'body') {
							returnItem[dataPropertyName] = response![property];
							continue;
						}

						returnItem[property] = response![property];
					}
					returnItems.push({
						json: returnItem,
						pairedItem: {
							item: itemIndex,
						},
					});
				} else {
					returnItems.push({
						json: {
							[dataPropertyName]: response,
						},
						pairedItem: {
							item: itemIndex,
						},
					});
				}
			} else {
				// responseFormat: 'json'
				if (fullResponse) {
					const returnItem: IDataObject = {};
					for (const property of fullResponseProperties) {
						returnItem[property] = response![property];
					}

					if (responseFormat === 'json' && typeof returnItem.body === 'string') {
						try {
							returnItem.body = JSON.parse(returnItem.body);
						} catch (error) {
							throw new NodeOperationError(
								this.getNode(),
								'Response body is not valid JSON. Change "Response Format" to "String"',
								{ itemIndex },
							);
						}
					}

					returnItems.push({
						json: returnItem,
						pairedItem: {
							item: itemIndex,
						},
					});
				} else {
					if (responseFormat === 'json' && typeof response === 'string') {
						try {
							response = JSON.parse(response);
						} catch (error) {
							throw new NodeOperationError(
								this.getNode(),
								'Response body is not valid JSON. Change "Response Format" to "String"',
								{ itemIndex },
							);
						}
					}

					if (options.splitIntoItems === true && Array.isArray(response)) {
						response.forEach((item) =>
							returnItems.push({
								json: item,
								pairedItem: {
									item: itemIndex,
								},
							}),
						);
					} else {
						returnItems.push({
							json: response,
							pairedItem: {
								item: itemIndex,
							},
						});
					}
				}
			}
		}

		returnItems = returnItems.map(replaceNullValues);

		return [returnItems];
	}
}
