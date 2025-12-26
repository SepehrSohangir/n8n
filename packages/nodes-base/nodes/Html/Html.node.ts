import cheerio from 'cheerio';
import get from 'lodash/get';
import type {
	INodeExecutionData,
	IExecuteFunctions,
	INodeType,
	INodeTypeDescription,
	IDataObject,
	INodeProperties,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import { getResolvables, sanitizeDataPathKey } from '@utils/utilities';

import { placeholder } from './placeholder';
import type { IValueData } from './types';
import { getValue } from './utils';

export const capitalizeHeader = (header: string, capitalize?: boolean) => {
	if (!capitalize) return header;
	return header
		.split('_')
		.filter((word) => word)
		.map((word) => word[0].toUpperCase() + word.slice(1))
		.join(' ');
};

const extractionValuesCollection: INodeProperties = {
	displayName: 'مقادیر استخراج',
	name: 'extractionValues',
	placeholder: 'افزودن مقدار',
	type: 'fixedCollection',
	typeOptions: {
		multipleValues: true,
	},
	default: {},
	options: [
		{
			name: 'values',
			displayName: 'مقادیر',
			values: [
				{
					displayName: 'کلید',
					name: 'key',
					type: 'string',
					default: '',
					description: 'کلیدی که مقدار استخراج شده باید تحت آن ذخیره شود',
				},
				{
					displayName: 'انتخابگر CSS',
					name: 'cssSelector',
					type: 'string',
					default: '',
					placeholder: '.price',
					description: 'انتخابگر CSS برای استفاده',
				},
				{
					displayName: 'مقدار بازگشتی',
					name: 'returnValue',
					type: 'options',
					options: [
						{
							name: 'ویژگی',
							value: 'attribute',
							description: 'دریافت مقدار یک ویژگی مانند "class" از یک عنصر',
						},
						{
							name: 'HTML',
							value: 'html',
							description: 'دریافت HTML که عنصر شامل آن است',
						},
						{
							name: 'متن',
							value: 'text',
							description: 'فقط محتوای متنی عنصر را دریافت کنید',
						},
						{
							name: 'مقدار',
							value: 'value',
							description: 'دریافت مقدار یک ورودی، انتخاب یا textarea',
						},
					],
					default: 'text',
					description: 'چه نوع داده‌ای باید برگردانده شود',
				},
				{
					displayName: 'ویژگی',
					name: 'attribute',
					type: 'string',
					displayOptions: {
						show: {
							returnValue: ['attribute'],
						},
					},
					default: '',
					placeholder: 'class',
					description: 'نام ویژگی برای بازگرداندن مقدار آن',
				},
				{
					displayName: 'نادیده گرفتن انتخابگرها',
					name: 'skipSelectors',
					type: 'string',
					displayOptions: {
						show: {
							returnValue: ['text'],
							'@version': [{ _cnd: { gt: 1.1 } }],
						},
					},
					default: '',
					placeholder: 'مثلاً img, .className, #ItemId',
					description: 'لیست جدا شده با کاما از انتخابگرها برای نادیده گرفتن در استخراج متن',
				},
				{
					displayName: 'بازگرداندن آرایه',
					name: 'returnArray',
					type: 'boolean',
					default: false,
					description:
						'آیا مقادیر به عنوان یک آرایه برگردانده شوند تا اگر چندین مورد یافت شد، آنها نیز به صورت جداگانه برگردانده شوند. اگر تنظیم نشود، همه به عنوان یک رشته واحد برگردانده می‌شوند.',
				},
			],
		},
	],
};

export class Html implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'HTML',
		name: 'html',
		icon: { light: 'file:html.svg', dark: 'file:html.dark.svg' },
		group: ['transform'],
		version: [1, 1.1, 1.2],
		subtitle: '={{ $parameter["operation"] }}',
		description: 'کار با HTML',
		defaults: {
			name: 'HTML',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		parameterPane: 'wide',
		properties: [
			{
				displayName: 'عملیات',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'تولید قالب HTML',
						value: 'generateHtmlTemplate',
						action: 'تولید قالب HTML',
					},
					{
						name: 'استخراج محتوای HTML',
						value: 'extractHtmlContent',
						action: 'استخراج محتوای HTML',
					},
					{
						name: 'تبدیل به جدول HTML',
						value: 'convertToHtmlTable',
						action: 'تبدیل به جدول HTML',
					},
				],
				default: 'generateHtmlTemplate',
			},
			{
				displayName: 'قالب HTML',
				name: 'html',
				typeOptions: {
					editor: 'htmlEditor',
				},
				type: 'string',
				default: placeholder,
				noDataExpression: true,
				description: 'قالب HTML برای رندر',
				displayOptions: {
					show: {
						operation: ['generateHtmlTemplate'],
					},
				},
			},
			{
				displayName:
					'<b>نکات</b>: برای تکمیل خودکار Ctrl+Space را تایپ کنید. از <code>{{ }}</code> برای عبارات و از تگ‌های <code>&lt;style&gt;</code> برای CSS استفاده کنید. JS در تگ‌های <code>&lt;script&gt;</code> شامل می‌شود اما در n8n اجرا نمی‌شود.',
				name: 'notice',
				type: 'notice',
				default: '',
				displayOptions: {
					show: {
						operation: ['generateHtmlTemplate'],
					},
				},
			},
			{
				displayName: 'داده منبع',
				name: 'sourceData',
				type: 'options',
				options: [
					{
						name: 'باینری',
						value: 'binary',
					},
					{
						name: 'JSON',
						value: 'json',
					},
				],
				default: 'json',
				description: 'آیا HTML از داده‌های باینری یا JSON خوانده شود',
				displayOptions: {
					show: {
						operation: ['extractHtmlContent'],
					},
				},
			},
			{
				displayName: 'فیلد باینری ورودی',
				name: 'dataPropertyName',
				type: 'string',
				requiresDataPath: 'single',
				displayOptions: {
					show: {
						operation: ['extractHtmlContent'],
						sourceData: ['binary'],
					},
				},
				default: 'data',
				required: true,
				hint: 'نام فیلد باینری ورودی حاوی فایل برای استخراج',
			},
			{
				displayName: 'ویژگی JSON',
				name: 'dataPropertyName',
				type: 'string',
				requiresDataPath: 'single',
				displayOptions: {
					show: {
						operation: ['extractHtmlContent'],
						sourceData: ['json'],
					},
				},
				default: 'data',
				required: true,
				description:
					'نام ویژگی JSON که HTML برای استخراج داده‌ها از آن یافت می‌شود. ویژگی می‌تواند شامل یک رشته یا آرایه‌ای از رشته‌ها باشد.',
			},
			{
				...extractionValuesCollection,
				displayOptions: {
					show: {
						operation: ['extractHtmlContent'],
						'@version': [1],
					},
				},
			},
			{
				...extractionValuesCollection,
				default: {
					values: [
						{
							key: '',
							cssSelector: '',
							returnValue: 'text',
							returnArray: false,
						},
					],
				},
				displayOptions: {
					show: {
						operation: ['extractHtmlContent'],
						'@version': [{ _cnd: { gt: 1 } }],
					},
				},
			},
			{
				displayName: 'گزینه‌ها',
				name: 'options',
				type: 'collection',
				placeholder: 'افزودن گزینه',
				default: {},
				displayOptions: {
					show: {
						operation: ['extractHtmlContent'],
					},
				},
				options: [
					{
						displayName: 'برش مقادیر',
						name: 'trimValues',
						type: 'boolean',
						default: true,
						description:
							'آیا به طور خودکار همه فضاها و خطوط جدید از ابتدا و انتهای مقادیر حذف شوند',
					},
					{
						displayName: 'پاکسازی متن',
						name: 'cleanUpText',
						type: 'boolean',
						default: true,
						description:
							'آیا فضاهای خالی پیشرو و انتهایی، شکست خط (خطوط جدید) حذف شوند و چندین فضای خالی متوالی به یک فضای واحد فشرده شوند',
					},
				],
			},
			// ----------------------------------
			//       convertToHtmlTable
			// ----------------------------------
			{
				displayName: 'گزینه‌ها',
				name: 'options',
				type: 'collection',
				placeholder: 'افزودن گزینه',
				default: {},
				displayOptions: {
					show: {
						operation: ['convertToHtmlTable'],
					},
				},
				options: [
					{
						displayName: 'بزرگ کردن حروف سربرگ‌ها',
						name: 'capitalize',
						type: 'boolean',
						default: false,
						description: 'آیا حروف سربرگ‌ها بزرگ شوند',
					},
					{
						displayName: 'استایل سفارشی',
						name: 'customStyling',
						type: 'boolean',
						default: false,
						description: 'آیا از استایل سفارشی استفاده شود',
					},
					{
						displayName: 'عنوان',
						name: 'caption',
						type: 'string',
						default: '',
						description: 'عنوان برای اضافه کردن به جدول',
					},
					{
						displayName: 'ویژگی‌های جدول',
						name: 'tableAttributes',
						type: 'string',
						default: '',
						description: 'ویژگی‌ها برای اتصال به جدول',
						placeholder: 'مثلاً style="padding:10px"',
					},
					{
						displayName: 'ویژگی‌های سربرگ',
						name: 'headerAttributes',
						type: 'string',
						default: '',
						description: 'ویژگی‌ها برای اتصال به سربرگ جدول',
						placeholder: 'مثلاً style="padding:10px"',
					},
					{
						displayName: 'ویژگی‌های ردیف',
						name: 'rowAttributes',
						type: 'string',
						default: '',
						description: 'ویژگی‌ها برای اتصال به ردیف جدول',
						placeholder: 'مثلاً style="padding:10px"',
					},
					{
						displayName: 'ویژگی‌های سلول',
						name: 'cellAttributes',
						type: 'string',
						default: '',
						description: 'ویژگی‌ها برای اتصال به سلول جدول',
						placeholder: 'مثلاً style="padding:10px"',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const operation = this.getNodeParameter('operation', 0);
		const nodeVersion = this.getNode().typeVersion;

		if (operation === 'convertToHtmlTable' && items.length) {
			let table = '';

			const options = this.getNodeParameter('options', 0);

			let tableStyle = '';
			let headerStyle = '';
			let cellStyle = '';

			if (!options.customStyling) {
				tableStyle = "style='border-spacing:0; font-family:helvetica,arial,sans-serif'";
				headerStyle =
					"style='margin:0; padding:7px 20px 7px 0px; border-bottom:1px solid #eee; text-align:left; color:#888; font-weight:normal'";
				cellStyle = "style='margin:0; padding:7px 20px 7px 0px; border-bottom:1px solid #eee'";
			}

			const tableAttributes = (options.tableAttributes as string) || '';
			const headerAttributes = (options.headerAttributes as string) || '';

			const itemsData: IDataObject[] = [];
			const itemsKeys = new Set<string>();

			for (const entry of items) {
				itemsData.push(entry.json);

				for (const key of Object.keys(entry.json)) {
					itemsKeys.add(key);
				}
			}

			const headers = Array.from(itemsKeys);

			table += `<table ${tableStyle} ${tableAttributes}>`;

			if (options.caption) {
				table += `<caption>${options.caption}</caption>`;
			}

			table += `<thead ${headerStyle} ${headerAttributes}>`;
			table += '<tr>';
			table += headers
				.map((header) => '<th>' + capitalizeHeader(header, options.capitalize as boolean) + '</th>')
				.join('');
			table += '</tr>';
			table += '</thead>';

			table += '<tbody>';
			itemsData.forEach((entry, entryIndex) => {
				const rowsAttributes = this.getNodeParameter(
					'options.rowAttributes',
					entryIndex,
					'',
				) as string;

				table += `<tr  ${rowsAttributes}>`;

				const cellsAttributes = this.getNodeParameter(
					'options.cellAttributes',
					entryIndex,
					'',
				) as string;

				table += headers
					.map((header) => {
						let td = `<td ${cellStyle} ${cellsAttributes}>`;

						if (typeof entry[header] === 'boolean') {
							const isChecked = entry[header] ? 'checked="checked"' : '';
							td += `<input type="checkbox" ${isChecked}/>`;
						} else {
							td += entry[header];
						}
						td += '</td>';
						return td;
					})
					.join('');
				table += '</tr>';
			});

			table += '</tbody>';
			table += '</table>';

			return [
				[
					{
						json: { table },
						pairedItem: items.map((_item, index) => ({
							item: index,
						})),
					},
				],
			];
		}

		let item: INodeExecutionData;
		const returnData: INodeExecutionData[] = [];
		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				if (operation === 'generateHtmlTemplate') {
					// ----------------------------------
					//       generateHtmlTemplate
					// ----------------------------------

					let html = this.getNodeParameter('html', itemIndex) as string;

					for (const resolvable of getResolvables(html)) {
						html = html.replace(
							resolvable,
							this.evaluateExpression(resolvable, itemIndex) as string,
						);
					}

					const result = this.helpers.constructExecutionMetaData(
						this.helpers.returnJsonArray({ html }),
						{
							itemData: { item: itemIndex },
						},
					);

					returnData.push(...result);
				} else if (operation === 'extractHtmlContent') {
					// ----------------------------------
					//         extractHtmlContent
					// ----------------------------------

					const dataPropertyName = this.getNodeParameter('dataPropertyName', itemIndex);
					const extractionValues = this.getNodeParameter(
						'extractionValues',
						itemIndex,
					) as IDataObject;
					const options = this.getNodeParameter('options', itemIndex, {});
					const sourceData = this.getNodeParameter('sourceData', itemIndex) as string;

					item = items[itemIndex];

					let htmlArray: string[] | string = [];
					if (sourceData === 'json') {
						if (nodeVersion === 1) {
							const key = sanitizeDataPathKey(item.json, dataPropertyName);
							if (item.json[key] === undefined) {
								throw new NodeOperationError(
									this.getNode(),
									`No property named "${dataPropertyName}" exists!`,
									{ itemIndex },
								);
							}
							htmlArray = item.json[key] as string;
						} else {
							const value = get(item.json, dataPropertyName);
							if (value === undefined) {
								throw new NodeOperationError(
									this.getNode(),
									`No property named "${dataPropertyName}" exists!`,
									{ itemIndex },
								);
							}
							htmlArray = value as string;
						}
					} else {
						this.helpers.assertBinaryData(itemIndex, dataPropertyName);
						const binaryDataBuffer = await this.helpers.getBinaryDataBuffer(
							itemIndex,
							dataPropertyName,
						);
						htmlArray = binaryDataBuffer.toString('utf-8');
					}

					// Convert it always to array that it works with a string or an array of strings
					if (!Array.isArray(htmlArray)) {
						htmlArray = [htmlArray];
					}

					for (const html of htmlArray) {
						const $ = cheerio.load(html);

						const newItem: INodeExecutionData = {
							json: {},
							pairedItem: {
								item: itemIndex,
							},
						};

						// Iterate over all the defined values which should be extracted
						let htmlElement;
						for (const valueData of extractionValues.values as IValueData[]) {
							htmlElement = $(valueData.cssSelector);

							if (valueData.returnArray) {
								// An array should be returned so iterate over one
								// value at a time
								newItem.json[valueData.key] = [];
								htmlElement.each((_, el) => {
									(newItem.json[valueData.key] as Array<string | undefined>).push(
										getValue($(el), valueData, options, nodeVersion),
									);
								});
							} else {
								// One single value should be returned
								newItem.json[valueData.key] = getValue(
									htmlElement,
									valueData,
									options,
									nodeVersion,
								);
							}
						}
						returnData.push(newItem);
					}
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error.message,
						},
						pairedItem: {
							item: itemIndex,
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
