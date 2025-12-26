import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

type DataToSave = {
	values: Array<{ key: string; value: string }>;
};

export class ExecutionData implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'داده اجرا',
		name: 'executionData',
		icon: 'fa:tasks',
		group: ['input'],
		iconColor: 'light-green',
		version: [1, 1.1],
		description: 'افزودن داده اجرا برای جستجو',
		defaults: {
			name: 'داده اجرا',
			color: '#29A568',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		properties: [
			{
				displayName:
					"با استفاده از این نود داده‌های مهم را ذخیره کنید. در هر اجرا نمایش داده می‌شود برای مرجع آسان و می‌توانید بر اساس آن فیلتر کنید.<br />فیلتر کردن در پلن‌های Pro و Enterprise در دسترس است. <a href='https://n8n.io/pricing/' target='_blank'>اطلاعات بیشتر</a>",
				name: 'notice',
				type: 'notice',
				default: '',
			},
			{
				displayName: 'عملیات',
				name: 'operation',
				type: 'options',
				default: 'save',
				noDataExpression: true,
				options: [
					{
						name: 'ذخیره داده برجسته (برای جستجو/بررسی)',
						value: 'save',
						action: 'ذخیره داده برجسته (برای جستجو/بررسی)',
					},
				],
			},
			{
				displayName: 'داده برای ذخیره',
				name: 'dataToSave',
				placeholder: 'افزودن فیلد ذخیره شده',
				type: 'fixedCollection',
				typeOptions: {
					multipleValueButtonText: 'افزودن فیلد ذخیره شده',
					multipleValues: true,
				},
				displayOptions: {
					show: {
						operation: ['save'],
					},
				},
				default: {},
				options: [
					{
						displayName: 'مقادیر',
						name: 'values',
						values: [
							{
								displayName: 'کلید',
								name: 'key',
								type: 'string',
								default: '',
								placeholder: 'مثلاً myKey',
								requiresDataPath: 'single',
							},
							{
								displayName: 'مقدار',
								name: 'value',
								type: 'string',
								default: '',
								placeholder: 'مثلاً myValue',
							},
						],
					},
				],
			},
		],
		hints: [
			{
				type: 'warning',
				message: 'برخی از کلیدها بیشتر از 50 کاراکتر هستند. برش داده می‌شوند.',
				displayCondition: '={{ $parameter.dataToSave.values.some((x) => x.key.length > 50) }}',
				whenToDisplay: 'beforeExecution',
				location: 'outputPane',
			},
			{
				type: 'warning',
				message: 'برخی از مقادیر بیشتر از 512 کاراکتر هستند. برش داده می‌شوند.',
				displayCondition: '={{ $parameter.dataToSave.values.some((x) => x.value.length > 512) }}',
				whenToDisplay: 'beforeExecution',
				location: 'outputPane',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const dataProxy = this.getWorkflowDataProxy(0);
		const nodeVersion = this.getNode().typeVersion;

		const items = this.getInputData();
		const operations = this.getNodeParameter('operation', 0);

		const returnData: INodeExecutionData[] = [];

		if (operations === 'save') {
			for (let i = 0; i < items.length; i++) {
				try {
					const dataToSave =
						(this.getNodeParameter('dataToSave', i, {}) as DataToSave).values || [];

					const values = dataToSave.reduce(
						(acc, { key, value }) => {
							const valueToSet = value ? value : nodeVersion >= 1.1 ? '' : value;
							acc[key] = valueToSet;
							return acc;
						},
						{} as { [key: string]: string },
					);

					dataProxy.$execution.customData.setAll(values);

					returnData.push(items[i]);
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
					throw new NodeOperationError(this.getNode(), error);
				}
			}
		} else {
			return [items];
		}

		return [returnData];
	}
}
