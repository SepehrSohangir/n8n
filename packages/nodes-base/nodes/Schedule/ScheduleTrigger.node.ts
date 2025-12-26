import { sendAt } from 'cron';
import moment from 'moment-timezone';
import type {
	ITriggerFunctions,
	INodeType,
	INodeTypeDescription,
	ITriggerResponse,
	Cron,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import {
	intervalToRecurrence,
	recurrenceCheck,
	toCronExpression,
	validateInterval,
} from './GenericFunctions';
import type { IRecurrenceRule, Rule } from './SchedulerInterface';

export class ScheduleTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'تریگر برنامه زمانی',
		name: 'scheduleTrigger',
		icon: 'fa:clock',
		group: ['trigger', 'schedule'],
		version: [1, 1.1, 1.2, 1.3],
		description: 'گردش کار را بر اساس برنامه زمانی مشخص شده تریگر می‌کند',
		eventTriggerDescription: '',
		activationMessage:
			'تریگر برنامه زمانی شما اکنون اجراها را بر اساس برنامه زمانی که تعریف کرده‌اید تریگر خواهد کرد.',
		defaults: {
			name: 'تریگر برنامه زمانی',
			color: '#31C49F',
		},

		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		properties: [
			{
				displayName:
					"این گردش کار پس از انتشار، بر اساس برنامه زمانی که در اینجا تعریف می‌کنید اجرا خواهد شد.<br><br>برای تست، می‌توانید آن را به صورت دستی نیز تریگر کنید: با بازگشت به بوم و کلیک روی 'اجرای گردش کار'",
				name: 'notice',
				type: 'notice',
				default: '',
			},
			{
				displayName: 'قوانین تریگر',
				name: 'rule',
				placeholder: 'افزودن قانون',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				default: {
					interval: [
						{
							field: 'days',
						},
					],
				},
				options: [
					{
						name: 'interval',
						displayName: 'فاصله تریگر',
						values: [
							{
								displayName: 'فاصله تریگر',
								name: 'field',
								type: 'options',
								default: 'days',
								// eslint-disable-next-line n8n-nodes-base/node-param-options-type-unsorted-items
								options: [
									{
										name: 'ثانیه',
										value: 'seconds',
									},
									{
										name: 'دقیقه',
										value: 'minutes',
									},
									{
										name: 'ساعت',
										value: 'hours',
									},
									{
										name: 'روز',
										value: 'days',
									},
									{
										name: 'هفته',
										value: 'weeks',
									},
									{
										name: 'ماه',
										value: 'months',
									},
									{
										name: 'سفارشی (Cron)',
										value: 'cronExpression',
									},
								],
							},
							{
								displayName: 'ثانیه بین تریگرها',
								name: 'secondsInterval',
								type: 'number',
								default: 30,
								displayOptions: {
									show: {
										field: ['seconds'],
									},
								},
								description: 'تعداد ثانیه بین هر تریگر گردش کار',
								hint: 'باید در محدوده 1-59 باشد',
							},
							{
								displayName: 'دقیقه بین تریگرها',
								name: 'minutesInterval',
								type: 'number',
								default: 5,
								displayOptions: {
									show: {
										field: ['minutes'],
									},
								},
								description: 'تعداد دقیقه بین هر تریگر گردش کار',
								hint: 'باید در محدوده 1-59 باشد',
							},
							{
								displayName: 'ساعت بین تریگرها',
								name: 'hoursInterval',
								type: 'number',
								displayOptions: {
									show: {
										field: ['hours'],
									},
								},
								default: 1,
								description: 'تعداد ساعت بین هر تریگر گردش کار',
								hint: 'باید در محدوده 1-23 باشد',
							},
							{
								displayName: 'روز بین تریگرها',
								name: 'daysInterval',
								type: 'number',
								displayOptions: {
									show: {
										field: ['days'],
									},
								},
								default: 1,
								description: 'تعداد روز بین هر تریگر گردش کار',
								hint: 'باید در محدوده 1-31 باشد',
							},
							{
								displayName: 'هفته بین تریگرها',
								name: 'weeksInterval',
								type: 'number',
								displayOptions: {
									show: {
										field: ['weeks'],
									},
								},
								default: 1,
								description: 'هر هفته اجرا می‌شود مگر اینکه خلاف آن مشخص شود',
							},
							{
								displayName: 'ماه بین تریگرها',
								name: 'monthsInterval',
								type: 'number',
								displayOptions: {
									show: {
										field: ['months'],
									},
								},
								default: 1,
								description: 'هر ماه اجرا می‌شود مگر اینکه خلاف آن مشخص شود',
							},
							{
								displayName: 'تریگر در روز ماه',
								name: 'triggerAtDayOfMonth',
								type: 'number',
								displayOptions: {
									show: {
										field: ['months'],
									},
								},
								typeOptions: {
									minValue: 1,
									maxValue: 31,
								},
								default: 1,
								description: 'روز ماه برای تریگر (1-31)',
								hint: 'اگر ماه این روز را نداشته باشد، نود تریگر نخواهد شد',
							},
							{
								displayName: 'تریگر در روزهای هفته',
								name: 'triggerAtDay',
								type: 'multiOptions',
								displayOptions: {
									show: {
										field: ['weeks'],
									},
								},
								typeOptions: {
									maxValue: 7,
								},
								options: [
									{
										name: 'دوشنبه',
										value: 1,
									},
									{
										name: 'سه‌شنبه',
										value: 2,
									},
									{
										name: 'چهارشنبه',
										value: 3,
									},
									{
										name: 'پنج‌شنبه',
										value: 4,
									},
									{
										name: 'جمعه',
										value: 5,
									},

									{
										name: 'شنبه',
										value: 6,
									},
									{
										name: 'یکشنبه',
										value: 0,
									},
								],
								default: [0],
							},
							{
								displayName: 'تریگر در ساعت',
								name: 'triggerAtHour',
								type: 'options',
								default: 0,
								displayOptions: {
									show: {
										field: ['days', 'weeks', 'months'],
									},
								},
								options: [
									{
										name: 'نیمه‌شب',
										displayName: 'نیمه‌شب',
										value: 0,
									},
									{
										name: '1 صبح',
										displayName: '1 صبح',
										value: 1,
									},
									{
										name: '2 صبح',
										displayName: '2 صبح',
										value: 2,
									},
									{
										name: '3 صبح',
										displayName: '3 صبح',
										value: 3,
									},
									{
										name: '4 صبح',
										displayName: '4 صبح',
										value: 4,
									},
									{
										name: '5 صبح',
										displayName: '5 صبح',
										value: 5,
									},
									{
										name: '6 صبح',
										displayName: '6 صبح',
										value: 6,
									},
									{
										name: '7 صبح',
										displayName: '7 صبح',
										value: 7,
									},
									{
										name: '8 صبح',
										displayName: '8 صبح',
										value: 8,
									},
									{
										name: '9 صبح',
										displayName: '9 صبح',
										value: 9,
									},
									{
										name: '10 صبح',
										displayName: '10 صبح',
										value: 10,
									},
									{
										name: '11 صبح',
										displayName: '11 صبح',
										value: 11,
									},
									{
										name: 'ظهر',
										displayName: 'ظهر',
										value: 12,
									},
									{
										name: '1 بعدازظهر',
										displayName: '1 بعدازظهر',
										value: 13,
									},
									{
										name: '2 بعدازظهر',
										displayName: '2 بعدازظهر',
										value: 14,
									},
									{
										name: '3 بعدازظهر',
										displayName: '3 بعدازظهر',
										value: 15,
									},
									{
										name: '4 بعدازظهر',
										displayName: '4 بعدازظهر',
										value: 16,
									},
									{
										name: '5 بعدازظهر',
										displayName: '5 بعدازظهر',
										value: 17,
									},
									{
										name: '6 بعدازظهر',
										displayName: '6 بعدازظهر',
										value: 18,
									},
									{
										name: '7 بعدازظهر',
										displayName: '7 بعدازظهر',
										value: 19,
									},
									{
										name: '8 بعدازظهر',
										displayName: '8 بعدازظهر',
										value: 20,
									},
									{
										name: '9 بعدازظهر',
										displayName: '9 بعدازظهر',
										value: 21,
									},
									{
										name: '10 بعدازظهر',
										displayName: '10 بعدازظهر',
										value: 22,
									},
									{
										name: '11 بعدازظهر',
										displayName: '11 بعدازظهر',
										value: 23,
									},
								],
								description: 'ساعت روز برای تریگر',
							},
							{
								displayName: 'تریگر در دقیقه',
								name: 'triggerAtMinute',
								type: 'number',
								default: 0,
								displayOptions: {
									show: {
										field: ['hours', 'days', 'weeks', 'months'],
									},
								},
								typeOptions: {
									minValue: 0,
									maxValue: 59,
								},
								description: 'دقیقه بعد از ساعت برای تریگر (0-59)',
							},
							{
								displayName:
									'می‌توانید راهنمای تولید عبارت cron خود را <a href="https://crontab.guru/examples.html" target="_blank">اینجا</a> پیدا کنید',
								name: 'notice',
								type: 'notice',
								displayOptions: {
									show: {
										field: ['cronExpression'],
									},
								},
								default: '',
							},
							{
								displayName: 'عبارت',
								name: 'expression',
								type: 'string',
								default: '',
								placeholder: 'مثلاً 0 15 * 1 sun',
								displayOptions: {
									show: {
										field: ['cronExpression'],
									},
								},
								hint: 'فرمت: [ثانیه] [دقیقه] [ساعت] [روز ماه] [ماه] [روز هفته]',
							},
						],
					},
				],
			},
		],
	};

	async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
		const version = this.getNode().typeVersion;
		const { interval: intervals } = this.getNodeParameter('rule', []) as Rule;
		const timezone = this.getTimezone();
		const staticData = this.getWorkflowStaticData('node') as {
			recurrenceRules: number[];
		};
		if (!staticData.recurrenceRules) {
			staticData.recurrenceRules = [];
		}

		if (version >= 1.3) {
			for (let i = 0; i < intervals.length; i++) {
				validateInterval(this.getNode(), i, intervals[i]);
			}
		}

		const executeTrigger = (recurrence: IRecurrenceRule) => {
			const shouldTrigger = recurrenceCheck(recurrence, staticData.recurrenceRules, timezone);
			if (!shouldTrigger) return;

			const momentTz = moment.tz(timezone);
			const resultData = {
				timestamp: momentTz.toISOString(true),
				'Readable date': momentTz.format('MMMM Do YYYY, h:mm:ss a'),
				'Readable time': momentTz.format('h:mm:ss a'),
				'Day of week': momentTz.format('dddd'),
				Year: momentTz.format('YYYY'),
				Month: momentTz.format('MMMM'),
				'Day of month': momentTz.format('DD'),
				Hour: momentTz.format('HH'),
				Minute: momentTz.format('mm'),
				Second: momentTz.format('ss'),
				Timezone: `${timezone} (UTC${momentTz.format('Z')})`,
			};

			this.emit([this.helpers.returnJsonArray([resultData])]);
		};

		const rules = intervals.map((interval, i) => ({
			interval,
			cronExpression: toCronExpression(interval),
			recurrence: intervalToRecurrence(interval, i),
		}));

		if (this.getMode() !== 'manual') {
			for (const { interval, cronExpression, recurrence } of rules) {
				try {
					const cron: Cron = {
						expression: cronExpression,
						recurrence,
					};
					this.helpers.registerCron(cron, () => executeTrigger(recurrence));
				} catch (error) {
					if (interval.field === 'cronExpression') {
						throw new NodeOperationError(this.getNode(), 'عبارت cron نامعتبر است', {
							description: 'اطلاعات بیشتر در مورد نحوه ساخت آنها در https://crontab.guru/',
						});
					} else {
						throw error;
					}
				}
			}
			return {};
		} else {
			const manualTriggerFunction = async () => {
				const { interval, cronExpression, recurrence } = rules[0];
				if (interval.field === 'cronExpression') {
					try {
						sendAt(cronExpression);
					} catch (error) {
						throw new NodeOperationError(this.getNode(), 'عبارت cron نامعتبر است', {
							description: 'اطلاعات بیشتر در مورد نحوه ساخت آنها در https://crontab.guru/',
						});
					}
				}
				executeTrigger(recurrence);
			};

			return { manualTriggerFunction };
		}
	}
}
