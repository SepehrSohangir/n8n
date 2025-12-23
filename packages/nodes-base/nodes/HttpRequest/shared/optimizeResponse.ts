import { Readability } from '@mozilla/readability';
import * as cheerio from 'cheerio';
import { convert } from 'html-to-text';
import { JSDOM } from 'jsdom';
import get from 'lodash/get';
import set from 'lodash/set';
import unset from 'lodash/unset';
import {
	type INodeProperties,
	jsonParse,
	NodeOperationError,
	type IDataObject,
	type IExecuteFunctions,
} from 'n8n-workflow';

type ResponseOptimizerFn = (
	x: IDataObject | IDataObject[] | string,
) => IDataObject | IDataObject[] | string;

function htmlOptimizer(
	ctx: IExecuteFunctions,
	itemIndex: number,
	maxLength: number,
): ResponseOptimizerFn {
	const cssSelector = ctx.getNodeParameter('cssSelector', itemIndex, '') as string;
	const onlyContent = ctx.getNodeParameter('onlyContent', itemIndex, false) as boolean;
	let elementsToOmit: string[] = [];

	if (onlyContent) {
		const elementsToOmitUi = ctx.getNodeParameter('elementsToOmit', itemIndex, '') as
			| string
			| string[];

		if (typeof elementsToOmitUi === 'string') {
			elementsToOmit = elementsToOmitUi
				.split(',')
				.filter((s) => s)
				.map((s) => s.trim());
		}
	}

	return (response) => {
		if (typeof response !== 'string') {
			throw new NodeOperationError(
				ctx.getNode(),
				`The response type must be a string. Received: ${typeof response}`,
				{ itemIndex },
			);
		}
		const returnData: string[] = [];

		const html = cheerio.load(response);
		const htmlElements = html(cssSelector);

		htmlElements.each((_, el) => {
			let value = html(el).html() || '';

			if (onlyContent) {
				let htmlToTextOptions;

				if (elementsToOmit?.length) {
					htmlToTextOptions = {
						selectors: elementsToOmit.map((selector) => ({
							selector,
							format: 'skip',
						})),
					};
				}

				value = convert(value, htmlToTextOptions);
			}

			value = value
				.trim()
				.replace(/^\s+|\s+$/g, '')
				.replace(/(\r\n|\n|\r)/gm, '')
				.replace(/\s+/g, ' ');

			returnData.push(value);
		});

		const text = JSON.stringify(returnData, null, 2);

		if (maxLength > 0 && text.length > maxLength) {
			return text.substring(0, maxLength);
		}

		return text;
	};
}

const textOptimizer = (
	ctx: IExecuteFunctions,
	itemIndex: number,
	maxLength: number,
): ResponseOptimizerFn => {
	return (response) => {
		if (typeof response === 'object') {
			try {
				response = JSON.stringify(response, null, 2);
			} catch (error) {}
		}

		if (typeof response !== 'string') {
			throw new NodeOperationError(
				ctx.getNode(),
				`The response type must be a string. Received: ${typeof response}`,
				{ itemIndex },
			);
		}

		const dom = new JSDOM(response);
		const article = new Readability(dom.window.document, {
			keepClasses: true,
		}).parse();

		const text = article?.textContent || '';

		if (maxLength > 0 && text.length > maxLength) {
			return text.substring(0, maxLength);
		}

		return text;
	};
};

