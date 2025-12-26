import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IPairedItemData,
} from 'n8n-workflow';
import { NodeConnectionTypes, deepCopy } from 'n8n-workflow';

export class SplitInBatchesV3 implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'حلقه روی آیتم‌ها (تقسیم به دسته‌ها)',
		name: 'splitInBatches',
		icon: 'fa:sync',
		iconColor: 'dark-green',
		group: ['organization'],
		version: 3,
		description: 'تقسیم داده به دسته‌ها و تکرار روی هر دسته',
		defaults: {
			name: 'حلقه روی آیتم‌ها',
			color: '#007755',
		},
		inputs: [NodeConnectionTypes.Main],

		outputs: [NodeConnectionTypes.Main, NodeConnectionTypes.Main],
		outputNames: ['تمام شده', 'حلقه'],
		properties: [
			{
				displayName:
					'ممکن است به این نود نیاز نداشته باشید — نودهای n8n به طور خودکار یک بار برای هر آیتم ورودی اجرا می‌شوند. <a href="https://docs.n8n.io/getting-started/key-concepts/looping.html#using-loops-in-n8n" target="_blank">اطلاعات بیشتر</a>',
				name: 'splitInBatchesNotice',
				type: 'notice',
				default: '',
			},
			{
				displayName: 'اندازه دسته',
				name: 'batchSize',
				type: 'number',
				typeOptions: {
					minValue: 1,
				},
				default: 1,
				description: 'تعداد آیتم‌هایی که در هر فراخوانی برگردانده می‌شود',
			},
			{
				displayName: 'گزینه‌ها',
				name: 'options',
				type: 'collection',
				placeholder: 'افزودن گزینه',
				default: {},
				options: [
					{
						displayName: 'بازنشانی',
						name: 'reset',
						type: 'boolean',
						default: false,
						description:
							'آیا نود دوباره از ابتدای آیتم‌های ورودی شروع شود. این داده‌های ورودی را به عنوان مجموعه جدیدی در نظر می‌گیرد به جای ادامه با آیتم‌های قبلی.',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][] | null> {
		// Get the input data and create a new array so that we can remove
		// items without a problem
		const items = this.getInputData().slice();

		const nodeContext = this.getContext('node');

		const batchSize = this.getNodeParameter('batchSize', 0) as number;

		const returnItems: INodeExecutionData[] = [];

		const options = this.getNodeParameter('options', 0, {});

		if (nodeContext.items === undefined || options.reset === true) {
			// Is the first time the node runs

			const sourceData = this.getInputSourceData();

			nodeContext.currentRunIndex = 0;
			nodeContext.maxRunIndex = Math.ceil(items.length / batchSize);
			nodeContext.sourceData = deepCopy(sourceData);

			// Get the items which should be returned
			returnItems.push.apply(returnItems, items.splice(0, batchSize));

			// Save the incoming items to be able to return them for later runs
			nodeContext.items = [...items];

			// Reset processedItems as they get only added starting from the first iteration
			nodeContext.processedItems = [];
		} else {
			// The node has been called before. So return the next batch of items.
			nodeContext.currentRunIndex += 1;
			returnItems.push.apply(
				returnItems,
				(nodeContext.items as INodeExecutionData[]).splice(0, batchSize),
			);

			const addSourceOverwrite = (pairedItem: IPairedItemData | number): IPairedItemData => {
				if (typeof pairedItem === 'number') {
					return {
						item: pairedItem,
						sourceOverwrite: nodeContext.sourceData,
					};
				}

				return {
					...pairedItem,
					sourceOverwrite: nodeContext.sourceData,
				};
			};

			function getPairedItemInformation(
				item: INodeExecutionData,
			): IPairedItemData | IPairedItemData[] {
				if (item.pairedItem === undefined) {
					return {
						item: 0,
						sourceOverwrite: nodeContext.sourceData,
					};
				}

				if (Array.isArray(item.pairedItem)) {
					return item.pairedItem.map(addSourceOverwrite);
				}

				return addSourceOverwrite(item.pairedItem);
			}

			const sourceOverwrite = this.getInputSourceData();

			const newItems = items.map((item, index) => {
				return {
					...item,
					pairedItem: {
						sourceOverwrite,
						item: index,
					},
				};
			});

			nodeContext.processedItems = [...nodeContext.processedItems, ...newItems];

			returnItems.map((item) => {
				item.pairedItem = getPairedItemInformation(item);
			});
		}

		nodeContext.noItemsLeft = nodeContext.items.length === 0;

		if (returnItems.length === 0) {
			nodeContext.done = true;
			return [nodeContext.processedItems, []];
		}

		nodeContext.done = false;

		return [[], returnItems];
	}
}
