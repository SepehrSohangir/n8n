import { writeFile as fsWriteFile } from 'fs/promises';
import getSystemFonts from 'get-system-fonts';
import gm from 'gm';
import type {
	IDataObject,
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodeProperties,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError, NodeConnectionTypes, deepCopy } from 'n8n-workflow';
import { parse as pathParse } from 'path';
import { file } from 'tmp-promise';

const nodeOperations: INodePropertyOptions[] = [
	{
		name: 'تار کردن',
		value: 'blur',
		description: 'تاری به تصویر اضافه می‌کند و آن را کمتر واضح می‌کند',
		action: 'تار کردن تصویر',
	},
	{
		name: 'حاشیه',
		value: 'border',
		description: 'حاشیه به تصویر اضافه می‌کند',
		action: 'حاشیه تصویر',
	},
	{
		name: 'ترکیب',
		value: 'composite',
		description: 'ترکیب تصویر روی تصویر دیگر',
		action: 'ترکیب تصویر',
	},
	{
		name: 'ایجاد',
		value: 'create',
		description: 'ایجاد یک تصویر جدید',
		action: 'ایجاد تصویر',
	},
	{
		name: 'برش',
		value: 'crop',
		description: 'برش تصویر',
		action: 'برش تصویر',
	},
	{
		name: 'رسم',
		value: 'draw',
		description: 'رسم روی تصویر',
		action: 'رسم تصویر',
	},
	{
		name: 'چرخش',
		value: 'rotate',
		description: 'چرخش تصویر',
		action: 'چرخش تصویر',
	},
	{
		name: 'تغییر اندازه',
		value: 'resize',
		description: 'تغییر اندازه تصویر',
		action: 'تغییر اندازه تصویر',
	},
	{
		name: 'برش مایل',
		value: 'shear',
		description: 'برش مایل تصویر در امتداد محور X یا Y',
		action: 'برش مایل تصویر',
	},
	{
		name: 'متن',
		value: 'text',
		description: 'افزودن متن به تصویر',
		action: 'اعمال متن به تصویر',
	},
	{
		name: 'شفاف',
		value: 'transparent',
		description: 'شفاف کردن یک رنگ در تصویر',
		action: 'افزودن شفافیت به تصویر',
	},
];

