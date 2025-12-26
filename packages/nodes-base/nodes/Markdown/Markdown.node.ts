import isEmpty from 'lodash/isEmpty';
import set from 'lodash/set';
import type {
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';
import { NodeConnectionTypes, deepCopy } from 'n8n-workflow';
import { NodeHtmlMarkdown } from 'node-html-markdown';
import { Converter } from 'showdown';

export class Markdown implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'مارک‌داون',
		name: 'markdown',
		icon: { light: 'file:markdown.svg', dark: 'file:markdown.dark.svg' },
		group: ['output'],
		version: 1,
		subtitle:
			'={{$parameter["mode"]==="markdownToHtml" ? "مارک‌داون به HTML" : "HTML به مارک‌داون"}}',
		description: 'تبدیل داده‌ها بین Markdown و HTML',
		defaults: {
			name: 'مارک‌داون',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [],
		properties: [
			{
				displayName: 'حالت',
				name: 'mode',
				type: 'options',
				options: [
					{
						name: 'مارک‌داون به HTML',
						value: 'markdownToHtml',
						description: 'تبدیل داده‌ها از Markdown به HTML',
					},
					{
						name: 'HTML به مارک‌داون',
						value: 'htmlToMarkdown',
						description: 'تبدیل داده‌ها از HTML به Markdown',
					},
				],
				default: 'htmlToMarkdown',
			},
			{
				displayName: 'HTML',
				name: 'html',
				type: 'string',
				displayOptions: {
					show: {
						mode: ['htmlToMarkdown'],
					},
				},
				default: '',
				required: true,
				description: 'HTML برای تبدیل به مارک‌داون',
			},
			{
				displayName: 'مارک‌داون',
				name: 'markdown',
				type: 'string',
				displayOptions: {
					show: {
						mode: ['markdownToHtml'],
					},
				},
				default: '',
				required: true,
				description: 'مارک‌داون برای تبدیل به HTML',
			},
			{
				displayName: 'کلید مقصد',
				name: 'destinationKey',
				type: 'string',
				displayOptions: {
					show: {
						mode: ['markdownToHtml', 'htmlToMarkdown'],
					},
				},
				default: 'data',
				required: true,
				placeholder: '',
				description:
					'فیلدی برای قرار دادن خروجی در آن. فیلدهای تو در تو را با استفاده از نقطه مشخص کنید، مثلاً "level1.level2.newKey".',
			},

			//============= HTML to Markdown Options ===============
			{
				displayName: 'گزینه‌ها',
				name: 'options',
				type: 'collection',
				placeholder: 'افزودن گزینه',
				default: {},
				displayOptions: {
					show: {
						mode: ['htmlToMarkdown'],
					},
				},
				options: [
					{
						displayName: 'نشانگر گلوله',
						name: 'bulletMarker',
						type: 'string',
						default: '*',
						description: 'مشخص کردن نشانگر گلوله، پیش‌فرض *',
					},
					{
						displayName: 'حصار بلوک کد',
						name: 'codeFence',
						type: 'string',
						default: '```',
						description: 'مشخص کردن حصار بلوک کد، پیش‌فرض ```',
					},
					{
						displayName: 'جداکننده تاکید',
						name: 'emDelimiter',
						type: 'string',
						default: '_',
						description: 'مشخص کردن جداکننده تاکید، پیش‌فرض _',
					},
					{
						displayName: 'الگوی فرار سراسری',
						name: 'globalEscape',
						type: 'fixedCollection',
						typeOptions: {
							multipleValues: false,
						},
						default: {},
						description:
							'تنظیم این گزینه تنظیمات پیش‌فرض فرار را لغو می‌کند، ممکن است بخواهید به جای آن از گزینه textReplace استفاده کنید',
						options: [
							{
								name: 'value',
								displayName: 'مقدار',
								values: [
									{
										displayName: 'الگو',
										name: 'pattern',
										type: 'string',
										default: '',
										description: 'RegEx برای الگو',
									},
									{
										displayName: 'جایگزینی',
										name: 'replacement',
										type: 'string',
										default: '',
										description: 'جایگزینی رشته',
									},
								],
							},
						],
					},
					{
						displayName: 'عناصر نادیده گرفته شده',
						name: 'ignore',
						type: 'string',
						default: '',
						description:
							'عناصر ارائه شده نادیده گرفته می‌شوند (متن داخلی را نادیده می‌گیرد و فرزندان را تجزیه نمی‌کند)',
						placeholder: 'مثلاً h1, p ...',
						hint: 'عناصر جدا شده با کاما',
					},
					{
						displayName: 'حفظ تصاویر با داده',
						name: 'keepDataImages',
						type: 'boolean',
						default: false,
						description:
							'آیا تصاویر با URI داده حفظ شوند (توجه: اینها می‌توانند تا 1 مگابایت باشند)، مثلاً &lt;img src="data:image/gif;base64,R0lGODlhEAAQAMQAAORHHOVSK......0o/"&gt;',
					},
					{
						displayName: 'الگوی فرار شروع خط',
						name: 'lineStartEscape',
						type: 'fixedCollection',
						typeOptions: {
							multipleValues: false,
						},
						default: {},
						description:
							'تنظیم این گزینه تنظیمات پیش‌فرض فرار را لغو می‌کند، ممکن است بخواهید به جای آن از گزینه textReplace استفاده کنید',
						options: [
							{
								name: 'value',
								displayName: 'مقدار',
								values: [
									{
										displayName: 'الگو',
										name: 'pattern',
										type: 'string',
										default: '',
										description: 'RegEx برای الگو',
									},
									{
										displayName: 'جایگزینی',
										name: 'replacement',
										type: 'string',
										default: '',
										description: 'جایگزینی رشته',
									},
								],
							},
						],
					},
					{
						displayName: 'حداکثر خطوط جدید متوالی',
						name: 'maxConsecutiveNewlines',
						type: 'number',
						default: 3,
						description: 'مشخص کردن حداکثر خطوط جدید متوالی مجاز',
					},
					{
						displayName: 'قرار دادن URLها در پایین',
						name: 'useLinkReferenceDefinitions',
						type: 'boolean',
						default: false,
						description:
							'آیا URLها در پایین قرار داده شوند و لینک‌ها با استفاده از تعاریف مرجع لینک فرمت شوند',
					},
					{
						displayName: 'جداکننده قوی',
						name: 'strongDelimiter',
						type: 'string',
						default: '**',
						description: 'مشخص کردن جداکننده قوی، پیش‌فرض **',
					},
					{
						displayName: 'استایل برای بلوک کد',
						name: 'codeBlockStyle',
						type: 'options',
						default: 'fence',
						description: 'مشخص کردن استایل برای بلوک کد، پیش‌فرض "fence"',
						options: [
							{
								name: 'حصار',
								value: 'fence',
							},
							{
								name: 'تورفتگی',
								value: 'indented',
							},
						],
					},
					{
						displayName: 'الگوی جایگزینی متن',
						name: 'textReplace',
						type: 'fixedCollection',
						typeOptions: {
							multipleValues: true,
						},
						default: [],
						description: 'الگوی جایگزینی متن تعریف شده توسط کاربر (جایگزینی متن مطابق با گره‌ها)',
						options: [
							{
								name: 'values',
								displayName: 'مقادیر',
								values: [
									{
										displayName: 'الگو',
										name: 'pattern',
										type: 'string',
										default: '',
										description: 'RegEx برای الگو',
									},
									{
										displayName: 'جایگزینی',
										name: 'replacement',
										type: 'string',
										default: '',
										description: 'جایگزینی رشته',
									},
								],
							},
						],
					},
					{
						displayName: 'رفتار به عنوان بلوک',
						name: 'blockElements',
						type: 'string',
						default: '',
						description:
							'عناصر ارائه شده به عنوان بلوک در نظر گرفته می‌شوند (با خطوط خالی احاطه شده‌اند)',
						placeholder: 'مثلاً p, div, ...',
						hint: 'عناصر جدا شده با کاما',
					},
				],
			},
			//============= Markdown to HTML Options ===============
			{
				displayName: 'گزینه‌ها',
				name: 'options',
				type: 'collection',
				placeholder: 'افزودن گزینه',
				default: {},
				displayOptions: {
					show: {
						mode: ['markdownToHtml'],
					},
				},
				options: [
					{
						displayName: 'افزودن Blank به لینک‌ها',
						name: 'openLinksInNewWindow',
						type: 'boolean',
						default: false,
						description:
							'آیا همه لینک‌ها در پنجره‌های جدید باز شوند (با افزودن ویژگی target="_blank" به تگ‌های &lt;a&gt;)',
					},
					{
						displayName: 'لینک‌سازی خودکار به URLها',
						name: 'simplifiedAutoLink',
						type: 'boolean',
						default: false,
						description: 'آیا لینک‌سازی خودکار به URLها فعال شود',
					},
					{
						displayName: 'بک‌اسلش تگ‌های HTML را فرار می‌دهد',
						name: 'backslashEscapesHTMLTags',
						type: 'boolean',
						default: false,
						description:
							'آیا پشتیبانی از فرار تگ‌های HTML فعال شود، مثلاً &lt;div&gt;foo&lt;/div&gt;',
					},
					{
						displayName: 'سند HTML کامل',
						name: 'completeHTMLDocument',
						type: 'boolean',
						default: false,
						description:
							'آیا یک سند HTML کامل، شامل تگ‌های &lt;html&gt;، &lt;head&gt; و &lt;body&gt; به جای یک قطعه HTML خروجی داده شود',
					},
					{
						displayName: 'شناسه سربرگ سفارشی',
						name: 'customizedHeaderId',
						type: 'boolean',
						default: false,
						description: 'آیا از متن در آکولاد به عنوان شناسه سربرگ استفاده شود',
					},
					{
						displayName: 'پشتیبانی از ایموجی',
						name: 'emoji',
						type: 'boolean',
						default: false,
						description:
							'آیا پشتیبانی از ایموجی فعال شود. مثلاً: این یک :smile: ایموجی است. برای اطلاعات بیشتر در مورد ایموجی‌های موجود، به https://github.com/showdownjs/showdown/wiki/Emojis مراجعه کنید.',
					},
					{
						displayName: 'کدگذاری ایمیل‌ها',
						name: 'encodeEmails',
						type: 'boolean',
						default: true,
						description:
							'آیا کدگذاری آدرس‌های ایمیل از طریق استفاده از موجودیت‌های کاراکتر فعال شود، تبدیل آدرس‌های ایمیل ASCII به موجودیت‌های اعشاری معادل آن',
					},
					{
						displayName: 'حذف علائم نگارشی انتهایی از URLها',
						name: 'excludeTrailingPunctuationFromURLs',
						type: 'boolean',
						default: false,
						description:
							'آیا علائم نگارشی انتهایی از URLهای خودکار حذف شوند. علائم نگارشی حذف شده: . ! ? ( ). فقط در صورتی اعمال می‌شود که گزینه simplifiedAutoLink روی true تنظیم شده باشد.',
					},
					{
						displayName: 'بلوک‌های کد GitHub',
						name: 'ghCodeBlocks',
						type: 'boolean',
						default: true,
						description: 'آیا پشتیبانی از استایل بلوک کد GFM فعال شود',
					},
					{
						displayName: 'شناسه‌های سربرگ سازگار با GitHub',
						name: 'ghCompatibleHeaderId',
						type: 'boolean',
						default: false,
						description:
							'آیا شناسه‌های سربرگ سازگار با استایل GitHub تولید شوند (فضاها با خط تیره جایگزین می‌شوند و تعدادی از کاراکترهای غیر الفبایی حذف می‌شوند)',
					},
					{
						displayName: 'لینک اشاره GitHub',
						name: 'ghMentionsLink',
						type: 'string',
						default: 'https://github.com/{u}',
						description:
							'آیا لینک تولید شده توسط @اشاره‌ها تغییر کند. Showdown {u} را با نام کاربری جایگزین می‌کند. فقط در صورتی اعمال می‌شود که گزینه ghMentions فعال باشد.',
					},
					{
						displayName: 'اشاره‌های GitHub',
						name: 'ghMentions',
						type: 'boolean',
						default: false,
						description: 'آیا @اشاره‌های GitHub فعال شوند، که به نام کاربری اشاره شده لینک می‌دهند',
					},
					{
						displayName: 'لیست‌های وظایف GitHub',
						name: 'tasklists',
						type: 'boolean',
						default: false,
						description: 'آیا پشتیبانی از لیست‌های وظایف GFM فعال شود',
					},
					{
						displayName: 'سطح شروع سربرگ',
						name: 'headerLevelStart',
						type: 'number',
						default: 1,
						description: 'آیا سطح شروع سربرگ تنظیم شود',
					},
					{
						displayName: 'فضای اجباری قبل از سربرگ',
						name: 'requireSpaceBeforeHeadingText',
						type: 'boolean',
						default: false,
						description: 'آیا افزودن یک فاصله بین # و متن سربرگ اجباری شود',
					},
					{
						displayName: 'ستاره‌های میانی کلمه',
						name: 'literalMidWordAsterisks',
						type: 'boolean',
						default: false,
						description:
							'آیا Showdown از تفسیر ستاره‌ها در وسط کلمات به عنوان &lt;em&gt; و &lt;strong&gt; جلوگیری کند و به جای آن آنها را به عنوان ستاره‌های واقعی در نظر بگیرد',
					},
					{
						displayName: 'زیرخط‌های میانی کلمه',
						name: 'literalMidWordUnderscores',
						type: 'boolean',
						default: false,
						description:
							'آیا Showdown از تفسیر زیرخط‌ها در وسط کلمات به عنوان &lt;em&gt; و &lt;strong&gt; جلوگیری کند و به جای آن آنها را به عنوان زیرخط‌های واقعی در نظر بگیرد',
					},
					{
						displayName: 'بدون شناسه سربرگ',
						name: 'noHeaderId',
						type: 'boolean',
						default: false,
						description: 'آیا تولید خودکار شناسه‌های سربرگ غیرفعال شود',
					},
					{
						displayName: 'تجزیه ابعاد تصویر',
						name: 'parseImgDimensions',
						type: 'boolean',
						default: false,
						description: 'آیا پشتیبانی از تنظیم ابعاد تصویر از داخل سینتکس مارک‌داون فعال شود',
					},
					{
						displayName: 'پیشوند شناسه سربرگ',
						name: 'prefixHeaderId',
						type: 'string',
						default: 'section',
						description: 'افزودن یک پیشوند به شناسه‌های سربرگ تولید شده',
					},
					{
						displayName: 'شناسه سربرگ خام',
						name: 'rawHeaderId',
						type: 'boolean',
						default: false,
						description:
							'آیا فقط فضاها، \' و " از شناسه‌های سربرگ تولید شده حذف شوند، جایگزینی آنها با خط تیره (-)',
					},
					{
						displayName: 'پیشوند شناسه سربرگ خام',
						name: 'rawPrefixHeaderId',
						type: 'boolean',
						default: false,
						description: 'آیا Showdown از تغییر پیشوند جلوگیری کند',
					},
					{
						displayName: 'شکست خطوط ساده',
						name: 'simpleLineBreaks',
						type: 'boolean',
						default: false,
						description:
							'آیا شکست خطوط به عنوان &lt;br&gt; تجزیه شوند، مانند GitHub، بدون نیاز به 2 فاصله در انتهای خط',
					},
					{
						displayName: 'رفع تورفتگی هوشمند',
						name: 'smartIndentationFix',
						type: 'boolean',
						default: false,
						description:
							'آیا سعی شود مشکلات تورفتگی مربوط به رشته‌های قالب es6 در میان کدهای تورفته به طور هوشمندانه رفع شود',
					},
					{
						displayName: 'زیرلیست‌های تورفته با فاصله',
						name: 'disableForced4SpacesIndentedSublists',
						type: 'boolean',
						default: false,
						description:
							'آیا نیاز به تورفتگی زیرلیست‌ها با 4 فاصله برای تو در تو شدن غیرفعال شود، در واقع بازگشت به رفتار قدیمی که 2 یا 3 فاصله کافی بود',
					},
					{
						displayName: 'تقسیم بلوک‌های نقل قول مجاور',
						name: 'splitAdjacentBlockquotes',
						type: 'boolean',
						default: false,
						description: 'آیا بلوک‌های نقل قول مجاور تقسیم شوند',
					},
					{
						displayName: 'خط‌خوردگی',
						name: 'strikethrough',
						type: 'boolean',
						default: false,
						description: 'آیا پشتیبانی از سینتکس خط‌خوردگی فعال شود',
					},
					{
						displayName: 'شناسه سربرگ جداول',
						name: 'tablesHeaderId',
						type: 'boolean',
						default: false,
						description: 'آیا یک ویژگی ID به تگ‌های سربرگ جدول اضافه شود',
					},
					{
						displayName: 'پشتیبانی از جداول',
						name: 'tables',
						type: 'boolean',
						default: false,
						description: 'آیا پشتیبانی از سینتکس جداول فعال شود',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: IDataObject[] = [];
		const mode = this.getNodeParameter('mode', 0) as string;

		const { length } = items;
		for (let i = 0; i < length; i++) {
			try {
				if (mode === 'htmlToMarkdown') {
					const options = this.getNodeParameter('options', i);
					const destinationKey = this.getNodeParameter('destinationKey', i) as string;

					const textReplaceOption = this.getNodeParameter(
						'options.textReplace.values',
						i,
						[],
					) as IDataObject[];
					options.textReplace = !isEmpty(textReplaceOption)
						? textReplaceOption.map((entry) => [entry.pattern, entry.replacement])
						: undefined;

					const lineStartEscapeOption = this.getNodeParameter(
						'options.lineStartEscape.value',
						i,
						{},
					) as IDataObject;
					options.lineStartEscape = !isEmpty(lineStartEscapeOption)
						? [lineStartEscapeOption.pattern, lineStartEscapeOption.replacement]
						: undefined;

					const globalEscapeOption = this.getNodeParameter(
						'options.globalEscape.value',
						i,
						{},
					) as IDataObject;
					options.globalEscape = !isEmpty(globalEscapeOption)
						? [globalEscapeOption.pattern, globalEscapeOption.replacement]
						: undefined;

					options.ignore = options.ignore
						? (options.ignore as string).split(',').map((element) => element.trim())
						: undefined;
					options.blockElements = options.blockElements
						? (options.blockElements as string).split(',').map((element) => element.trim())
						: undefined;

					const markdownOptions = {} as IDataObject;

					Object.keys(options).forEach((option) => {
						if (options[option]) {
							markdownOptions[option] = options[option];
						}
					});

					const html = this.getNodeParameter('html', i) as string;

					const markdownFromHTML = NodeHtmlMarkdown.translate(html, markdownOptions);

					const newItem = deepCopy(items[i].json);
					set(newItem, destinationKey, markdownFromHTML);
					returnData.push(newItem);
				}

				if (mode === 'markdownToHtml') {
					const markdown = this.getNodeParameter('markdown', i) as string;
					const destinationKey = this.getNodeParameter('destinationKey', i) as string;
					const options = this.getNodeParameter('options', i);

					const converter = new Converter();

					Object.keys(options).forEach((key) => converter.setOption(key, options[key]));
					const htmlFromMarkdown = converter.makeHtml(markdown);

					const newItem = deepCopy(items[i].json);
					set(newItem, destinationKey, htmlFromMarkdown);

					returnData.push(newItem);
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ error: (error as JsonObject).message });
					continue;
				}
				throw error;
			}
		}
		return [this.helpers.returnJsonArray(returnData)];
	}
}
