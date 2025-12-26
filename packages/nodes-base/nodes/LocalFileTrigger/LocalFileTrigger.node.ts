import { watch } from 'chokidar';
import type { EventName } from 'chokidar/handler';
import {
	type ITriggerFunctions,
	type IDataObject,
	type INodeType,
	type INodeTypeDescription,
	type ITriggerResponse,
	NodeConnectionTypes,
} from 'n8n-workflow';

export class LocalFileTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'تریگر فایل محلی',
		name: 'localFileTrigger',
		icon: 'fa:folder-open',
		iconColor: 'black',
		group: ['trigger'],
		version: 1,
		subtitle: '=مسیر: {{$parameter["path"]}}',
		description: 'گردش کار را بر روی تغییرات سیستم فایل تریگر می‌کند',
		eventTriggerDescription: '',
		defaults: {
			name: 'تریگر فایل محلی',
			color: '#404040',
		},
		triggerPanel: {
			header: '',
			executionsHelp: {
				inactive:
					"<b>در حین ساخت گردش کار خود</b>، روی دکمه 'اجرای مرحله' کلیک کنید، سپس تغییری در فایل یا پوشه تحت نظارت خود ایجاد کنید. این یک اجرا را تریگر می‌کند که در این ویرایشگر نمایش داده خواهد شد.<br /> <br /><b>پس از رضایت از گردش کار خود</b>، آن را منتشر کنید. سپس هر بار که تغییری تشخیص داده شود، گردش کار اجرا خواهد شد. این اجراها در <a data-key='executions'>فهرست اجراها</a> نمایش داده می‌شوند، اما در ویرایشگر نمایش داده نمی‌شوند.",
				active:
					"<b>در حین ساخت گردش کار خود</b>، روی دکمه 'اجرای مرحله' کلیک کنید، سپس تغییری در فایل یا پوشه تحت نظارت خود ایجاد کنید. این یک اجرا را تریگر می‌کند که در این ویرایشگر نمایش داده خواهد شد.<br /> <br /><b>گردش کار شما همچنین به طور خودکار اجرا خواهد شد</b>، زیرا فعال شده است. هر بار که تغییری تشخیص داده شود، این نود یک اجرا را تریگر می‌کند. این اجراها در <a data-key='executions'>فهرست اجراها</a> نمایش داده می‌شوند، اما در ویرایشگر نمایش داده نمی‌شوند.",
			},
			activationHint:
				'پس از اتمام ساخت گردش کار خود، آن را منتشر کنید تا به طور مداوم گوش دهد (فقط آن اجراها را در اینجا نخواهید دید).',
		},
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		properties: [
			{
				displayName: 'تریگر بر اساس',
				name: 'triggerOn',
				type: 'options',
				options: [
					{
						name: 'تغییرات در یک فایل مشخص',
						value: 'file',
					},
					{
						name: 'تغییرات مربوط به یک پوشه مشخص',
						value: 'folder',
					},
				],
				required: true,
				default: '',
			},
			{
				displayName: 'فایل برای نظارت',
				name: 'path',
				type: 'string',
				displayOptions: {
					show: {
						triggerOn: ['file'],
					},
				},
				default: '',
				placeholder: '/data/invoices/1.pdf',
			},
			{
				displayName: 'پوشه برای نظارت',
				name: 'path',
				type: 'string',
				displayOptions: {
					show: {
						triggerOn: ['folder'],
					},
				},
				default: '',
				placeholder: '/data/invoices',
			},
			{
				displayName: 'نظارت برای',
				name: 'events',
				type: 'multiOptions',
				displayOptions: {
					show: {
						triggerOn: ['folder'],
					},
				},
				options: [
					{
						name: 'فایل اضافه شد',
						value: 'add',
						description: 'زمانی تریگر می‌شود که یک فایل جدید اضافه شود',
					},
					{
						name: 'فایل تغییر کرد',
						value: 'change',
						description: 'زمانی تریگر می‌شود که یک فایل تغییر کند',
					},
					{
						name: 'فایل حذف شد',
						value: 'unlink',
						description: 'زمانی تریگر می‌شود که یک فایل حذف شود',
					},
					{
						name: 'پوشه اضافه شد',
						value: 'addDir',
						description: 'زمانی تریگر می‌شود که یک پوشه جدید اضافه شود',
					},
					{
						name: 'پوشه حذف شد',
						value: 'unlinkDir',
						description: 'زمانی تریگر می‌شود که یک پوشه حذف شود',
					},
				],
				required: true,
				default: [],
				description: 'رویدادهایی که باید به آنها گوش داد',
			},

			{
				displayName: 'گزینه‌ها',
				name: 'options',
				type: 'collection',
				placeholder: 'افزودن گزینه',
				default: {},
				options: [
					{
						displayName: 'انتظار برای پایان نوشتن',
						name: 'awaitWriteFinish',
						type: 'boolean',
						default: false,
						description: 'آیا تا پایان نوشتن فایل‌ها صبر کند تا از خواندن ناقص جلوگیری شود',
					},
					{
						displayName: 'شامل فایل‌ها/پوشه‌های پیوندی',
						name: 'followSymlinks',
						type: 'boolean',
						default: true,
						description:
							'آیا فایل‌ها/پوشه‌های پیوندی نیز نظارت شوند (این شامل symlinkها، aliasها در MacOS و میانبرها در Windows می‌شود). در غیر این صورت فقط خود پیوندها نظارت می‌شوند).',
					},
					{
						displayName: 'نادیده گرفتن',
						name: 'ignored',
						type: 'string',
						default: '',
						placeholder: '**/*.txt یا ignore-me/subfolder',
						description:
							"فایل‌ها یا مسیرهایی که باید نادیده گرفته شوند. کل مسیر تست می‌شود، نه فقط نام فایل. از سینتکس <a href=\"https://github.com/micromatch/anymatch\">Anymatch</a> پشتیبانی می‌کند. الگوهای regex ممکن است در macOS کار نکنند. برای نادیده گرفتن فایل‌ها بر اساس تطابق زیررشته، از گزینه 'حالت نادیده گرفتن' با 'شامل' استفاده کنید.",
					},
					{
						displayName: 'نادیده گرفتن فایل‌ها/پوشه‌های موجود',
						name: 'ignoreInitial',
						type: 'boolean',
						default: true,
						description: 'آیا فایل‌ها/پوشه‌های موجود نادیده گرفته شوند تا رویدادی تریگر نشود',
					},
					{
						displayName: 'حداکثر عمق پوشه',
						name: 'depth',
						type: 'options',
						options: [
							{
								name: '1 سطح پایین',
								value: 1,
							},
							{
								name: '2 سطح پایین',
								value: 2,
							},
							{
								name: '3 سطح پایین',
								value: 3,
							},
							{
								name: '4 سطح پایین',
								value: 4,
							},
							{
								name: '5 سطح پایین',
								value: 5,
							},
							{
								name: 'فقط پوشه بالا',
								value: 0,
							},
							{
								name: 'نامحدود',
								value: -1,
							},
						],
						default: -1,
						description: 'چقدر عمیق در ساختار پوشه برای نظارت بر تغییرات',
					},
					{
						displayName: 'استفاده از نظرسنجی',
						name: 'usePolling',
						type: 'boolean',
						default: false,
						description:
							'آیا از نظرسنجی برای نظارت استفاده شود. معمولاً برای نظارت موفق بر فایل‌ها از طریق شبکه ضروری است.',
					},
					{
						displayName: 'حالت نادیده گرفتن',
						name: 'ignoreMode',
						type: 'options',
						options: [
							{
								name: 'تطابق',
								value: 'match',
								description:
									'نادیده گرفتن فایل‌ها با استفاده از الگوهای regex (مثلاً **/*.txt)، در macOS پشتیبانی نمی‌شود',
							},
							{
								name: 'شامل',
								value: 'contain',
								description: 'نادیده گرفتن فایل‌ها اگر مسیر آنها شامل مقدار مشخص شده باشد',
							},
						],
						default: 'match',
						description:
							'آیا فایل‌ها با استفاده از تطابق regex (الگوهای Anymatch) نادیده گرفته شوند یا با بررسی اینکه آیا مسیر شامل یک مقدار مشخص شده است',
					},
				],
			},
		],
	};

	async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
		const triggerOn = this.getNodeParameter('triggerOn') as string;
		const path = this.getNodeParameter('path') as string;
		const options = this.getNodeParameter('options', {}) as IDataObject;

		let events: EventName[];
		if (triggerOn === 'file') {
			events = ['change'];
		} else {
			events = this.getNodeParameter('events', []) as EventName[];
		}
		const ignored = options.ignored === '' ? undefined : (options.ignored as string);
		const watcher = watch(path, {
			ignored: options.ignoreMode === 'match' ? ignored : (x) => x.includes(ignored as string),
			persistent: true,
			ignoreInitial:
				options.ignoreInitial === undefined ? true : (options.ignoreInitial as boolean),
			followSymlinks:
				options.followSymlinks === undefined ? true : (options.followSymlinks as boolean),
			depth: [-1, undefined].includes(options.depth as number)
				? undefined
				: (options.depth as number),
			usePolling: options.usePolling as boolean,
			awaitWriteFinish: options.awaitWriteFinish as boolean,
		});

		const executeTrigger = (event: string, pathString: string) => {
			this.emit([this.helpers.returnJsonArray([{ event, path: pathString }])]);
		};

		for (const eventName of events) {
			watcher.on(eventName, (pathString: string) => executeTrigger(eventName, pathString));
		}

		async function closeFunction() {
			return await watcher.close();
		}

		return {
			closeFunction,
		};
	}
}