const nodeOperationOptions: INodeProperties[] = [
	// ----------------------------------
	//         create
	// ----------------------------------
	{
		displayName: 'رنگ پس‌زمینه',
		name: 'backgroundColor',
		type: 'color',
		default: '#ffffff00',
		typeOptions: {
			showAlpha: true,
		},
		displayOptions: {
			show: {
				operation: ['create'],
			},
		},
		description: 'رنگ پس‌زمینه تصویری که باید ایجاد شود',
	},
	{
		displayName: 'عرض تصویر',
		name: 'width',
		type: 'number',
		default: 50,
		typeOptions: {
			minValue: 1,
		},
		displayOptions: {
			show: {
				operation: ['create'],
			},
		},
		description: 'عرض تصویری که باید ایجاد شود',
	},
	{
		displayName: 'ارتفاع تصویر',
		name: 'height',
		type: 'number',
		default: 50,
		typeOptions: {
			minValue: 1,
		},
		displayOptions: {
			show: {
				operation: ['create'],
			},
		},
		description: 'ارتفاع تصویری که باید ایجاد شود',
	},

	// ----------------------------------
	//         draw
	// ----------------------------------
	{
		displayName: 'شکل اولیه',
		name: 'primitive',
		type: 'options',
		displayOptions: {
			show: {
				operation: ['draw'],
			},
		},
		options: [
			{
				name: 'دایره',
				value: 'circle',
			},
			{
				name: 'خط',
				value: 'line',
			},
			{
				name: 'مستطیل',
				value: 'rectangle',
			},
		],
		default: 'rectangle',
		description: 'شکل اولیه برای رسم',
	},
	{
		displayName: 'رنگ',
		name: 'color',
		type: 'color',
		default: '#ff000000',
		typeOptions: {
			showAlpha: true,
		},
		displayOptions: {
			show: {
				operation: ['draw'],
			},
		},
		description: 'رنگ شکل اولیه برای رسم',
	},
	{
		displayName: 'موقعیت شروع X',
		name: 'startPositionX',
		type: 'number',
		default: 50,
		displayOptions: {
			show: {
				operation: ['draw'],
				primitive: ['circle', 'line', 'rectangle'],
			},
		},
		description: 'موقعیت شروع X (افقی) شکل اولیه',
	},
	{
		displayName: 'موقعیت شروع Y',
		name: 'startPositionY',
		type: 'number',
		default: 50,
		displayOptions: {
			show: {
				operation: ['draw'],
				primitive: ['circle', 'line', 'rectangle'],
			},
		},
		description: 'موقعیت شروع Y (عمودی) شکل اولیه',
	},
	{
		displayName: 'موقعیت پایان X',
		name: 'endPositionX',
		type: 'number',
		default: 250,
		displayOptions: {
			show: {
				operation: ['draw'],
				primitive: ['circle', 'line', 'rectangle'],
			},
		},
		description: 'موقعیت پایان X (افقی) شکل اولیه',
	},
	{
		displayName: 'موقعیت پایان Y',
		name: 'endPositionY',
		type: 'number',
		default: 250,
		displayOptions: {
			show: {
				operation: ['draw'],
				primitive: ['circle', 'line', 'rectangle'],
			},
		},
		description: 'موقعیت پایان Y (عمودی) شکل اولیه',
	},
	{
		displayName: 'شعاع گوشه',
		name: 'cornerRadius',
		type: 'number',
		default: 0,
		displayOptions: {
			show: {
				operation: ['draw'],
				primitive: ['rectangle'],
			},
		},
		description: 'شعاع گوشه برای ایجاد گوشه‌های گرد',
	},

	// ----------------------------------
	//         text
	// ----------------------------------
	{
		displayName: 'متن',
		name: 'text',
		typeOptions: {
			rows: 5,
		},
		type: 'string',
		default: '',
		placeholder: 'متن برای رندر',
		displayOptions: {
			show: {
				operation: ['text'],
			},
		},
		description: 'متن برای نوشتن روی تصویر',
	},
	{
		displayName: 'اندازه فونت',
		name: 'fontSize',
		type: 'number',
		default: 18,
		displayOptions: {
			show: {
				operation: ['text'],
			},
		},
		description: 'اندازه متن',
	},
	{
		displayName: 'رنگ فونت',
		name: 'fontColor',
		type: 'color',
		default: '#000000',
		displayOptions: {
			show: {
				operation: ['text'],
			},
		},
		description: 'رنگ متن',
	},
	{
		displayName: 'موقعیت X',
		name: 'positionX',
		type: 'number',
		default: 50,
		displayOptions: {
			show: {
				operation: ['text'],
			},
		},
		description: 'موقعیت X (افقی) متن',
	},
	{
		displayName: 'موقعیت Y',
		name: 'positionY',
		type: 'number',
		default: 50,
		displayOptions: {
			show: {
				operation: ['text'],
			},
		},
		description: 'موقعیت Y (عمودی) متن',
	},
	{
		displayName: 'حداکثر طول خط',
		name: 'lineLength',
		type: 'number',
		typeOptions: {
			minValue: 1,
		},
		default: 80,
		displayOptions: {
			show: {
				operation: ['text'],
			},
		},
		description: 'حداکثر تعداد کاراکترها در یک خط قبل از افزودن شکست خط',
	},

	// ----------------------------------
	//         blur
	// ----------------------------------
	{
		displayName: 'تار کردن',
		name: 'blur',
		type: 'number',
		typeOptions: {
			minValue: 0,
			maxValue: 1000,
		},
		default: 5,
		displayOptions: {
			show: {
				operation: ['blur'],
			},
		},
		description: 'میزان تاری',
	},
	{
		displayName: 'سیگما',
		name: 'sigma',
		type: 'number',
		typeOptions: {
			minValue: 0,
			maxValue: 1000,
		},
		default: 2,
		displayOptions: {
			show: {
				operation: ['blur'],
			},
		},
		description: 'سیگما تاری',
	},

	// ----------------------------------
	//         border
	// ----------------------------------
	{
		displayName: 'عرض حاشیه',
		name: 'borderWidth',
		type: 'number',
		default: 10,
		displayOptions: {
			show: {
				operation: ['border'],
			},
		},
		description: 'عرض حاشیه',
	},
	{
		displayName: 'ارتفاع حاشیه',
		name: 'borderHeight',
		type: 'number',
		default: 10,
		displayOptions: {
			show: {
				operation: ['border'],
			},
		},
		description: 'ارتفاع حاشیه',
	},
	{
		displayName: 'رنگ حاشیه',
		name: 'borderColor',
		type: 'color',
		default: '#000000',
		displayOptions: {
			show: {
				operation: ['border'],
			},
		},
		description: 'رنگ حاشیه',
	},

	// ----------------------------------
	//         composite
	// ----------------------------------
	{
		displayName: 'ویژگی تصویر ترکیبی',
		name: 'dataPropertyNameComposite',
		type: 'string',
		default: '',
		placeholder: 'data2',
		displayOptions: {
			show: {
				operation: ['composite'],
			},
		},
		description:
			'نام ویژگی باینری که حاوی داده‌های تصویری است که باید روی تصویری که در نام ویژگی یافت می‌شود، ترکیب شود',
	},
	{
		displayName: 'عملگر',
		name: 'operator',
		type: 'options',
		displayOptions: {
			show: {
				operation: ['composite'],
			},
		},
		options: [
			{
				name: 'Add',
				value: 'Add',
			},
			{
				name: 'Atop',
				value: 'Atop',
			},
			{
				name: 'Bumpmap',
				value: 'Bumpmap',
			},
			{
				name: 'Copy',
				value: 'Copy',
			},
			{
				name: 'Copy Black',
				value: 'CopyBlack',
			},
			{
				name: 'Copy Blue',
				value: 'CopyBlue',
			},
			{
				name: 'Copy Cyan',
				value: 'CopyCyan',
			},
			{
				name: 'Copy Green',
				value: 'CopyGreen',
			},
			{
				name: 'Copy Magenta',
				value: 'CopyMagenta',
			},
			{
				name: 'Copy Opacity',
				value: 'CopyOpacity',
			},
			{
				name: 'Copy Red',
				value: 'CopyRed',
			},
			{
				name: 'Copy Yellow',
				value: 'CopyYellow',
			},
			{
				name: 'Difference',
				value: 'Difference',
			},
			{
				name: 'Divide',
				value: 'Divide',
			},
			{
				name: 'In',
				value: 'In',
			},
			{
				name: 'Minus',
				value: 'Minus',
			},
			{
				name: 'Multiply',
				value: 'Multiply',
			},
			{
				name: 'Out',
				value: 'Out',
			},
			{
				name: 'Over',
				value: 'Over',
			},
			{
				name: 'Plus',
				value: 'Plus',
			},
			{
				name: 'Subtract',
				value: 'Subtract',
			},
			{
				name: 'Xor',
				value: 'Xor',
			},
		],
		default: 'Over',
		description: 'عملگر برای ترکیب تصاویر',
	},
	{
		displayName: 'موقعیت X',
		name: 'positionX',
		type: 'number',
		default: 0,
		displayOptions: {
			show: {
				operation: ['composite'],
			},
		},
		description: 'موقعیت X (افقی) تصویر ترکیبی',
	},
	{
		displayName: 'موقعیت Y',
		name: 'positionY',
		type: 'number',
		default: 0,
		displayOptions: {
			show: {
				operation: ['composite'],
			},
		},
		description: 'موقعیت Y (عمودی) تصویر ترکیبی',
	},

	// ----------------------------------
	//         crop
	// ----------------------------------
	{
		displayName: 'عرض',
		name: 'width',
		type: 'number',
		default: 500,
		displayOptions: {
			show: {
				operation: ['crop'],
			},
		},
		description: 'عرض برش',
	},
	{
		displayName: 'ارتفاع',
		name: 'height',
		type: 'number',
		default: 500,
		displayOptions: {
			show: {
				operation: ['crop'],
			},
		},
		description: 'ارتفاع برش',
	},
	{
		displayName: 'موقعیت X',
		name: 'positionX',
		type: 'number',
		default: 0,
		displayOptions: {
			show: {
				operation: ['crop'],
			},
		},
		description: 'موقعیت X (افقی) برای برش از',
	},
	{
		displayName: 'موقعیت Y',
		name: 'positionY',
		type: 'number',
		default: 0,
		displayOptions: {
			show: {
				operation: ['crop'],
			},
		},
		description: 'موقعیت Y (عمودی) برای برش از',
	},

	// ----------------------------------
	//         resize
	// ----------------------------------
	{
		displayName: 'عرض',
		name: 'width',
		type: 'number',
		default: 500,
		displayOptions: {
			show: {
				operation: ['resize'],
			},
		},
		description: 'عرض جدید تصویر',
	},
	{
		displayName: 'ارتفاع',
		name: 'height',
		type: 'number',
		default: 500,
		displayOptions: {
			show: {
				operation: ['resize'],
			},
		},
		description: 'ارتفاع جدید تصویر',
	},
	{
		displayName: 'گزینه',
		name: 'resizeOption',
		type: 'options',
		options: [
			{
				name: 'نادیده گرفتن نسبت ابعاد',
				value: 'ignoreAspectRatio',
				description: 'نادیده گرفتن نسبت ابعاد و تغییر اندازه دقیقاً به مقادیر مشخص شده',
			},
			{
				name: 'حداکثر مساحت',
				value: 'maximumArea',
				description: 'مقادیر مشخص شده حداکثر مساحت هستند',
			},
			{
				name: 'حداقل مساحت',
				value: 'minimumArea',
				description: 'حداقل مساحت',
			},
			{
				name: 'فقط اگر بزرگتر باشد',
				value: 'onlyIfLarger',
				description: 'تغییر اندازه فقط اگر تصویر بزرگتر از عرض یا ارتفاع باشد',
			},
			{
				name: 'فقط اگر کوچکتر باشد',
				value: 'onlyIfSmaller',
				description: 'تغییر اندازه فقط اگر تصویر کوچکتر از عرض یا ارتفاع باشد',
			},
			{
				name: 'درصد',
				value: 'percent',
				description: 'عرض و ارتفاع به درصد مشخص شده‌اند',
			},
		],
		default: 'maximumArea',
		displayOptions: {
			show: {
				operation: ['resize'],
			},
		},
		description: 'نحوه تغییر اندازه تصویر',
	},

	// ----------------------------------
	//         rotate
	// ----------------------------------
	{
		displayName: 'چرخش',
		name: 'rotate',
		type: 'number',
		typeOptions: {
			minValue: -360,
			maxValue: 360,
		},
		default: 0,
		displayOptions: {
			show: {
				operation: ['rotate'],
			},
		},
		description: 'میزان چرخش تصویر',
	},
	{
		displayName: 'رنگ پس‌زمینه',
		name: 'backgroundColor',
		type: 'color',
		default: '#ffffffff',
		typeOptions: {
			showAlpha: true,
		},
		displayOptions: {
			show: {
				operation: ['rotate'],
			},
		},
		description:
			'رنگی که برای پس‌زمینه استفاده شود زمانی که تصویر با چیزی که مضرب 90 نیست چرخانده می‌شود',
	},

	// ----------------------------------
	//         shear
	// ----------------------------------
	{
		displayName: 'درجات X',
		name: 'degreesX',
		type: 'number',
		default: 0,
		displayOptions: {
			show: {
				operation: ['shear'],
			},
		},
		description: 'درجات برش مایل X (افقی)',
	},
	{
		displayName: 'درجات Y',
		name: 'degreesY',
		type: 'number',
		default: 0,
		displayOptions: {
			show: {
				operation: ['shear'],
			},
		},
		description: 'درجات برش مایل Y (عمودی)',
	},

	// ----------------------------------
	//         transparent
	// ----------------------------------
	{
		displayName: 'رنگ',
		name: 'color',
		type: 'color',
		default: '#ff0000',
		displayOptions: {
			show: {
				operation: ['transparent'],
			},
		},
		description: 'رنگی که باید شفاف شود',
	},
];

