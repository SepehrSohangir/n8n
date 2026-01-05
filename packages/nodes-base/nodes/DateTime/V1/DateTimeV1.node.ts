import set from 'lodash/set';
import { DateTime as LuxonDateTime } from 'luxon';
import moment from 'moment-timezone';
import type {
	IDataObject,
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeBaseDescription,
	INodeTypeDescription,
} from 'n8n-workflow';
import { deepCopy, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

function parseDateByFormat(this: IExecuteFunctions, value: string, fromFormat: string) {
	const date = moment(value, fromFormat, true);
	if (moment(date).isValid()) return date;

	throw new NodeOperationError(
		this.getNode(),
		'ورودی تاریخ قابل تجزیه نیست. لطفاً مقدار و فیلد "از فرمت" را دوباره بررسی کنید.',
	);
}

function getIsoValue(this: IExecuteFunctions, value: string) {
	try {
		return new Date(value).toISOString(); // may throw due to unpredictable input
	} catch (error) {
		throw new NodeOperationError(
			this.getNode(),
			'ورودی تاریخ تشخیص داده نشد. لطفاً یک فرمت در فیلد "از فرمت" مشخص کنید.',
		);
	}
}

function parseDateByDefault(this: IExecuteFunctions, value: string) {
	const isoValue = getIsoValue.call(this, value);
	if (moment(isoValue).isValid()) return moment(isoValue);

	throw new NodeOperationError(
		this.getNode(),
		'Unrecognized date input. Please specify a format in the "From Format" field.',
	);
}

const versionDescription: INodeTypeDescription = {
	displayName: 'تاریخ و زمان',
	name: 'dateTime',
	icon: 'fa:clock',
	group: ['transform'],
	version: 1,
	description: 'اجازه دستکاری مقادیر تاریخ و زمان را می‌دهد',
	subtitle: '={{$parameter["action"]}}',
	defaults: {
		name: 'تاریخ و زمان',
		color: '#408000',
	},
	inputs: [NodeConnectionTypes.Main],
	outputs: [NodeConnectionTypes.Main],
	properties: [
		{
			displayName:
				"عملکردهای قدرتمندتر تاریخ در <a href='https://docs.n8n.io/code/cookbook/luxon/' target='_blank'>عبارت‌ها</a> در دسترس است،</br> مثلاً <code>{{ $now.plus(1, 'week') }}</code>",
			name: 'noticeDateTime',
			type: 'notice',
			default: '',
		},
		{
			displayName: 'عملیات',
			name: 'action',
			type: 'options',
			options: [
				{
					name: 'محاسبه تاریخ',
					description: 'افزودن یا کم کردن زمان از یک تاریخ',
					value: 'calculate',
					action: 'افزودن یا کم کردن زمان از یک تاریخ',
				},
				{
					name: 'فرمت کردن تاریخ',
					description: 'تبدیل تاریخ به فرمت متفاوت',
					value: 'format',
					action: 'تبدیل تاریخ به فرمت متفاوت',
				},
			],
			default: 'format',
		},
		{
			displayName: 'مقدار',
			name: 'value',
			displayOptions: {
				show: {
					action: ['format'],
				},
			},
			type: 'string',
			default: '',
			description: 'مقداری که باید تبدیل شود',
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
					action: ['format'],
				},
			},
			description: 'نام ویژگی که تاریخ تبدیل شده در آن نوشته می‌شود',
		},
		{
			displayName: 'فرمت سفارشی',
			name: 'custom',
			displayOptions: {
				show: {
					action: ['format'],
				},
			},
			type: 'boolean',
			default: false,
			description: 'آیا باید یک فرمت از پیش تعریف شده انتخاب شود یا فرمت سفارشی وارد شود',
		},
		{
			displayName: 'به فرمت',
			name: 'toFormat',
			displayOptions: {
				show: {
					action: ['format'],
					custom: [true],
				},
			},
			type: 'string',
			default: '',
			placeholder: 'YYYY-MM-DD',
			description: 'فرمتی که تاریخ به آن تبدیل می‌شود',
		},
		{
			displayName: 'به فرمت',
			name: 'toFormat',
			type: 'options',
			displayOptions: {
				show: {
					action: ['format'],
					custom: [false],
				},
			},
			// eslint-disable-next-line n8n-nodes-base/node-param-options-type-unsorted-items
			options: [
				{
					name: 'MM/DD/YYYY',
					value: 'MM/DD/YYYY',
					description: 'مثال: 09/04/1986',
				},
				{
					name: 'YYYY/MM/DD',
					value: 'YYYY/MM/DD',
					description: 'مثال: 1986/04/09',
				},
				{
					name: 'MMMM DD YYYY',
					value: 'MMMM DD YYYY',
					description: 'مثال: April 09 1986',
				},
				{
					name: 'MM-DD-YYYY',
					value: 'MM-DD-YYYY',
					description: 'مثال: 09-04-1986',
				},
				{
					name: 'YYYY-MM-DD',
					value: 'YYYY-MM-DD',
					description: 'مثال: 1986-04-09',
				},
				{
					name: 'برچسب زمانی Unix',
					value: 'X',
					description: 'مثال: 513388800.879',
				},
				{
					name: 'برچسب زمانی Unix (میلی‌ثانیه)',
					value: 'x',
					description: 'مثال: 513388800',
				},
			],
			default: 'MM/DD/YYYY',
			description: 'فرمتی که تاریخ به آن تبدیل می‌شود',
		},
		{
			displayName: 'گزینه‌ها',
			name: 'options',
			displayOptions: {
				show: {
					action: ['format'],
				},
			},
			type: 'collection',
			placeholder: 'افزودن گزینه',
			default: {},
			options: [
				{
					displayName: 'از فرمت',
					name: 'fromFormat',
					type: 'string',
					default: '',
					description: 'در صورتی که فرمت ورودی تشخیص داده نشود می‌توانید فرمت را ارائه دهید',
				},
				{
					displayName: 'نام یا شناسه منطقه زمانی مبدأ',
					name: 'fromTimezone',
					type: 'options',
					typeOptions: {
						loadOptionsMethod: 'getTimezones',
					},
					default: 'UTC',
					description:
						'منطقه زمانی برای تبدیل از آن. از لیست انتخاب کنید یا با استفاده از یک <a href="https://docs.n8n.io/code/expressions/">عبارت</a> شناسه را مشخص کنید.',
				},
				{
					displayName: 'نام یا شناسه منطقه زمانی مقصد',
					name: 'toTimezone',
					type: 'options',
					typeOptions: {
						loadOptionsMethod: 'getTimezones',
					},
					default: 'UTC',
					description:
						'منطقه زمانی برای تبدیل به آن. از لیست انتخاب کنید یا با استفاده از یک <a href="https://docs.n8n.io/code/expressions/">عبارت</a> شناسه را مشخص کنید.',
				},
			],
		},
		{
			displayName: 'مقدار تاریخ',
			name: 'value',
			displayOptions: {
				show: {
					action: ['calculate'],
				},
			},
			type: 'string',
			default: '',
			description: 'رشته تاریخ یا برچسب زمانی که می‌خواهید زمان را به آن اضافه/کم کنید',
			required: true,
		},
		{
			displayName: 'عملیات',
			name: 'operation',
			displayOptions: {
				show: {
					action: ['calculate'],
				},
			},
			type: 'options',
			noDataExpression: true,
			options: [
				{
					name: 'افزودن',
					value: 'add',
					description: 'افزودن زمان به مقدار تاریخ',
					action: 'افزودن زمان به مقدار تاریخ',
				},
				{
					name: 'کم کردن',
					value: 'subtract',
					description: 'کم کردن زمان از مقدار تاریخ',
					action: 'کم کردن زمان از مقدار تاریخ',
				},
			],
			default: 'add',
			required: true,
		},
		{
			displayName: 'مدت زمان',
			name: 'duration',
			displayOptions: {
				show: {
					action: ['calculate'],
				},
			},
			type: 'number',
			typeOptions: {
				minValue: 0,
			},
			default: 0,
			required: true,
			description:
				'مثلاً "10" را وارد کنید سپس "روز" را انتخاب کنید اگر می‌خواهید 10 روز به مقدار تاریخ اضافه کنید.',
		},
		{
			displayName: 'واحد زمان',
			name: 'timeUnit',
			description: 'واحد زمان برای پارامتر مدت زمان بالا',
			displayOptions: {
				show: {
					action: ['calculate'],
				},
			},
			type: 'options',
			// eslint-disable-next-line n8n-nodes-base/node-param-options-type-unsorted-items
			options: [
				{
					name: 'سه‌ماهه',
					value: 'quarters',
				},
				{
					name: 'سال',
					value: 'years',
				},
				{
					name: 'ماه',
					value: 'months',
				},
				{
					name: 'هفته',
					value: 'weeks',
				},
				{
					name: 'روز',
					value: 'days',
				},
				{
					name: 'ساعت',
					value: 'hours',
				},
				{
					name: 'دقیقه',
					value: 'minutes',
				},
				{
					name: 'ثانیه',
					value: 'seconds',
				},
				{
					name: 'میلی‌ثانیه',
					value: 'milliseconds',
				},
			],
			default: 'days',
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
					action: ['calculate'],
				},
			},
			description: 'نام ویژگی خروجی که تاریخ تبدیل شده در آن نوشته می‌شود',
		},
		{
			displayName: 'گزینه‌ها',
			name: 'options',
			type: 'collection',
			placeholder: 'افزودن گزینه',
			default: {},
			displayOptions: {
				show: {
					action: ['calculate'],
				},
			},
			options: [
				{
					displayName: 'از فرمت',
					name: 'fromFormat',
					type: 'string',
					default: '',
					description:
						'فرمت برای تجزیه مقدار به عنوان تاریخ. اگر تشخیص داده نشد، <a href="https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.datetime/#faqs">فرمت</a> را برای مقدار مشخص کنید.',
				},
			],
		},
	],
};

