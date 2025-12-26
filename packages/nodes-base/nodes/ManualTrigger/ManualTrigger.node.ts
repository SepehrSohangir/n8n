import type {
	ITriggerFunctions,
	INodeType,
	INodeTypeDescription,
	ITriggerResponse,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

export class ManualTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'تریگر دستی',
		name: 'manualTrigger',
		icon: 'fa:mouse-pointer',
		group: ['trigger'],
		version: 1,
		description: 'اجرای گردش کار با کلیک روی دکمه در n8n',
		eventTriggerDescription: '',
		maxNodes: 1,
		defaults: {
			name: "هنگام کلیک روی 'اجرای گردش کار'",
			color: '#909298',
		},

		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		properties: [
			{
				displayName:
					'این نود جایی است که اجرای گردش کار شروع می‌شود (هنگامی که روی دکمه \'تست\' در بوم کلیک می‌کنید).<br><br> <a data-action="showNodeCreator">روش‌های دیگر برای تریگر کردن گردش کار خود را کاوش کنید</a> (مثلاً بر اساس برنامه زمانی یا وب هوک)',
				name: 'notice',
				type: 'notice',
				default: '',
			},
		],
	};

	async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
		const manualTriggerFunction = async () => {
			this.emit([this.helpers.returnJsonArray([{}])]);
		};

		return {
			manualTriggerFunction,
		};
	}
}
