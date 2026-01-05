import { createWriteStream } from 'fs';
import { BINARY_ENCODING, NodeApiError, NodeConnectionTypes } from 'n8n-workflow';
import type {
	ICredentialDataDecryptedObject,
	ICredentialsDecrypted,
	ICredentialTestFunctions,
	IDataObject,
	IExecuteFunctions,
	INodeCredentialTestResult,
	INodeExecutionData,
	INodeProperties,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';
import { basename, dirname } from 'path';
import ftpClient from 'promise-ftp';
import sftpClient from 'ssh2-sftp-client';
import type { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { file as tmpFile } from 'tmp-promise';

import { formatPrivateKey, generatePairedItemData } from '@utils/utilities';

interface ReturnFtpItem {
	type: string;
	name: string;
	size: number;
	accessTime: Date;
	modifyTime: Date;
	rights: {
		user: string;
		group: string;
		other: string;
	};
	owner: string | number;
	group: string | number;
	target: string;
	sticky?: boolean;
	path: string;
}

async function callRecursiveList(
	path: string,
	client: sftpClient | ftpClient,
	normalizeFunction: (
		input: ftpClient.ListingElement & sftpClient.FileInfo,
		path: string,
		recursive?: boolean,
	) => void,
) {
	const pathArray: string[] = [path];
	let currentPath = path;
	const directoryItems: sftpClient.FileInfo[] = [];
	let index = 0;

	const prepareAndNormalize = (item: sftpClient.FileInfo) => {
		if (pathArray[index].endsWith('/')) {
			currentPath = `${pathArray[index]}${item.name}`;
		} else {
			currentPath = `${pathArray[index]}/${item.name}`;
		}

		// Is directory
		if (item.type === 'd') {
			// ignore . and .. to prevent infinite loop
			if (item.name === '.' || item.name === '..') {
				return;
			}
			pathArray.push(currentPath);
		}

		normalizeFunction(item as ftpClient.ListingElement & sftpClient.FileInfo, currentPath, true);
		directoryItems.push(item);
	};

	do {
		const returnData: sftpClient.FileInfo[] | Array<string | ftpClient.ListingElement> =
			await client.list(pathArray[index]);

		// @ts-ignore
		returnData.map(prepareAndNormalize);
		index++;
	} while (index <= pathArray.length - 1);

	return directoryItems;
}

async function recursivelyCreateSftpDirs(sftp: sftpClient, path: string) {
	const dirPath = dirname(path);
	const dirExists = await sftp.exists(dirPath);

	if (!dirExists) {
		await sftp.mkdir(dirPath, true);
	}
}

function normalizeSFtpItem(input: sftpClient.FileInfo, path: string, recursive = false) {
	const item = input as unknown as ReturnFtpItem;
	item.accessTime = new Date(input.accessTime);
	item.modifyTime = new Date(input.modifyTime);
	item.path = !recursive ? `${path}${path.endsWith('/') ? '' : '/'}${item.name}` : path;
}

function normalizeFtpItem(input: ftpClient.ListingElement, path: string, recursive = false) {
	const item = input as unknown as ReturnFtpItem;
	item.modifyTime = input.date;
	item.path = !recursive ? `${path}${path.endsWith('/') ? '' : '/'}${item.name}` : path;
	//@ts-ignore
	item.date = undefined;
}

const timeoutOption: INodeProperties = {
	displayName: 'زمان‌انتظار',
	name: 'timeout',
	description: 'زمان‌انتظار اتصال به میلی‌ثانیه',
	type: 'number',
	typeOptions: {
		minValue: 1,
	},
	default: 10000,
};

export class Ftp implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'FTP',
		name: 'ftp',
		icon: 'fa:server',
		iconColor: 'dark-blue',
		group: ['input'],
		version: 1,
		subtitle: '={{$parameter["protocol"] + ": " + $parameter["operation"]}}',
		description: 'انتقال فایل از طریق FTP یا SFTP',
		defaults: {
			name: 'FTP',
			color: '#303050',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				// nodelinter-ignore-next-line
				name: 'ftp',
				required: true,
				displayOptions: {
					show: {
						protocol: ['ftp'],
					},
				},
				testedBy: 'ftpConnectionTest',
			},
			{
				// nodelinter-ignore-next-line
				name: 'sftp',
				required: true,
				displayOptions: {
					show: {
						protocol: ['sftp'],
					},
				},
				testedBy: 'sftpConnectionTest',
			},
		],
		properties: [
			{
				displayName: 'پروتکل',
				name: 'protocol',
				type: 'options',
				options: [
					{
						name: 'FTP',
						value: 'ftp',
					},
					{
						name: 'SFTP',
						value: 'sftp',
					},
				],
				default: 'ftp',
				description: 'پروتکل انتقال فایل',
			},
			{
				displayName: 'عملیات',
				name: 'operation',
				type: 'options',
				options: [
					{
						name: 'حذف',
						value: 'delete',
						description: 'حذف یک فایل/پوشه',
						action: 'حذف یک فایل یا پوشه',
					},
					{
						name: 'دانلود',
						value: 'download',
						description: 'دانلود یک فایل',
						action: 'دانلود یک فایل',
					},
					{
						name: 'لیست',
						value: 'list',
						description: 'لیست محتوای پوشه',
						action: 'لیست محتوای پوشه',
					},
					{
						name: 'تغییر نام',
						value: 'rename',
						description: 'تغییر نام/انتقال oldPath به newPath',
						action: 'تغییر نام / انتقال یک فایل یا پوشه',
					},
					{
						name: 'آپلود',
						value: 'upload',
						description: 'آپلود یک فایل',
						action: 'آپلود یک فایل',
					},
				],
				default: 'download',
				noDataExpression: true,
			},

			// ----------------------------------
			//         delete
			// ----------------------------------
			{
				displayName: 'مسیر',
				displayOptions: {
					show: {
						operation: ['delete'],
					},
				},
				name: 'path',
				type: 'string',
				default: '',
				description: 'مسیر فایل برای حذف. باید شامل مسیر کامل باشد.',
				placeholder: 'مثلاً /public/documents/file-to-delete.txt',
				required: true,
			},

			{
				displayName: 'گزینه‌ها',
				name: 'options',
				type: 'collection',
				placeholder: 'افزودن گزینه',
				displayOptions: {
					show: {
						operation: ['delete'],
					},
				},
				default: {},
				options: [
					{
						displayName: 'پوشه',
						name: 'folder',
						type: 'boolean',
						default: false,
						description: 'آیا پوشه‌ها می‌توانند حذف شوند',
					},
					{
						displayName: 'بازگشتی',
						displayOptions: {
							show: {
								folder: [true],
							},
						},
						name: 'recursive',
						type: 'boolean',
						default: false,
						description: 'آیا همه فایل‌ها و دایرکتوری‌ها در دایرکتوری هدف حذف شوند',
					},
					timeoutOption,
				],
			},

			// ----------------------------------
			//         download
			// ----------------------------------
			{
				displayName: 'مسیر',
				displayOptions: {
					show: {
						operation: ['download'],
					},
				},
				name: 'path',
				type: 'string',
				default: '',
				description: 'مسیر فایل برای دانلود. باید شامل مسیر کامل باشد.',
				placeholder: 'مثلاً /public/documents/file-to-download.txt',
				required: true,
			},
			{
				displayName: 'قرار دادن فایل خروجی در فیلد',
				displayOptions: {
					show: {
						operation: ['download'],
					},
				},
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				hint: 'نام فیلد باینری خروجی برای قرار دادن فایل در آن',
				required: true,
			},
			{
				displayName: 'گزینه‌ها',
				name: 'options',
				type: 'collection',
				placeholder: 'افزودن فیلد',
				default: {},
				displayOptions: {
					show: {
						operation: ['download'],
					},
				},
				options: [
					{
						displayName: 'فعال‌سازی خواندن همزمان',
						name: 'enableConcurrentReads',
						type: 'boolean',
						default: false,
						description: 'آیا خواندن همزمان برای دانلود فایل‌ها فعال شود',
					},
					{
						displayName: 'حداکثر خواندن همزمان',
						name: 'maxConcurrentReads',
						type: 'number',
						default: 5,
						displayOptions: {
							show: {
								enableConcurrentReads: [true],
							},
						},
					},
					{
						displayName: 'اندازه تکه',
						name: 'chunkSize',
						type: 'number',
						default: 64,
						description:
							'اندازه هر تکه به کیلوبایت برای دانلود، همه سرورها از این پشتیبانی نمی‌کنند',
						displayOptions: {
							show: {
								enableConcurrentReads: [true],
							},
						},
					},
					timeoutOption,
				],
			},
			// ----------------------------------
			//         rename
			// ----------------------------------
			{
				displayName: 'مسیر قدیمی',
				displayOptions: {
					show: {
						operation: ['rename'],
					},
				},
				name: 'oldPath',
				type: 'string',
				default: '',
				placeholder: 'مثلاً /public/documents/old-file.txt',
				required: true,
			},
			{
				displayName: 'مسیر جدید',
				displayOptions: {
					show: {
						operation: ['rename'],
					},
				},
				name: 'newPath',
				type: 'string',
				default: '',
				placeholder: 'مثلاً /public/documents/new-file.txt',
				required: true,
			},
			{
				displayName: 'گزینه‌ها',
				name: 'options',
				type: 'collection',
				placeholder: 'افزودن فیلد',
				default: {},
				displayOptions: {
					show: {
						operation: ['rename'],
					},
				},
				options: [
					{
						displayName: 'ایجاد دایرکتوری‌ها',
						name: 'createDirectories',
						type: 'boolean',
						default: false,
						description:
							'آیا دایرکتوری مقصد به صورت بازگشتی ایجاد شود هنگام تغییر نام یک فایل یا پوشه موجود',
					},
					timeoutOption,
				],
			},

			// ----------------------------------
			//         upload
			// ----------------------------------
			{
				displayName: 'مسیر',
				displayOptions: {
					show: {
						operation: ['upload'],
					},
				},
				name: 'path',
				type: 'string',
				default: '',
				description: 'مسیر فایل برای آپلود. باید شامل مسیر کامل باشد.',
				placeholder: 'مثلاً /public/documents/file-to-upload.txt',
				required: true,
			},
			{
				displayName: 'فایل باینری',
				displayOptions: {
					show: {
						operation: ['upload'],
					},
				},
				name: 'binaryData',
				type: 'boolean',
				default: true,
				// eslint-disable-next-line n8n-nodes-base/node-param-description-boolean-without-whether
				description: 'محتوای متنی فایل برای آپلود',
			},
			{
				displayName: 'فیلد باینری ورودی',
				displayOptions: {
					show: {
						operation: ['upload'],
						binaryData: [true],
					},
				},
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				hint: 'نام فیلد باینری ورودی حاوی فایل برای نوشتن',
				required: true,
			},
			{
				displayName: 'محتوای فایل',
				displayOptions: {
					show: {
						operation: ['upload'],
						binaryData: [false],
					},
				},
				name: 'fileContent',
				type: 'string',
				default: '',
				description: 'محتوای متنی فایل برای آپلود',
			},
			{
				displayName: 'گزینه‌ها',
				name: 'options',
				type: 'collection',
				placeholder: 'افزودن فیلد',
				default: {},
				displayOptions: {
					show: {
						operation: ['upload'],
					},
				},
				options: [timeoutOption],
			},

			// ----------------------------------
			//         list
			// ----------------------------------
			{
				displayName: 'مسیر',
				displayOptions: {
					show: {
						operation: ['list'],
					},
				},
				name: 'path',
				type: 'string',
				default: '/',
				placeholder: 'مثلاً /public/folder',
				description: 'مسیر دایرکتوری برای لیست کردن محتوا',
				required: true,
			},
			{
				displayName: 'بازگشتی',
				displayOptions: {
					show: {
						operation: ['list'],
					},
				},
				name: 'recursive',
				type: 'boolean',
				default: false,
				description:
					'آیا شیء نشان‌دهنده همه دایرکتوری‌ها / اشیاء به صورت بازگشتی یافت شده در سرور SFTP برگردانده شود',
				required: true,
			},
			{
				displayName: 'گزینه‌ها',
				name: 'options',
				type: 'collection',
				placeholder: 'افزودن فیلد',
				default: {},
				displayOptions: {
					show: {
						operation: ['list'],
					},
				},
				options: [timeoutOption],
			},
		],
	};

	methods = {
		credentialTest: {
			async ftpConnectionTest(
				this: ICredentialTestFunctions,
				credential: ICredentialsDecrypted,
			): Promise<INodeCredentialTestResult> {
				const credentials = credential.data as ICredentialDataDecryptedObject;
				const ftp = new ftpClient();
				try {
					await ftp.connect({
						host: credentials.host as string,
						port: credentials.port as number,
						user: credentials.username as string,
						password: credentials.password as string,
					});
				} catch (error) {
					await ftp.end();
					return {
						status: 'Error',
						message: error.message,
					};
				}
				await ftp.end();
				return {
					status: 'OK',
					message: 'Connection successful!',
				};
			},
			async sftpConnectionTest(
				this: ICredentialTestFunctions,
				credential: ICredentialsDecrypted,
			): Promise<INodeCredentialTestResult> {
				const credentials = credential.data as ICredentialDataDecryptedObject;
				const sftp = new sftpClient();
				try {
					if (credentials.privateKey) {
						await sftp.connect({
							host: credentials.host as string,
							port: credentials.port as number,
							username: credentials.username as string,
							password: (credentials.password as string) || undefined,
							privateKey: formatPrivateKey(credentials.privateKey as string),
							passphrase: credentials.passphrase as string | undefined,
						});
					} else {
						await sftp.connect({
							host: credentials.host as string,
							port: credentials.port as number,
							username: credentials.username as string,
							password: credentials.password as string,
						});
					}
				} catch (error) {
					await sftp.end();
					return {
						status: 'Error',
						message: error.message,
					};
				}
				await sftp.end();
				return {
					status: 'OK',
					message: 'Connection successful!',
				};
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		let returnItems: INodeExecutionData[] = [];
		const operation = this.getNodeParameter('operation', 0);

		let credentials: ICredentialDataDecryptedObject | undefined = undefined;
		const protocol = this.getNodeParameter('protocol', 0) as string;

		const connectionTimeout = this.getNodeParameter('options.timeout', 0, 10000) as number;

		if (protocol === 'sftp') {
			credentials = await this.getCredentials<ICredentialDataDecryptedObject>('sftp');
		} else {
			credentials = await this.getCredentials<ICredentialDataDecryptedObject>('ftp');
		}
		let ftp: ftpClient;
		let sftp: sftpClient;

		try {
			try {
				if (protocol === 'sftp') {
					sftp = new sftpClient();
					if (credentials.privateKey) {
						await sftp.connect({
							host: credentials.host as string,
							port: credentials.port as number,
							username: credentials.username as string,
							password: (credentials.password as string) || undefined,
							privateKey: formatPrivateKey(credentials.privateKey as string),
							passphrase: credentials.passphrase as string | undefined,
							readyTimeout: connectionTimeout,
							algorithms: {
								compress: ['zlib@openssh.com', 'zlib', 'none'],
							},
						});
					} else {
						await sftp.connect({
							host: credentials.host as string,
							port: credentials.port as number,
							username: credentials.username as string,
							password: credentials.password as string,
							readyTimeout: connectionTimeout,
							algorithms: {
								compress: ['zlib@openssh.com', 'zlib', 'none'],
							},
						});
					}
				} else {
					ftp = new ftpClient();
					await ftp.connect({
						host: credentials.host as string,
						port: credentials.port as number,
						user: credentials.username as string,
						password: credentials.password as string,
						connTimeout: connectionTimeout,
					});
				}
			} catch (error) {
				if (this.continueOnFail()) {
					const pairedItem = generatePairedItemData(items.length);

					return [[{ json: { error: error.message }, pairedItem }]];
				}
				throw error;
			}

			for (let i = 0; i < items.length; i++) {
				try {
					const newItem: INodeExecutionData = {
						json: items[i].json,
						binary: {},
						pairedItem: items[i].pairedItem,
					};

					if (items[i].binary !== undefined && newItem.binary) {
						// Create a shallow copy of the binary data so that the old
						// data references which do not get changed still stay behind
						// but the incoming data does not get changed.
						Object.assign(newItem.binary, items[i].binary);
					}

					items[i] = newItem;

					if (protocol === 'sftp') {
						if (operation === 'list') {
							const path = this.getNodeParameter('path', i) as string;

							const recursive = this.getNodeParameter('recursive', i) as boolean;

							let responseData: sftpClient.FileInfo[];
							if (recursive) {
								responseData = await callRecursiveList(path, sftp!, normalizeSFtpItem);
							} else {
								responseData = await sftp!.list(path);
								responseData.forEach((item) => normalizeSFtpItem(item, path));
							}

							const executionData = this.helpers.constructExecutionMetaData(
								this.helpers.returnJsonArray(responseData as unknown as IDataObject[]),
								{ itemData: { item: i } },
							);
							returnItems = returnItems.concat(executionData);
						}

						if (operation === 'delete') {
							const path = this.getNodeParameter('path', i) as string;
							const options = this.getNodeParameter('options', i);

							if (options.folder === true) {
								await sftp!.rmdir(path, !!options.recursive);
							} else {
								await sftp!.delete(path);
							}
							const executionData = this.helpers.constructExecutionMetaData(
								[{ json: { success: true } }],
								{ itemData: { item: i } },
							);
							returnItems = returnItems.concat(executionData);
						}

						if (operation === 'rename') {
							const oldPath = this.getNodeParameter('oldPath', i) as string;
							const { createDirectories = false } = this.getNodeParameter('options', i) as {
								createDirectories: boolean;
							};
							const newPath = this.getNodeParameter('newPath', i) as string;

							if (createDirectories) {
								await recursivelyCreateSftpDirs(sftp!, newPath);
							}

							await sftp!.rename(oldPath, newPath);
							const executionData = this.helpers.constructExecutionMetaData(
								[{ json: { success: true } }],
								{ itemData: { item: i } },
							);
							returnItems = returnItems.concat(executionData);
						}

						if (operation === 'download') {
							const path = this.getNodeParameter('path', i) as string;
							const options = this.getNodeParameter('options', i);
							const binaryFile = await tmpFile({ prefix: 'n8n-sftp-' });
							try {
								if (!options.enableConcurrentReads) {
									await sftp!.get(path, createWriteStream(binaryFile.path));
								} else {
									await sftp!.fastGet(path, binaryFile.path, {
										concurrency:
											options.maxConcurrentReads === undefined
												? 5
												: Number(options.maxConcurrentReads),
										chunkSize:
											(options.chunkSize === undefined ? 64 : Number(options.chunkSize)) * 1024,
									});
								}

								const dataPropertyNameDownload = this.getNodeParameter('binaryPropertyName', i);
								const remoteFilePath = this.getNodeParameter('path', i) as string;

								items[i].binary![dataPropertyNameDownload] = await this.nodeHelpers.copyBinaryFile(
									binaryFile.path,
									basename(remoteFilePath),
								);

								const executionData = this.helpers.constructExecutionMetaData(
									this.helpers.returnJsonArray(items[i]),
									{ itemData: { item: i } },
								);
								returnItems = returnItems.concat(executionData);
							} finally {
								await binaryFile.cleanup();
							}
						}

						if (operation === 'upload') {
							const remotePath = this.getNodeParameter('path', i) as string;
							await recursivelyCreateSftpDirs(sftp!, remotePath);

							if (this.getNodeParameter('binaryData', i)) {
								const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i);
								const binaryData = this.helpers.assertBinaryData(i, binaryPropertyName);

								let uploadData: Buffer | Readable;
								if (binaryData.id) {
									uploadData = await this.helpers.getBinaryStream(binaryData.id);
								} else {
									uploadData = Buffer.from(binaryData.data, BINARY_ENCODING);
								}
								await sftp!.put(uploadData, remotePath);
							} else {
								// Is text file
								const buffer = Buffer.from(
									this.getNodeParameter('fileContent', i) as string,
									'utf8',
								);
								await sftp!.put(buffer, remotePath);
							}

							const executionData = this.helpers.constructExecutionMetaData(
								this.helpers.returnJsonArray(items[i]),
								{ itemData: { item: i } },
							);
							returnItems = returnItems.concat(executionData);
						}
					}

					if (protocol === 'ftp') {
						if (operation === 'list') {
							const path = this.getNodeParameter('path', i) as string;

							const recursive = this.getNodeParameter('recursive', i) as boolean;

							let responseData;
							if (recursive) {
								responseData = await callRecursiveList(path, ftp!, normalizeFtpItem);
							} else {
								responseData = await ftp!.list(path);
								responseData.forEach((item) =>
									normalizeFtpItem(item as ftpClient.ListingElement, path),
								);
							}

							const executionData = this.helpers.constructExecutionMetaData(
								this.helpers.returnJsonArray(responseData as unknown as IDataObject[]),
								{ itemData: { item: i } },
							);
							returnItems = returnItems.concat(executionData);
						}

						if (operation === 'delete') {
							const path = this.getNodeParameter('path', i) as string;
							const options = this.getNodeParameter('options', i);

							if (options.folder === true) {
								await ftp!.rmdir(path, !!options.recursive);
							} else {
								await ftp!.delete(path);
							}

							const executionData = this.helpers.constructExecutionMetaData(
								[{ json: { success: true } }],
								{ itemData: { item: i } },
							);
							returnItems = returnItems.concat(executionData);
						}

						if (operation === 'download') {
							const path = this.getNodeParameter('path', i) as string;
							const binaryFile = await tmpFile({ prefix: 'n8n-sftp-' });
							try {
								const stream = await ftp!.get(path);
								await pipeline(stream, createWriteStream(binaryFile.path));

								const dataPropertyNameDownload = this.getNodeParameter('binaryPropertyName', i);
								const remoteFilePath = this.getNodeParameter('path', i) as string;

								items[i].binary![dataPropertyNameDownload] = await this.nodeHelpers.copyBinaryFile(
									binaryFile.path,
									basename(remoteFilePath),
								);

								const executionData = this.helpers.constructExecutionMetaData(
									this.helpers.returnJsonArray(items[i]),
									{ itemData: { item: i } },
								);
								returnItems = returnItems.concat(executionData);
							} finally {
								await binaryFile.cleanup();
							}
						}

						if (operation === 'rename') {
							const oldPath = this.getNodeParameter('oldPath', i) as string;
							const newPath = this.getNodeParameter('newPath', i) as string;
							const options = this.getNodeParameter('options', i);

							try {
								await ftp!.rename(oldPath, newPath);
							} catch (error) {
								if ([451, 550].includes(error.code) && options.createDirectories) {
									const dirPath = newPath.replace(basename(newPath), '');
									await ftp!.mkdir(dirPath, true);
									await ftp!.rename(oldPath, newPath);
								} else {
									throw new NodeApiError(this.getNode(), error as JsonObject);
								}
							}
							const executionData = this.helpers.constructExecutionMetaData(
								[{ json: { success: true } }],
								{ itemData: { item: i } },
							);
							returnItems = returnItems.concat(executionData);
						}

						if (operation === 'upload') {
							const remotePath = this.getNodeParameter('path', i) as string;
							const fileName = basename(remotePath);
							const dirPath = remotePath.replace(fileName, '');

							if (this.getNodeParameter('binaryData', i)) {
								const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i);
								const binaryData = this.helpers.assertBinaryData(i, binaryPropertyName);

								let uploadData: Buffer | Readable;
								if (binaryData.id) {
									uploadData = await this.helpers.getBinaryStream(binaryData.id);
								} else {
									uploadData = Buffer.from(binaryData.data, BINARY_ENCODING);
								}

								try {
									await ftp!.put(uploadData, remotePath);
								} catch (error) {
									if (error.code === 553) {
										// Create directory
										await ftp!.mkdir(dirPath, true);
										await ftp!.put(uploadData, remotePath);
									} else {
										throw new NodeApiError(this.getNode(), error as JsonObject);
									}
								}
							} else {
								// Is text file
								const buffer = Buffer.from(
									this.getNodeParameter('fileContent', i) as string,
									'utf8',
								);
								try {
									await ftp!.put(buffer, remotePath);
								} catch (error) {
									if (error.code === 553) {
										// Create directory
										await ftp!.mkdir(dirPath, true);
										await ftp!.put(buffer, remotePath);
									} else {
										throw new NodeApiError(this.getNode(), error as JsonObject);
									}
								}
							}
							const executionData = this.helpers.constructExecutionMetaData(
								this.helpers.returnJsonArray(items[i]),
								{ itemData: { item: i } },
							);
							returnItems = returnItems.concat(executionData);
						}
					}
				} catch (error) {
					if (this.continueOnFail()) {
						returnItems.push({ json: { error: error.message }, pairedItem: { item: i } });
						continue;
					}

					throw error;
				}
			}

			if (protocol === 'sftp') {
				await sftp!.end();
			} else {
				await ftp!.end();
			}
		} catch (error) {
			if (protocol === 'sftp') {
				await sftp!.end();
			} else {
				await ftp!.end();
			}
			throw error;
		}

		return [returnItems];
	}
}
