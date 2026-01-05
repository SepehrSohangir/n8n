import type { BinaryToTextEncoding } from 'crypto';
import { createHash, createHmac, createSign, getHashes, randomBytes } from 'crypto';
import set from 'lodash/set';
import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';
import { deepCopy, BINARY_ENCODING, NodeConnectionTypes } from 'n8n-workflow';
import { pipeline } from 'stream/promises';
import { v4 as uuid } from 'uuid';

const unsupportedAlgorithms = [
	'RSA-MD4',
	'RSA-MDC2',
	'md4',
	'md4WithRSAEncryption',
	'mdc2',
	'mdc2WithRSA',
];

const supportedAlgorithms = getHashes()
	.filter((algorithm) => !unsupportedAlgorithms.includes(algorithm))
	.map((algorithm) => ({ name: algorithm, value: algorithm }));

export class Crypto implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'رمزنگاری',
		name: 'crypto',
		icon: 'fa:key',
		iconColor: 'green',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["action"]}}',
		description: 'ارائه ابزارهای رمزنگاری',
		defaults: {
			name: 'رمزنگاری',
			color: '#408000',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		properties: [
			{
				displayName: 'عملیات',
				name: 'action',
				type: 'options',
				options: [
					{
						name: 'تولید',
						description: 'تولید رشته تصادفی',
						value: 'generate',
						action: 'تولید رشته تصادفی',
					},
					{
						name: 'هش',
						description: 'هش کردن یک متن یا فایل در فرمت مشخص شده',
						value: 'hash',
						action: 'هش کردن یک متن یا فایل در فرمت مشخص شده',
					},
					{
						name: 'Hmac',
						description: 'Hmac کردن یک متن یا فایل در فرمت مشخص شده',
						value: 'hmac',
						action: 'HMAC کردن یک متن یا فایل در فرمت مشخص شده',
					},
					{
						name: 'امضا',
						description: 'امضای یک رشته با استفاده از کلید خصوصی',
						value: 'sign',
						action: 'امضای یک رشته با استفاده از کلید خصوصی',
					},
				],
				default: 'hash',
			},
			{
				displayName: 'نوع',
				name: 'type',
				displayOptions: {
					show: {
						action: ['hash'],
					},
				},
				type: 'options',
				options: [
					{
						name: 'MD5',
						value: 'MD5',
					},
					{
						name: 'SHA256',
						value: 'SHA256',
					},
					{
						name: 'SHA3-256',
						value: 'SHA3-256',
					},
					{
						name: 'SHA3-384',
						value: 'SHA3-384',
					},
					{
						name: 'SHA3-512',
						value: 'SHA3-512',
					},
					{
						name: 'SHA384',
						value: 'SHA384',
					},
					{
						name: 'SHA512',
						value: 'SHA512',
					},
				],
				default: 'MD5',
				description: 'نوع هش برای استفاده',
				required: true,
			},
			{
				displayName: 'فایل باینری',
				name: 'binaryData',
				type: 'boolean',
				default: false,
				required: true,
				displayOptions: {
					show: {
						action: ['hash', 'hmac'],
					},
				},
				description: 'آیا داده‌های هش شده از فیلد باینری گرفته شوند',
			},
			{
				displayName: 'نام ویژگی باینری',
				name: 'binaryPropertyName',
				displayOptions: {
					show: {
						action: ['hash', 'hmac'],
						binaryData: [true],
					},
				},
				type: 'string',
				default: 'data',
				description: 'نام ویژگی باینری که حاوی داده‌های ورودی است',
				required: true,
			},
			{
				displayName: 'مقدار',
				name: 'value',
				displayOptions: {
					show: {
						action: ['hash'],
						binaryData: [false],
					},
				},
				type: 'string',
				default: '',
				description: 'مقداری که باید هش شود',
				required: true,
			},
			{
				displayName: 'نام ویژگی',
				name: 'dataPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				displayOptions: {
					show: {
						action: ['hash'],
					},
				},
				description: 'نام ویژگی برای نوشتن هش در آن',
			},
			{
				displayName: 'کدگذاری',
				name: 'encoding',
				displayOptions: {
					show: {
						action: ['hash'],
					},
				},
				type: 'options',
				options: [
					{
						name: 'BASE64',
						value: 'base64',
					},
					{
						name: 'HEX',
						value: 'hex',
					},
				],
				default: 'hex',
				required: true,
			},
			{
				displayName: 'نوع',
				name: 'type',
				displayOptions: {
					show: {
						action: ['hmac'],
					},
				},
				type: 'options',
				options: [
					{
						name: 'MD5',
						value: 'MD5',
					},
					{
						name: 'SHA256',
						value: 'SHA256',
					},
					{
						name: 'SHA3-256',
						value: 'SHA3-256',
					},
					{
						name: 'SHA3-384',
						value: 'SHA3-384',
					},
					{
						name: 'SHA3-512',
						value: 'SHA3-512',
					},
					{
						name: 'SHA384',
						value: 'SHA384',
					},
					{
						name: 'SHA512',
						value: 'SHA512',
					},
				],
				default: 'MD5',
				description: 'نوع هش برای استفاده',
				required: true,
			},
			{
				displayName: 'مقدار',
				name: 'value',
				displayOptions: {
					show: {
						action: ['hmac'],
						binaryData: [false],
					},
				},
				type: 'string',
				default: '',
				description: 'مقداری که hmac آن باید ایجاد شود',
				required: true,
			},
			{
				displayName: 'نام ویژگی',
				name: 'dataPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				displayOptions: {
					show: {
						action: ['hmac'],
					},
				},
				description: 'نام ویژگی برای نوشتن hmac در آن',
			},
			{
				displayName: 'راز',
				name: 'secret',
				displayOptions: {
					show: {
						action: ['hmac'],
					},
				},
				type: 'string',
				typeOptions: { password: true },
				default: '',
				required: true,
			},
			{
				displayName: 'کدگذاری',
				name: 'encoding',
				displayOptions: {
					show: {
						action: ['hmac'],
					},
				},
				type: 'options',
				options: [
					{
						name: 'BASE64',
						value: 'base64',
					},
					{
						name: 'HEX',
						value: 'hex',
					},
				],
				default: 'hex',
				required: true,
			},
			{
				displayName: 'مقدار',
				name: 'value',
				displayOptions: {
					show: {
						action: ['sign'],
					},
				},
				type: 'string',
				default: '',
				description: 'مقداری که باید امضا شود',
				required: true,
			},
			{
				displayName: 'نام ویژگی',
				name: 'dataPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				displayOptions: {
					show: {
						action: ['sign'],
					},
				},
				description: 'نام ویژگی برای نوشتن مقدار امضا شده در آن',
			},
			{
				displayName: 'نام یا شناسه الگوریتم',
				name: 'algorithm',
				displayOptions: {
					show: {
						action: ['sign'],
					},
				},
				type: 'options',
				description:
					'از لیست انتخاب کنید، یا با استفاده از یک <a href="https://docs.n8n.io/code/expressions/">عبارت</a> یک شناسه مشخص کنید',
				options: supportedAlgorithms,
				default: '',
				required: true,
			},
			{
				displayName: 'کدگذاری',
				name: 'encoding',
				displayOptions: {
					show: {
						action: ['sign'],
					},
				},
				type: 'options',
				options: [
					{
						name: 'BASE64',
						value: 'base64',
					},
					{
						name: 'HEX',
						value: 'hex',
					},
				],
				default: 'hex',
				required: true,
			},
			{
				displayName: 'کلید خصوصی',
				name: 'privateKey',
				displayOptions: {
					show: {
						action: ['sign'],
					},
				},
				type: 'string',
				description: 'کلید خصوصی برای استفاده هنگام امضای رشته',
				default: '',
				required: true,
			},
			{
				displayName: 'نام ویژگی',
				name: 'dataPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				displayOptions: {
					show: {
						action: ['generate'],
					},
				},
				description: 'نام ویژگی برای نوشتن رشته تصادفی در آن',
			},
			{
				displayName: 'نوع',
				name: 'encodingType',
				displayOptions: {
					show: {
						action: ['generate'],
					},
				},
				type: 'options',
				options: [
					{
						name: 'ASCII',
						value: 'ascii',
					},
					{
						name: 'BASE64',
						value: 'base64',
					},
					{
						name: 'HEX',
						value: 'hex',
					},
					{
						name: 'UUID',
						value: 'uuid',
					},
				],
				default: 'uuid',
				description: 'کدگذاری که برای تولید رشته استفاده خواهد شد',
				required: true,
			},
			{
				displayName: 'طول',
				name: 'stringLength',
				type: 'number',
				default: 32,
				description: 'طول رشته تولید شده',
				displayOptions: {
					show: {
						action: ['generate'],
						encodingType: ['ascii', 'base64', 'hex'],
					},
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		const returnData: INodeExecutionData[] = [];
		const length = items.length;
		const action = this.getNodeParameter('action', 0) as string;

		let item: INodeExecutionData;
		for (let i = 0; i < length; i++) {
			try {
				item = items[i];
				const dataPropertyName = this.getNodeParameter('dataPropertyName', i);
				const value = this.getNodeParameter('value', i, '') as string;
				let newValue;
				let binaryProcessed = false;

				if (action === 'generate') {
					const encodingType = this.getNodeParameter('encodingType', i);
					if (encodingType === 'uuid') {
						newValue = uuid();
					} else {
						const stringLength = this.getNodeParameter('stringLength', i) as number;
						if (encodingType === 'base64') {
							newValue = randomBytes(stringLength)
								.toString(encodingType as BufferEncoding)
								.replace(/\W/g, '')
								.slice(0, stringLength);
						} else {
							newValue = randomBytes(stringLength)
								.toString(encodingType as BufferEncoding)
								.slice(0, stringLength);
						}
					}
				}

				if (action === 'hash' || action === 'hmac') {
					const type = this.getNodeParameter('type', i) as string;
					const encoding = this.getNodeParameter('encoding', i) as BinaryToTextEncoding;
					const hashOrHmac =
						action === 'hash'
							? createHash(type)
							: createHmac(type, this.getNodeParameter('secret', i) as string);
					if (this.getNodeParameter('binaryData', i)) {
						const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i);
						const binaryData = this.helpers.assertBinaryData(i, binaryPropertyName);
						if (binaryData.id) {
							const binaryStream = await this.helpers.getBinaryStream(binaryData.id);
							hashOrHmac.setEncoding(encoding);
							await pipeline(binaryStream, hashOrHmac);
							newValue = hashOrHmac.read();
						} else {
							newValue = hashOrHmac
								.update(Buffer.from(binaryData.data, BINARY_ENCODING))
								.digest(encoding);
						}
						binaryProcessed = true;
					} else {
						newValue = hashOrHmac.update(value).digest(encoding);
					}
				}

				if (action === 'sign') {
					const algorithm = this.getNodeParameter('algorithm', i) as string;
					const encoding = this.getNodeParameter('encoding', i) as BinaryToTextEncoding;
					const privateKey = this.getNodeParameter('privateKey', i) as string;
					const sign = createSign(algorithm);
					sign.write(value);
					sign.end();
					newValue = sign.sign(privateKey, encoding);
				}

				let newItem: INodeExecutionData;
				if (dataPropertyName.includes('.')) {
					// Uses dot notation so copy all data
					newItem = {
						json: deepCopy(item.json),
						pairedItem: {
							item: i,
						},
					};
				} else {
					// Does not use dot notation so shallow copy is enough
					newItem = {
						json: { ...item.json },
						pairedItem: {
							item: i,
						},
					};
				}

				if (item.binary !== undefined && !binaryProcessed) {
					newItem.binary = item.binary;
				}

				set(newItem, ['json', dataPropertyName], newValue);

				returnData.push(newItem);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: (error as JsonObject).message,
						},
						pairedItem: {
							item: i,
						},
					});
					continue;
				}
				throw error;
			}
		}
		return [returnData];
	}
}
