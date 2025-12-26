import * as fflate from 'fflate';
import * as mime from 'mime-types';
import {
	NodeConnectionTypes,
	NodeOperationError,
	type IBinaryKeyData,
	type IExecuteFunctions,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
} from 'n8n-workflow';
import { promisify } from 'util';

const gunzip = promisify(fflate.gunzip);
const gzip = promisify(fflate.gzip);
const unzip = promisify(fflate.unzip);
const zip = promisify(fflate.zip);

const ALREADY_COMPRESSED = [
	'7z',
	'aifc',
	'bz2',
	'doc',
	'docx',
	'gif',
	'gz',
	'heic',
	'heif',
	'jpg',
	'jpeg',
	'mov',
	'mp3',
	'mp4',
	'pdf',
	'png',
	'ppt',
	'pptx',
	'rar',
	'webm',
	'webp',
	'xls',
	'xlsx',
	'zip',
];

export class Compression implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'فشرده‌سازی',
		name: 'compression',
		icon: 'fa:file-archive',
		iconColor: 'green',
		group: ['transform'],
		subtitle: '={{$parameter["operation"]}}',
		version: [1, 1.1],
		description: 'فشرده‌سازی و از حالت فشرده خارج کردن فایل‌ها',
		defaults: {
			name: 'فشرده‌سازی',
			color: '#408000',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		properties: [
			{
				displayName: 'عملیات',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'فشرده‌سازی',
						value: 'compress',
						action: 'فشرده‌سازی فایل(ها)',
						description: 'فشرده‌سازی فایل‌ها در یک آرشیو zip یا gzip',
					},
					{
						name: 'از حالت فشرده خارج کردن',
						value: 'decompress',
						action: 'از حالت فشرده خارج کردن فایل(ها)',
						description: 'از حالت فشرده خارج کردن آرشیوهای zip یا gzip',
					},
				],
				default: 'decompress',
			},
			{
				displayName: 'فیلد(های) باینری ورودی',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				displayOptions: {
					show: {
						operation: ['compress'],
					},
				},
				placeholder: 'مثلاً data,data2,data3',
				hint: 'نام فیلد(های) باینری ورودی حاوی فایل(ها) برای فشرده‌سازی',
				description:
					'برای پردازش بیش از یک فایل، از یک لیست جدا شده با کاما از نام فیلدهای باینری استفاده کنید',
			},
			{
				displayName: 'فیلد(های) باینری ورودی',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				displayOptions: {
					show: {
						operation: ['decompress'],
					},
				},
				placeholder: 'مثلاً data',
				hint: 'نام فیلد(های) باینری ورودی حاوی فایل(ها) برای از حالت فشرده خارج کردن',
				description:
					'برای پردازش بیش از یک فایل، از یک لیست جدا شده با کاما از نام فیلدهای باینری استفاده کنید',
			},
			{
				displayName: 'فرمت خروجی',
				name: 'outputFormat',
				type: 'options',
				default: '',
				options: [
					{
						name: 'Gzip',
						value: 'gzip',
					},
					{
						name: 'Zip',
						value: 'zip',
					},
				],
				displayOptions: {
					show: {
						operation: ['compress'],
						'@version': [1],
					},
				},
				description: 'فرمت خروجی',
			},
			{
				displayName: 'فرمت خروجی',
				name: 'outputFormat',
				type: 'options',
				default: 'zip',
				options: [
					{
						name: 'Gzip',
						value: 'gzip',
					},
					{
						name: 'Zip',
						value: 'zip',
					},
				],
				displayOptions: {
					show: {
						operation: ['compress'],
					},
					hide: {
						'@version': [1],
					},
				},
				description: 'فرمت خروجی',
			},
			{
				displayName: 'نام فایل',
				name: 'fileName',
				type: 'string',
				default: '',
				placeholder: 'مثلاً data.zip',
				required: true,
				displayOptions: {
					show: {
						operation: ['compress'],
						outputFormat: ['zip'],
					},
				},
				description: 'نام فایل خروجی',
			},
			{
				displayName: 'قرار دادن فایل خروجی در فیلد',
				name: 'binaryPropertyOutput',
				type: 'string',
				default: 'data',
				displayOptions: {
					show: {
						outputFormat: ['zip'],
						operation: ['compress'],
					},
				},
				hint: 'نام فیلد باینری خروجی برای قرار دادن فایل در آن',
			},
			{
				displayName: 'نام فایل',
				name: 'fileName',
				type: 'string',
				default: '',
				placeholder: 'مثلاً data.txt',
				displayOptions: {
					show: {
						operation: ['compress'],
						outputFormat: ['gzip'],
					},
					hide: {
						'@version': [1],
					},
				},
				description: 'نام فایل خروجی',
			},
			{
				displayName: 'قرار دادن فایل خروجی در فیلد',
				name: 'binaryPropertyOutput',
				type: 'string',
				default: 'data',
				displayOptions: {
					show: {
						outputFormat: ['gzip'],
						operation: ['compress'],
					},
					hide: {
						'@version': [1],
					},
				},
				hint: 'نام فیلد باینری خروجی برای قرار دادن فایل در آن',
			},
			{
				displayName: 'پیشوند فایل خروجی',
				name: 'outputPrefix',
				type: 'string',
				default: 'data',
				required: true,
				displayOptions: {
					show: {
						operation: ['compress'],
						outputFormat: ['gzip'],
						'@version': [1],
					},
				},
				description: 'پیشوند برای اضافه کردن به فایل gzip',
			},
			{
				displayName: 'پیشوند خروجی',
				name: 'outputPrefix',
				type: 'string',
				default: 'file_',
				required: true,
				displayOptions: {
					show: {
						operation: ['decompress'],
					},
				},
				description: 'پیشوند برای اضافه کردن به فایل‌های از حالت فشرده خارج شده',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const length = items.length;
		const returnData: INodeExecutionData[] = [];
		const operation = this.getNodeParameter('operation', 0);
		const nodeVersion = this.getNode().typeVersion;

		for (let i = 0; i < length; i++) {
			try {
				if (operation === 'decompress') {
					const binaryPropertyNames = this.getNodeParameter('binaryPropertyName', 0)
						.split(',')
						.map((key) => key.trim());

					const outputPrefix = this.getNodeParameter('outputPrefix', 0) as string;

					const binaryObject: IBinaryKeyData = {};

					let zipIndex = 0;

					for (const [index, binaryPropertyName] of binaryPropertyNames.entries()) {
						const binaryData = this.helpers.assertBinaryData(i, binaryPropertyName);
						const binaryDataBuffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);
						const fileExtension = binaryData.fileExtension?.toLowerCase();

						if (!fileExtension) {
							throw new NodeOperationError(
								this.getNode(),
								`File extension not found for binary data ${binaryPropertyName}`,
							);
						}

						if (fileExtension === 'zip') {
							const files = await unzip(binaryDataBuffer);

							for (const key of Object.keys(files)) {
								// when files are compressed using MACOSX for some reason they are duplicated under __MACOSX
								if (key.includes('__MACOSX')) {
									continue;
								}

								const data = await this.helpers.prepareBinaryData(
									Buffer.from(files[key].buffer),
									key,
								);

								binaryObject[`${outputPrefix}${zipIndex++}`] = data;
							}
						} else if (['gz', 'gzip'].includes(fileExtension)) {
							const file = await gunzip(binaryDataBuffer);

							const fileName = binaryData.fileName?.split('.')[0];
							let fileExtension;
							let mimeType;

							if (binaryData.fileName?.endsWith('.gz')) {
								const extractedFileExtension = binaryData.fileName.replace('.gz', '').split('.');
								if (extractedFileExtension.length > 1) {
									fileExtension = extractedFileExtension[extractedFileExtension.length - 1];
									mimeType = mime.lookup(fileExtension) as string;
								}
							}

							const propertyName = `${outputPrefix}${index}`;

							binaryObject[propertyName] = await this.helpers.prepareBinaryData(
								Buffer.from(file.buffer),
								fileName,
								mimeType,
							);

							if (!fileExtension) {
								mimeType = binaryObject[propertyName].mimeType;
								fileExtension = mime.extension(mimeType) as string;
							}

							binaryObject[propertyName].fileName = `${fileName}.${fileExtension}`;
							binaryObject[propertyName].fileExtension = fileExtension;
							binaryObject[propertyName].mimeType = mimeType as string;
						}
					}

					returnData.push({
						json: items[i].json,
						binary: binaryObject,
						pairedItem: {
							item: i,
						},
					});
				}

				if (operation === 'compress') {
					let binaryPropertyNameIndex = 0;
					if (nodeVersion > 1) {
						binaryPropertyNameIndex = i;
					}

					const binaryPropertyNames = this.getNodeParameter(
						'binaryPropertyName',
						binaryPropertyNameIndex,
					)
						.split(',')
						.map((key) => key.trim());

					const outputFormat = this.getNodeParameter('outputFormat', 0) as string;

					const zipData: fflate.Zippable = {};
					const binaryObject: IBinaryKeyData = {};

					for (const [index, binaryPropertyName] of binaryPropertyNames.entries()) {
						const binaryData = this.helpers.assertBinaryData(i, binaryPropertyName);
						const binaryDataBuffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);

						if (outputFormat === 'zip') {
							zipData[binaryData.fileName as string] = [
								binaryDataBuffer,
								{
									level: ALREADY_COMPRESSED.includes(binaryData.fileExtension as string) ? 0 : 6,
								},
							];
						} else if (outputFormat === 'gzip') {
							let outputPrefix;
							let fileName;
							let binaryProperty;
							let filePath;

							if (nodeVersion > 1) {
								outputPrefix = this.getNodeParameter('binaryPropertyOutput', i, 'data');
								binaryProperty = `${outputPrefix}${index ? index : ''}`;

								fileName = this.getNodeParameter('fileName', i, '') as string;
								if (!fileName) {
									fileName = binaryData.fileName?.split('.')[0];
								} else {
									fileName = fileName.replace('.gz', '').replace('.gzip', '');
								}

								const fileExtension = binaryData.fileExtension
									? `.${binaryData.fileExtension.toLowerCase()}`
									: '';
								filePath = `${fileName}${fileExtension}.gz`;
							} else {
								outputPrefix = this.getNodeParameter('outputPrefix', 0) as string;
								binaryProperty = `${outputPrefix}${index}`;
								fileName = binaryData.fileName?.split('.')[0];
								filePath = `${fileName}.gzip`;
							}

							const data = await gzip(binaryDataBuffer);

							binaryObject[binaryProperty] = await this.helpers.prepareBinaryData(
								Buffer.from(data),
								filePath,
							);
						}
					}

					if (outputFormat === 'zip') {
						let zipOptionsIndex = 0;
						if (nodeVersion > 1) {
							zipOptionsIndex = i;
						}
						const fileName = this.getNodeParameter('fileName', zipOptionsIndex) as string;
						const binaryPropertyOutput = this.getNodeParameter(
							'binaryPropertyOutput',
							zipOptionsIndex,
						);
						const buffer = await zip(zipData);
						const data = await this.helpers.prepareBinaryData(Buffer.from(buffer), fileName);

						returnData.push({
							json: items[i].json,
							binary: {
								[binaryPropertyOutput]: data,
							},
							pairedItem: {
								item: i,
							},
						});
					}

					if (outputFormat === 'gzip') {
						returnData.push({
							json: items[i].json,
							binary: binaryObject,
							pairedItem: {
								item: i,
							},
						});
					}
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error.message,
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