export class EditImage implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'ویرایش تصویر',
		name: 'editImage',
		icon: 'fa:image',
		iconColor: 'purple',
		group: ['transform'],
		version: 1,
		description: 'تصویر را ویرایش می‌کند مانند تار کردن، تغییر اندازه یا افزودن حاشیه و متن',
		defaults: {
			name: 'ویرایش تصویر',
			color: '#553399',
		},
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
						name: 'دریافت اطلاعات',
						value: 'information',
						description: 'اطلاعات تصویر مانند وضوح را برمی‌گرداند',
					},
					{
						name: 'چند مرحله‌ای',
						value: 'multiStep',
						description: 'انجام چندین عملیات',
					},
					...nodeOperations,
				].sort((a, b) => {
					if (a.name.toLowerCase() < b.name.toLowerCase()) {
						return -1;
					}
					if (a.name.toLowerCase() > b.name.toLowerCase()) {
						return 1;
					}
					return 0;
				}),
				default: 'border',
			},
			{
				displayName: 'نام ویژگی',
				name: 'dataPropertyName',
				type: 'string',
				default: 'data',
				description: 'نام ویژگی باینری که داده‌های تصویر در آن یافت می‌شود',
			},

			// ----------------------------------
			//         multiStep
			// ----------------------------------
			{
				displayName: 'عملیات',
				name: 'operations',
				placeholder: 'افزودن عملیات',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
					sortable: true,
				},
				displayOptions: {
					show: {
						operation: ['multiStep'],
					},
				},
				description: 'عملیات برای انجام',
				default: {},
				options: [
					{
						name: 'operations',
						displayName: 'عملیات',
						values: [
							{
								displayName: 'عملیات',
								name: 'operation',
								type: 'options',
								noDataExpression: true,
								options: nodeOperations,
								default: '',
							},
							...nodeOperationOptions,
							{
								displayName: 'نام یا شناسه فونت',
								name: 'font',
								type: 'options',
								displayOptions: {
									show: {
										operation: ['text'],
									},
								},
								typeOptions: {
									loadOptionsMethod: 'getFonts',
								},
								default: '',
								description:
									'فونت برای استفاده. پیش‌فرض Arial است. از لیست انتخاب کنید، یا با استفاده از یک <a href="https://docs.n8n.io/code/expressions/">عبارت</a> یک شناسه مشخص کنید.',
							},
						],
					},
				],
			},

			...nodeOperationOptions,
			{
				displayName: 'گزینه‌ها',
				name: 'options',
				type: 'collection',
				placeholder: 'افزودن گزینه',
				default: {},
				displayOptions: {
					hide: {
						operation: ['information'],
					},
				},
				options: [
					{
						displayName: 'نام فایل',
						name: 'fileName',
						type: 'string',
						default: '',
						description: 'نام فایل برای تنظیم در داده‌های باینری',
					},
					{
						displayName: 'نام یا شناسه فونت',
						name: 'font',
						type: 'options',
						displayOptions: {
							show: {
								'/operation': ['text'],
							},
						},
						typeOptions: {
							loadOptionsMethod: 'getFonts',
						},
						default: '',
						description:
							'فونت برای استفاده. پیش‌فرض Arial است. از لیست انتخاب کنید، یا با استفاده از یک <a href="https://docs.n8n.io/code/expressions/">عبارت</a> یک شناسه مشخص کنید.',
					},
					{
						displayName: 'فرمت',
						name: 'format',
						type: 'options',
						options: [
							{
								name: 'bmp',
								value: 'bmp',
							},
							{
								name: 'gif',
								value: 'gif',
							},
							{
								name: 'jpeg',
								value: 'jpeg',
							},
							{
								name: 'png',
								value: 'png',
							},
							{
								name: 'tiff',
								value: 'tiff',
							},
							{
								name: 'WebP',
								value: 'webp',
							},
						],
						default: 'jpeg',
						description: 'تنظیم فرمت تصویر خروجی',
					},
					{
						displayName: 'کیفیت',
						name: 'quality',
						type: 'number',
						typeOptions: {
							minValue: 0,
							maxValue: 100,
						},
						default: 100,
						displayOptions: {
							show: {
								format: ['jpeg', 'png', 'tiff'],
							},
						},
						description: 'تنظیم سطح فشرده‌سازی jpeg|png|tiff از 0 تا 100 (بهترین)',
					},
				],
			},
		],
	};

	methods = {
		loadOptions: {
			async getFonts(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const files = await getSystemFonts();
				const returnData: INodePropertyOptions[] = [];

				files.forEach((entry: string) => {
					const pathParts = pathParse(entry);
					if (!pathParts.ext) {
						return;
					}

					returnData.push({
						name: pathParts.name,
						value: entry,
					});
				});

				returnData.sort((a, b) => {
					if (a.name < b.name) {
						return -1;
					}
					if (a.name > b.name) {
						return 1;
					}
					return 0;
				});

				return returnData;
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		const returnData: INodeExecutionData[] = [];
		const length = items.length;
		let item: INodeExecutionData;

		for (let itemIndex = 0; itemIndex < length; itemIndex++) {
			try {
				item = items[itemIndex];

				const operation = this.getNodeParameter('operation', itemIndex);
				const dataPropertyName = this.getNodeParameter('dataPropertyName', itemIndex);

				const options = this.getNodeParameter('options', itemIndex, {});

				const cleanupFunctions: Array<() => void> = [];

				let gmInstance: gm.State;

				const requiredOperationParameters: {
					[key: string]: string[];
				} = {
					blur: ['blur', 'sigma'],
					border: ['borderColor', 'borderWidth', 'borderHeight'],
					create: ['backgroundColor', 'height', 'width'],
					crop: ['height', 'positionX', 'positionY', 'width'],
					composite: ['dataPropertyNameComposite', 'operator', 'positionX', 'positionY'],
					draw: [
						'color',
						'cornerRadius',
						'endPositionX',
						'endPositionY',
						'primitive',
						'startPositionX',
						'startPositionY',
					],
					information: [],
					resize: ['height', 'resizeOption', 'width'],
					rotate: ['backgroundColor', 'rotate'],
					shear: ['degreesX', 'degreesY'],
					text: ['font', 'fontColor', 'fontSize', 'lineLength', 'positionX', 'positionY', 'text'],
					transparent: ['color'],
				};

				let operations: IDataObject[] = [];
				if (operation === 'multiStep') {
					// Operation parameters are already in the correct format
					const operationsData = this.getNodeParameter('operations', itemIndex, {
						operations: [],
					}) as IDataObject;
					operations = operationsData.operations as IDataObject[];
				} else {
					// Operation parameters have to first get collected
					const operationParameters: IDataObject = {};
					requiredOperationParameters[operation].forEach((parameterName) => {
						try {
							operationParameters[parameterName] = this.getNodeParameter(parameterName, itemIndex);
						} catch (error) {}
					});

					operations = [
						{
							operation,
							...operationParameters,
						},
					];
				}

				if (operations[0].operation !== 'create') {
					// "create" generates a new image so does not require any incoming data.
					this.helpers.assertBinaryData(itemIndex, dataPropertyName);
					const binaryDataBuffer = await this.helpers.getBinaryDataBuffer(
						itemIndex,
						dataPropertyName,
					);
					gmInstance = gm(binaryDataBuffer);
					gmInstance = gmInstance.background('transparent');
				}

				const newItem: INodeExecutionData = {
					json: item.json,
					binary: {},
					pairedItem: {
						item: itemIndex,
					},
				};

				if (operation === 'information') {
					// Just return the information
					const imageData = await new Promise<IDataObject>((resolve, reject) => {
						gmInstance = gmInstance.identify((error, data) => {
							if (error) {
								reject(error);
								return;
							}
							resolve(data as unknown as IDataObject);
						});
					});

					newItem.json = imageData;
				}

				for (let i = 0; i < operations.length; i++) {
					const operationData = operations[i];
					if (operationData.operation === 'blur') {
						gmInstance = gmInstance!.blur(
							operationData.blur as number,
							operationData.sigma as number,
						);
					} else if (operationData.operation === 'border') {
						gmInstance = gmInstance!
							.borderColor(operationData.borderColor as string)
							.border(operationData.borderWidth as number, operationData.borderHeight as number);
					} else if (operationData.operation === 'composite') {
						const positionX = operationData.positionX as number;
						const positionY = operationData.positionY as number;
						const operator = operationData.operator as string;

						const geometryString =
							(positionX >= 0 ? '+' : '') + positionX + (positionY >= 0 ? '+' : '') + positionY;

						const binaryPropertyName = operationData.dataPropertyNameComposite as string;
						this.helpers.assertBinaryData(itemIndex, binaryPropertyName);
						const binaryDataBuffer = await this.helpers.getBinaryDataBuffer(
							itemIndex,
							binaryPropertyName,
						);

						const { path, cleanup } = await file();
						cleanupFunctions.push(cleanup);
						await fsWriteFile(path, binaryDataBuffer);

						if (operations[0].operation === 'create') {
							// It seems like if the image gets created newly we have to create a new gm instance
							// else it fails for some reason
							gmInstance = gm(gmInstance!.stream('png'))
								.compose(operator)
								.geometry(geometryString)
								.composite(path);
						} else {
							gmInstance = gmInstance!.compose(operator).geometry(geometryString).composite(path);
						}

						if (operations.length !== i + 1) {
							// If there are other operations after the current one create a new gm instance
							// because else things do get messed up
							gmInstance = gm(gmInstance.stream());
						}
					} else if (operationData.operation === 'create') {
						gmInstance = gm(
							operationData.width as number,
							operationData.height as number,
							operationData.backgroundColor as string,
						);
						if (!options.format) {
							options.format = 'png';
						}
					} else if (operationData.operation === 'crop') {
						gmInstance = gmInstance!.crop(
							operationData.width as number,
							operationData.height as number,
							operationData.positionX as number,
							operationData.positionY as number,
						);
					} else if (operationData.operation === 'draw') {
						gmInstance = gmInstance!.fill(operationData.color as string);

						if (operationData.primitive === 'line') {
							gmInstance = gmInstance.drawLine(
								operationData.startPositionX as number,
								operationData.startPositionY as number,
								operationData.endPositionX as number,
								operationData.endPositionY as number,
							);
						} else if (operationData.primitive === 'circle') {
							gmInstance = gmInstance.drawCircle(
								operationData.startPositionX as number,
								operationData.startPositionY as number,
								operationData.endPositionX as number,
								operationData.endPositionY as number,
							);
						} else if (operationData.primitive === 'rectangle') {
							gmInstance = gmInstance.drawRectangle(
								operationData.startPositionX as number,
								operationData.startPositionY as number,
								operationData.endPositionX as number,
								operationData.endPositionY as number,
								(operationData.cornerRadius as number) || undefined,
							);
						}
					} else if (operationData.operation === 'resize') {
						const resizeOption = operationData.resizeOption as string;

						// By default use "maximumArea"
						let option: gm.ResizeOption = '@';
						if (resizeOption === 'ignoreAspectRatio') {
							option = '!';
						} else if (resizeOption === 'minimumArea') {
							option = '^';
						} else if (resizeOption === 'onlyIfSmaller') {
							option = '<';
						} else if (resizeOption === 'onlyIfLarger') {
							option = '>';
						} else if (resizeOption === 'percent') {
							option = '%';
						}

						gmInstance = gmInstance!.resize(
							operationData.width as number,
							operationData.height as number,
							option,
						);
					} else if (operationData.operation === 'rotate') {
						gmInstance = gmInstance!.rotate(
							operationData.backgroundColor as string,
							operationData.rotate as number,
						);
					} else if (operationData.operation === 'shear') {
						gmInstance = gmInstance!.shear(
							operationData.degreesX as number,
							operationData.degreesY as number,
						);
					} else if (operationData.operation === 'text') {
						// Split the text in multiple lines
						const lines: string[] = [];
						let currentLine = '';
						(operationData.text as string).split('\n').forEach((textLine: string) => {
							textLine.split(' ').forEach((textPart: string) => {
								if (
									currentLine.length + textPart.length + 1 >
									(operationData.lineLength as number)
								) {
									lines.push(currentLine.trim());
									currentLine = `${textPart} `;
									return;
								}
								currentLine += `${textPart} `;
							});

							lines.push(currentLine.trim());
							currentLine = '';
						});

						// Combine the lines to a single string
						const renderText = lines.join('\n');

						let font = (options.font || operationData.font) as string | undefined;
						if (!font) {
							const fonts = await getSystemFonts();
							font = fonts.find((_font) => _font.includes('Arial.'));
						}

						if (!font) {
							throw new NodeOperationError(
								this.getNode(),
								'Default font not found. Select a font from the options.',
							);
						}

						gmInstance = gmInstance!
							.fill(operationData.fontColor as string)
							.fontSize(operationData.fontSize as number)
							.font(font)
							.drawText(
								operationData.positionX as number,
								operationData.positionY as number,
								renderText,
							);
					} else if (operationData.operation === 'transparent') {
						gmInstance = gmInstance!.transparent(operationData.color as string);
					}
				}

				if (item.binary !== undefined && newItem.binary) {
					// Create a shallow copy of the binary data so that the old
					// data references which do not get changed still stay behind
					// but the incoming data does not get changed.
					Object.assign(newItem.binary, item.binary);
					// Make a deep copy of the binary data we change
					if (newItem.binary[dataPropertyName]) {
						newItem.binary[dataPropertyName] = deepCopy(newItem.binary[dataPropertyName]);
					}
				}

				if (newItem.binary![dataPropertyName] === undefined) {
					newItem.binary![dataPropertyName] = {
						data: '',
						mimeType: '',
					};
				}

				if (options.quality !== undefined) {
					gmInstance = gmInstance!.quality(options.quality as number);
				}

				if (options.format !== undefined) {
					gmInstance = gmInstance!.setFormat(options.format as string);
					newItem.binary![dataPropertyName].fileExtension = options.format as string;
					newItem.binary![dataPropertyName].mimeType = `image/${options.format}`;
					const fileName = newItem.binary![dataPropertyName].fileName;
					if (fileName?.includes('.')) {
						newItem.binary![dataPropertyName].fileName =
							fileName.split('.').slice(0, -1).join('.') + '.' + options.format;
					}
				}

				if (options.fileName !== undefined) {
					newItem.binary![dataPropertyName].fileName = options.fileName as string;
				}

				returnData.push(
					await new Promise<INodeExecutionData>((resolve, reject) => {
						gmInstance.toBuffer(async (error: Error | null, buffer: Buffer) => {
							cleanupFunctions.forEach(async (cleanup) => cleanup());

							if (error) {
								return reject(error);
							}

							const binaryData = await this.helpers.prepareBinaryData(Buffer.from(buffer));
							newItem.binary![dataPropertyName] = {
								...newItem.binary![dataPropertyName],
								...binaryData,
							};

							return resolve(newItem);
						});
					}),
				);
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
