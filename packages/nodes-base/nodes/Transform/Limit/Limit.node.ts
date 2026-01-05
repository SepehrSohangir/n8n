import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

export class Limit implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'محدودیت',
		name: 'limit',
		icon: 'file:limit.svg',
		group: ['transform'],
		subtitle: '',
		version: 1,
		description: 'محدود کردن تعداد آیتم‌ها',
		defaults: {
			name: 'محدودیت',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		properties: [
			{
				displayName: 'حداکثر آیتم‌ها',
				name: 'maxItems',
				type: 'number',
				typeOptions: {
					minValue: 1,
				},
				default: 1,
				description: 'اگر تعداد آیتم‌ها بیشتر از این عدد باشد، برخی حذف می‌شوند',
			},
			{
				displayName: 'نگه داشتن',
				name: 'keep',
				type: 'options',
				options: [
					{
						name: 'اولین آیتم‌ها',
						value: 'firstItems',
					},
					{
						name: 'آخرین آیتم‌ها',
						value: 'lastItems',
					},
				],
				default: 'firstItems',
				description: 'هنگام حذف آیتم‌ها، آیا آیتم‌های ابتدایی یا انتهایی حفظ شوند',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		let returnData = items;
		const maxItems = this.getNodeParameter('maxItems', 0) as number;
		const keep = this.getNodeParameter('keep', 0) as string;

		if (maxItems > items.length) {
			return [returnData];
		}

		if (keep === 'firstItems') {
			returnData = items.slice(0, maxItems);
		} else {
			returnData = items.slice(items.length - maxItems, items.length);
		}
		return [returnData];
	}
}