const jsonOptimizer = (ctx: IExecuteFunctions, itemIndex: number): ResponseOptimizerFn => {
	return (response) => {
		let responseData: IDataObject | IDataObject[] | string | null = response;

		if (typeof response === 'string') {
			try {
				responseData = jsonParse(response, { errorMessage: 'دریافت JSON نامعتبر از پاسخ' });
			} catch (error) {
				throw new NodeOperationError(ctx.getNode(), `دریافت JSON نامعتبر از پاسخ '${response}'`, {
					itemIndex,
				});
			}
		}

		if (typeof responseData !== 'object' || !responseData) {
			throw new NodeOperationError(ctx.getNode(), 'نوع پاسخ باید یک شیء یا آرایه‌ای از اشیاء باشد', {
				itemIndex,
			});
		}

		const dataField = ctx.getNodeParameter('dataField', itemIndex, '') as string;
		let returnData: IDataObject[] = [];

		if (!Array.isArray(responseData)) {
			if (dataField) {
				if (!Object.prototype.hasOwnProperty.call(responseData, dataField)) {
					throw new NodeOperationError(ctx.getNode(), `فیلد هدف "${dataField}" در پاسخ یافت نشد.`, {
						itemIndex,
						description: `پاسخ شامل این فیلدها بود:[${Object.keys(responseData).join(', ')}]`,
					});
				}

				const data = responseData[dataField] as IDataObject | IDataObject[];

				if (Array.isArray(data)) {
					responseData = data;
				} else {
					responseData = [data];
				}
			} else {
				responseData = [responseData];
			}
		} else {
			if (dataField) {
				responseData = responseData.map((data) => data[dataField]) as IDataObject[];
			}
		}

		const fieldsToInclude = ctx.getNodeParameter('fieldsToInclude', itemIndex, 'all') as
			| 'all'
			| 'selected'
			| 'except';

		let fields: string | string[] = [];

		if (fieldsToInclude !== 'all') {
			fields = ctx.getNodeParameter('fields', itemIndex, []) as string[] | string;

			if (typeof fields === 'string') {
				fields = fields.split(',').map((field) => field.trim());
			}
		} else {
			returnData = responseData;
		}

		if (fieldsToInclude === 'selected') {
			for (const item of responseData) {
				const newItem: IDataObject = {};

				for (const field of fields) {
					set(newItem, field, get(item, field));
				}

				returnData.push(newItem);
			}
		}

		if (fieldsToInclude === 'except') {
			for (const item of responseData) {
				for (const field of fields) {
					unset(item, field);
				}

				returnData.push(item);
			}
		}

		return returnData;
	};
};

export const configureResponseOptimizer = (
	ctx: IExecuteFunctions,
	itemIndex: number,
): ResponseOptimizerFn => {
	const optimizeResponse = ctx.getNodeParameter('optimizeResponse', itemIndex, false) as boolean;

	if (optimizeResponse) {
		const responseType = ctx.getNodeParameter('responseType', itemIndex) as
			| 'json'
			| 'text'
			| 'html';

		let maxLength = 0;
		const truncateResponse = ctx.getNodeParameter('truncateResponse', itemIndex, false) as boolean;

		if (truncateResponse) {
			maxLength = ctx.getNodeParameter('maxLength', itemIndex, 0) as number;
		}

		switch (responseType) {
			case 'html':
				return htmlOptimizer(ctx, itemIndex, maxLength);
			case 'text':
				return textOptimizer(ctx, itemIndex, maxLength);
			case 'json':
				return jsonOptimizer(ctx, itemIndex);
		}
	}

	return (x) => x;
};

