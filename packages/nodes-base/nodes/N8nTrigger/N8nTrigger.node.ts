import type {
	ITriggerFunctions,
	INodeType,
	INodeTypeDescription,
	ITriggerResponse,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

type eventType =
	| 'نمونه راه‌اندازی شد'
	| 'گردش کار منتشر شد'
	| 'گردش کار به‌روزرسانی شد'
	| 'اجرای دستی'
	| undefined;

export class N8nTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'تریگر n8n',
		name: 'n8nTrigger',
		icon: 'file:n8nTrigger.svg',
		group: ['trigger'],
		version: 1,
		description: 'مدیریت رویدادها و انجام اقدامات روی نمونه n8n شما',
		eventTriggerDescription: '',
		mockManualExecution: true,
		defaults: {
			name: 'تریگر n8n',
		},
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		properties: [
			{
				displayName: 'رویدادها',
				name: 'events',
				type: 'multiOptions',
				required: true,
				default: [],
				description: `شرایطی را مشخص می‌کند که تحت آن اجرا باید اتفاق بیفتد:
				<ul>
					<li><b>گردش کار منتشر شده به‌روزرسانی شد</b>: زمانی تریگر می‌شود که نسخه گردش کار از حالت منتشر شده منتشر شود (گردش کار قبلاً منتشر شده بود)</li>
					<li><b>نمونه راه‌اندازی شد</b>: زمانی تریگر می‌شود که این نمونه n8n راه‌اندازی یا راه‌اندازی مجدد شود</li>
					<li><b>گردش کار منتشر شد</b>: زمانی تریگر می‌شود که نسخه گردش کار از حالت منتشر نشده منتشر شود (گردش کار منتشر نشده بود)</li>
				</ul>`,
				options: [
					{
						name: 'گردش کار منتشر شده به‌روزرسانی شد',
						value: 'update',
						description:
							'زمانی تریگر می‌شود که نسخه گردش کار از حالت منتشر شده منتشر شود (گردش کار قبلاً منتشر شده بود)',
					},
					{
						name: 'نمونه راه‌اندازی شد',
						value: 'init',
						description: 'زمانی تریگر می‌شود که این نمونه n8n راه‌اندازی یا راه‌اندازی مجدد شود',
					},
					{
						name: 'گردش کار منتشر شد',
						value: 'activate',
						description:
							'زمانی تریگر می‌شود که نسخه گردش کار از حالت منتشر نشده منتشر شود (گردش کار منتشر نشده بود)',
					},
				],
			},
		],
	};

	async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
		const events = (this.getNodeParameter('events') as string[]) || [];

		const activationMode = this.getActivationMode();

		if (events.includes(activationMode)) {
			let event: eventType;
			if (activationMode === 'activate') {
				event = 'گردش کار منتشر شد';
			}
			if (activationMode === 'update') {
				event = 'گردش کار به‌روزرسانی شد';
			}
			if (activationMode === 'init') {
				event = 'نمونه راه‌اندازی شد';
			}
			this.emit([
				this.helpers.returnJsonArray([
					{ event, timestamp: new Date().toISOString(), workflow_id: this.getWorkflow().id },
				]),
			]);
		}

		const manualTriggerFunction = async () => {
			this.emit([
				this.helpers.returnJsonArray([
					{
						event: 'اجرای دستی',
						timestamp: new Date().toISOString(),
						workflow_id: this.getWorkflow().id,
					},
				]),
			]);
		};

		return {
			manualTriggerFunction,
		};
	}
}