export class DateTimeV1 implements INodeType {
	description: INodeTypeDescription;

	constructor(baseDescription: INodeTypeBaseDescription) {
		this.description = {
			...baseDescription,
			...versionDescription,
		};
	}

	methods = {
		loadOptions: {
			// Get all the timezones to display them to user so that they can
			// select them easily
			async getTimezones(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const returnData: INodePropertyOptions[] = [];
				for (const timezone of moment.tz.names()) {
					const timezoneName = timezone;
					const timezoneId = timezone;
					returnData.push({
						name: timezoneName,
						value: timezoneId,
					});
				}
				return returnData;
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const length = items.length;
		const returnData: INodeExecutionData[] = [];

		const workflowTimezone = this.getTimezone();
		let item: INodeExecutionData;

		for (let i = 0; i < length; i++) {
			try {
				const action = this.getNodeParameter('action', 0) as string;
				item = items[i];

				if (action === 'format') {
					let currentDate: string | number | LuxonDateTime = this.getNodeParameter(
						'value',
						i,
					) as string;
					const dataPropertyName = this.getNodeParameter('dataPropertyName', i);
					const toFormat = this.getNodeParameter('toFormat', i) as string;
					const options = this.getNodeParameter('options', i);
					let newDate;

					if ((currentDate as unknown as IDataObject) instanceof LuxonDateTime) {
						currentDate = (currentDate as unknown as LuxonDateTime).toISO();
					}

					// Check if the input is a number
					if (!Number.isNaN(Number(currentDate))) {
						//input is a number, convert to number in case it is a string
						currentDate = Number(currentDate);
						// check if the number is a timestamp in float format and convert to integer
						if (!Number.isInteger(currentDate)) {
							currentDate = currentDate * 1000;
						}
					}

					if (currentDate === undefined) {
						continue;
					}
					if (options.fromFormat === undefined && !moment(currentDate).isValid()) {
						throw new NodeOperationError(
							this.getNode(),
							'فرمت ورودی تاریخ قابل تشخیص نبود. لطفاً فیلد "از فرمت" را تنظیم کنید',
							{ itemIndex: i },
						);
					}

					if (Number.isInteger(currentDate)) {
						const timestampLengthInMilliseconds1990 = 12;
						// check if the number is a timestamp in seconds or milliseconds and create a moment object accordingly
						if (currentDate.toString().length < timestampLengthInMilliseconds1990) {
							newDate = moment.unix(currentDate as number);
						} else {
							newDate = moment(currentDate);
						}
					} else {
						if (options.fromTimezone || options.toTimezone) {
							const fromTimezone = options.fromTimezone || workflowTimezone;
							if (options.fromFormat) {
								newDate = moment.tz(
									currentDate as string,
									options.fromFormat as string,
									fromTimezone as string,
								);
							} else {
								newDate = moment.tz(currentDate, fromTimezone as string);
							}
						} else {
							if (options.fromFormat) {
								newDate = moment(currentDate, options.fromFormat as string);
							} else {
								newDate = moment(currentDate);
							}
						}
					}

					if (options.toTimezone || options.fromTimezone) {
						// If either a source or a target timezone got defined the
						// timezone of the date has to be changed. If a target-timezone
						// is set use it else fall back to workflow timezone.
						newDate = newDate.tz((options.toTimezone as string) || workflowTimezone);
					}

					newDate = newDate.format(toFormat);

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

					if (item.binary !== undefined) {
						newItem.binary = item.binary;
					}

					set(newItem, ['json', dataPropertyName], newDate);

					returnData.push(newItem);
				}

				if (action === 'calculate') {
					const dateValue = this.getNodeParameter('value', i) as string;
					const operation = this.getNodeParameter('operation', i) as 'add' | 'subtract';
					const duration = this.getNodeParameter('duration', i) as number;
					const timeUnit = this.getNodeParameter('timeUnit', i) as moment.DurationInputArg2;
					const { fromFormat } = this.getNodeParameter('options', i) as { fromFormat?: string };
					const dataPropertyName = this.getNodeParameter('dataPropertyName', i);

					const newDate = fromFormat
						? parseDateByFormat.call(this, dateValue, fromFormat)
						: parseDateByDefault.call(this, dateValue);

					operation === 'add'
						? newDate.add(duration, timeUnit).utc().format()
						: newDate.subtract(duration, timeUnit).utc().format();

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

					if (item.binary !== undefined) {
						newItem.binary = item.binary;
					}

					set(newItem, ['json', dataPropertyName], newDate.toISOString());

					returnData.push(newItem);
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
