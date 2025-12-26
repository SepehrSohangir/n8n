import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError, deepCopy } from 'n8n-workflow';
import { Builder, Parser } from 'xml2js';

export class Xml implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'XML',
		name: 'xml',
		icon: 'fa:file-code',
		iconColor: 'purple',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["mode"]==="jsonToxml" ? "JSON به XML" : "XML به JSON"}}',
		description: 'تبدیل داده‌ها از و به XML',
		defaults: {
			name: 'XML',
			color: '#333377',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		properties: [
			{
				displayName: 'حالت',
				name: 'mode',
				type: 'options',
				options: [
					{
						name: 'JSON به XML',
						value: 'jsonToxml',
						description: 'تبدیل داده‌ها از JSON به XML',
					},
					{
						name: 'XML به JSON',
						value: 'xmlToJson',
						description: 'تبدیل داده‌ها از XML به JSON',
					},
				],
				default: 'xmlToJson',
				description: 'از و به چه فرمتی داده‌ها باید تبدیل شوند',
			},
			{
				displayName:
					'اگر XML شما درون یک فایل باینری است، ابتدا از نود «استخراج از فایل» برای تبدیل آن به متن استفاده کنید',
				name: 'xmlNotice',
				type: 'notice',
				default: '',
				displayOptions: {
					show: {
						mode: ['xmlToJson'],
					},
				},
			},

			// ----------------------------------
			//         option:jsonToxml
			// ----------------------------------
			{
				displayName: 'نام ویژگی',
				name: 'dataPropertyName',
				type: 'string',
				displayOptions: {
					show: {
						mode: ['jsonToxml'],
					},
				},
				default: 'data',
				required: true,
				description: 'نام ویژگی که حاوی داده‌های XML تبدیل شده است',
			},
			{
				displayName: 'گزینه‌ها',
				name: 'options',
				type: 'collection',
				placeholder: 'افزودن گزینه',
				displayOptions: {
					show: {
						mode: ['jsonToxml'],
					},
				},
				default: {},
				options: [
					{
						displayName: 'اجازه کاراکترهای جایگزین',
						name: 'allowSurrogateChars',
						type: 'boolean',
						default: false,
						description: 'آیا استفاده از کاراکترها از بلوک‌های جایگزین یونیکد مجاز باشد',
					},
					{
						displayName: 'کلید ویژگی',
						name: 'attrkey',
						type: 'string',
						default: '$',
						description: 'پیشوندی که برای دسترسی به ویژگی‌ها استفاده می‌شود',
					},
					{
						displayName: 'Cdata',
						name: 'cdata',
						type: 'boolean',
						default: false,
						description:
							'آیا گره‌های متنی در &lt;![CDATA[ ... ]]&gt; پیچیده شوند به جای فرار در صورت لزوم. اگر لازم نباشد &lt;![CDATA[ ... ]]&gt; اضافه نمی‌کند.',
					},
					{
						displayName: 'کلید کاراکتر',
						name: 'charkey',
						type: 'string',
						default: '_',
						description: 'پیشوندی که برای دسترسی به محتوای کاراکتر استفاده می‌شود',
					},
					{
						displayName: 'بدون سربرگ',
						name: 'headless',
						type: 'boolean',
						default: false,
						description: 'آیا سربرگ XML حذف شود',
					},
					{
						displayName: 'نام ریشه',
						name: 'rootName',
						type: 'string',
						default: 'root',
						description: 'نام عنصر ریشه برای استفاده',
					},
				],
			},

			// ----------------------------------
			//         option:xmlToJson
			// ----------------------------------
			{
				displayName: 'نام ویژگی',
				name: 'dataPropertyName',
				type: 'string',
				displayOptions: {
					show: {
						mode: ['xmlToJson'],
					},
				},
				default: 'data',
				required: true,
				description: 'نام ویژگی که حاوی داده‌های XML برای تبدیل است',
			},
			{
				displayName: 'گزینه‌ها',
				name: 'options',
				type: 'collection',
				placeholder: 'افزودن گزینه',
				displayOptions: {
					show: {
						mode: ['xmlToJson'],
					},
				},
				default: {},
				options: [
					{
						displayName: 'کلید ویژگی',
						name: 'attrkey',
						type: 'string',
						default: '$',
						description: 'پیشوندی که برای دسترسی به ویژگی‌ها استفاده می‌شود',
					},
					{
						displayName: 'کلید کاراکتر',
						name: 'charkey',
						type: 'string',
						default: '_',
						description: 'پیشوندی که برای دسترسی به محتوای کاراکتر استفاده می‌شود',
					},
					{
						displayName: 'آرایه صریح',
						name: 'explicitArray',
						type: 'boolean',
						default: false,
						description:
							'آیا گره‌های فرزند همیشه در یک آرایه قرار داده شوند اگر true باشد؛ در غیر این صورت یک آرایه فقط در صورتی ایجاد می‌شود که بیش از یک گره وجود داشته باشد',
					},
					{
						displayName: 'ریشه صریح',
						name: 'explicitRoot',
						type: 'boolean',
						default: true,
						description:
							'آیا این گزینه تنظیم شود اگر می‌خواهید گره ریشه را در شیء نتیجه دریافت کنید',
					},
					{
						displayName: 'نادیده گرفتن ویژگی‌ها',
						name: 'ignoreAttrs',
						type: 'boolean',
						default: false,
						description: 'آیا همه ویژگی‌های XML نادیده گرفته شوند و فقط گره‌های متنی ایجاد شوند',
					},
					{
						displayName: 'ادغام ویژگی‌ها',
						name: 'mergeAttrs',
						type: 'boolean',
						default: true,
						description:
							'آیا ویژگی‌ها و عناصر فرزند به عنوان ویژگی‌های والد ادغام شوند، به جای کلیدگذاری ویژگی‌ها از یک شیء ویژگی فرزند. این گزینه اگر ignoreAttrs true باشد نادیده گرفته می‌شود.',
					},
					{
						displayName: 'عادی‌سازی',
						name: 'normalize',
						type: 'boolean',
						default: false,
						description: 'آیا فضاهای خالی داخل گره‌های متنی برش داده شوند',
					},
					{
						displayName: 'عادی‌سازی تگ‌ها',
						name: 'normalizeTags',
						type: 'boolean',
						default: false,
						description: 'آیا همه نام‌های تگ به حروف کوچک عادی‌سازی شوند',
					},
					{
						displayName: 'برش',
						name: 'trim',
						type: 'boolean',
						default: false,
						description: 'آیا فضاهای خالی در ابتدا و انتهای گره‌های متنی برش داده شوند',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		const mode = this.getNodeParameter('mode', 0) as string;
		const dataPropertyName = this.getNodeParameter('dataPropertyName', 0);
		const options = this.getNodeParameter('options', 0, {});

		let item: INodeExecutionData;
		const returnData: INodeExecutionData[] = [];
		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				item = items[itemIndex];

				if (mode === 'xmlToJson') {
					const parserOptions = Object.assign(
						{
							mergeAttrs: true,
							explicitArray: false,
						},
						options,
					);

					const parser = new Parser(parserOptions);

					if (item.json[dataPropertyName] === undefined) {
						throw new NodeOperationError(
							this.getNode(),
							`Item has no JSON property called "${dataPropertyName}"`,
							{ itemIndex },
						);
					}

					const json = await parser.parseStringPromise(item.json[dataPropertyName] as string);
					returnData.push({ json: deepCopy(json) });
				} else if (mode === 'jsonToxml') {
					const builder = new Builder(options);

					returnData.push({
						json: {
							[dataPropertyName]: builder.buildObject(items[itemIndex].json),
						},
						pairedItem: {
							item: itemIndex,
						},
					});
				} else {
					throw new NodeOperationError(this.getNode(), `The operation "${mode}" is not known!`, {
						itemIndex,
					});
				}
			} catch (error) {
				if (this.continueOnFail()) {
					items[itemIndex] = {
						json: {
							error: error.message,
						},
						pairedItem: {
							item: itemIndex,
						},
					};
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