export const optimizeResponseProperties: INodeProperties[] = [
	{
		displayName: 'بهینه‌سازی پاسخ',
		name: 'optimizeResponse',
		type: 'boolean',
		default: false,
		noDataExpression: true,
		description: 'آیا پاسخ را برای استخراج داده‌های مهم‌تر و کاهش نویز بهینه‌سازی کنیم؟',
	},
	{
		displayName: 'نوع پاسخ مورد انتظار',
		name: 'responseType',
		type: 'options',
		displayOptions: {
			show: {
				optimizeResponse: [true],
			},
		},
		options: [
			{
				name: 'JSON',
				value: 'json',
			},
			{
				name: 'HTML',
				value: 'html',
			},
			{
				name: 'Text',
				value: 'text',
			},
		],
		default: 'json',
	},
	{
		displayName: 'فیلدی که داده‌ها را در خود دارد',
		name: 'dataField',
		type: 'string',
		default: '',
		placeholder: 'e.g. records',
		description: 'نام فیلدی که داده‌ها را در پاسخ در خود دارد مشخص کنید',
		hint: 'برای استفاده از کل پاسخ، خالی بگذارید',
		requiresDataPath: 'single',
		displayOptions: {
			show: {
				optimizeResponse: [true],
				responseType: ['json'],
			},
		},
	},
	{
		displayName: 'شامل کردن فیلدها',
		name: 'fieldsToInclude',
		type: 'options',
		description: 'چه فیلدهایی باید در شیء پاسخ گنجانده شوند',
		default: 'all',
		displayOptions: {
			show: {
				optimizeResponse: [true],
				responseType: ['json'],
			},
		},
		options: [
			{
				name: 'همه',
				value: 'all',
				description: 'شامل همه فیلدها',
			},
			{
				name: 'انتخاب شده',
				value: 'selected',
				description: 'شامل فقط فیلدهای مشخص شده در زیر',
			},
			{
				name: 'مستثنی',
				value: 'except',
				description: 'مستثنی کردن فیلدهای مشخص شده در زیر',
			},
		],
	},
	{
		displayName: 'فیلدها',
		name: 'fields',
		type: 'string',
		default: '',
		placeholder: 'e.g. field1,field2',
		description:
			'لیست جدا شده با کاما از نام فیلدها. از نشانه‌گذاری نقطه‌ای پشتیبانی می‌کند. می‌توانید فیلدهای انتخاب شده را از پنل ورودی بکشید.',
		requiresDataPath: 'multiple',
		displayOptions: {
			show: {
				optimizeResponse: [true],
				responseType: ['json'],
			},
			hide: {
				fieldsToInclude: ['all'],
			},
		},
	},
	{
		displayName: 'انتخابگر (CSS)',
		name: 'cssSelector',
		type: 'string',
		description:
			'انتخاب عنصر خاص (مثلاً body) یا چندین عنصر (مثلاً div) از نوع انتخاب شده در HTML پاسخ.',
		placeholder: 'e.g. body',
		default: 'body',
		displayOptions: {
			show: {
				optimizeResponse: [true],
				responseType: ['html'],
			},
		},
	},
	{
		displayName: 'فقط محتوای بازگردانده شود',
		name: 'onlyContent',
		type: 'boolean',
		default: false,
		description: 'آیا فقط محتوای عناصر html بازگردانده شود و تگ‌ها و ویژگی‌های html حذف شوند',
		hint: 'از توکن‌های کمتری استفاده می‌کند و ممکن است برای مدل آسان‌تر باشد',
		displayOptions: {
			show: {
				optimizeResponse: [true],
				responseType: ['html'],
			},
		},
	},
	{
		displayName: 'عناصر برای حذف',
		name: 'elementsToOmit',
		type: 'string',
		displayOptions: {
			show: {
				optimizeResponse: [true],
				responseType: ['html'],
				onlyContent: [true],
			},
		},
		default: '',
		placeholder: 'مثلاً img, .className, #ItemId',
		description: 'لیست جدا شده با کاما از انتخابگرهایی که هنگام استخراج محتوا حذف می‌شوند',
	},
	{
		displayName: 'کوتاه کردن پاسخ',
		name: 'truncateResponse',
		type: 'boolean',
		default: false,
		hint: 'کمک به صرفه جویی در توکن‌ها',
		displayOptions: {
			show: {
				optimizeResponse: [true],
				responseType: ['text', 'html'],
			},
		},
	},
	{
		displayName: 'حداکثر تعداد کاراکترهای پاسخ',
		name: 'maxLength',
		type: 'number',
		default: 1000,
		typeOptions: {
			minValue: 1,
		},
		displayOptions: {
			show: {
				optimizeResponse: [true],
				responseType: ['text', 'html'],
				truncateResponse: [true],
			},
		},
	},
];
