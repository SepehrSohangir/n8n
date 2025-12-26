import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { assertParamIsNumber, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

export class TimeSaved implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'ردیابی زمان ذخیره شده',
		name: 'timeSaved',
		icon: 'fa:timer',
		group: ['organization'],
		version: 1,
		description:
			'ردیابی پویای زمان ذخیره شده بر اساس مسیر اجرای گردش کار و تعداد آیتم‌های پردازش شده',
		defaults: {
			name: 'زمان ذخیره شده',
			color: '#1E90FF',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		properties: [
			{
				displayName:
					'برای هر اجرا، زمان ذخیره شده مجموع همه نودهای زمان ذخیره شده‌ای است که اجرا می‌شوند. از این استفاده کنید زمانی که مسیرهای اجرای مختلف یا آیتم‌ها مقادیر مختلفی از زمان را ذخیره می‌کنند.',
				name: 'notice',
				type: 'notice',
				default: '',
			},
			{
				displayName: 'حالت محاسبه',
				name: 'mode',
				type: 'options',
				default: 'once',
				noDataExpression: true,
				options: [
					{
						name: 'یک بار برای همه آیتم‌ها',
						value: 'once',
						description: 'شمارش دقیقه‌های ذخیره شده یک بار برای همه آیتم‌های ورودی',
					},
					{
						name: 'به ازای هر آیتم',
						value: 'perItem',
						description: 'ضرب کردن دقیقه‌های ذخیره شده در تعداد آیتم‌های ورودی',
					},
				],
			},
			{
				displayName: 'دقیقه‌های ذخیره شده',
				name: 'minutesSaved',
				type: 'number',
				default: 0,
				noDataExpression: true,
				typeOptions: {
					minValue: 0,
				},
				description: 'تعداد دقیقه‌های ذخیره شده توسط این اجرای گردش کار',
			},
		],
		hints: [
			{
				type: 'info',
				message: 'چندین نود زمان ذخیره شده در همان گردش کار مقادیر خود را با هم جمع می‌کنند.',
				displayCondition: '=true',
				whenToDisplay: 'beforeExecution',
				location: 'outputPane',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const mode = this.getNodeParameter('mode', 0) as 'fixed' | 'perItem' | 'expression';

		let timeSavedMinutes = this.getNodeParameter('minutesSaved', 0);
		assertParamIsNumber('minutesSaved', timeSavedMinutes, this.getNode());

		try {
			if (mode === 'perItem') {
				timeSavedMinutes = items.length * timeSavedMinutes;
			}

			// Ensure non-negative
			if (timeSavedMinutes < 0) {
				throw new NodeOperationError(
					this.getNode(),
					`Time saved cannot be negative, got: ${timeSavedMinutes}`,
				);
			}

			// Set metadata using the clean API
			this.setMetadata({
				timeSaved: {
					minutes: timeSavedMinutes,
				},
			});

			// Pass through all items unchanged
			return [items];
		} catch (error) {
			if (this.continueOnFail()) {
				return [[{ json: { error: error.message } }]];
			}
			throw error;
		}
	}
}
