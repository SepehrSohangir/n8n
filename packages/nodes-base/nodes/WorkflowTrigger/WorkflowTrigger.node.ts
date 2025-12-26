import type {
	ITriggerFunctions,
	INodeType,
	INodeTypeDescription,
	ITriggerResponse,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

type eventType = 'گردش کار فعال شد' | 'گردش کار به‌روزرسانی شد' | 'اجرای دستی' | undefined;
type activationType = 'activate' | 'update';

export class WorkflowTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'تریگر گردش کار',
		hidden: true,
		name: 'workflowTrigger',
		icon: 'fa:network-wired',
		iconColor: 'orange-red',
		group: ['trigger'],
		version: 1,
		description: 'تریگر بر اساس رویدادهای مختلف چرخه حیات، مانند زمانی که یک گردش کار فعال می‌شود',
		eventTriggerDescription: '',
		mockManualExecution: true,
		activationMessage:
			'گردش کار شما اکنون اجراها را بر روی رویدادی که تعریف کرده‌اید تریگر خواهد کرد.',
		defaults: {
			name: 'تریگر گردش کار',
			color: '#ff6d5a',
		},
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		properties: [
			{
				displayName:
					"این نود منسوخ شده است و در آینده به‌روزرسانی نخواهد شد. لطفاً به جای آن از نود 'تریگر n8n' استفاده کنید.",
				name: 'oldVersionNotice',
				type: 'notice',
				default: '',
			},
			{
				displayName: 'رویدادها',
				name: 'events',
				type: 'multiOptions',
				required: true,
				default: [],
				description: `شرایطی را مشخص می‌کند که تحت آن اجرا باید اتفاق بیفتد:
					<ul>
						<li><b>گردش کار فعال به‌روزرسانی شد</b>: زمانی تریگر می‌شود که این گردش کار به‌روزرسانی شود</li>
						<li><b>گردش کار فعال شد</b>: زمانی تریگر می‌شود که این گردش کار فعال شود</li>
					</ul>`,
				options: [
					{
						name: 'گردش کار فعال به‌روزرسانی شد',
						value: 'update',
						description: 'زمانی تریگر می‌شود که این گردش کار به‌روزرسانی شود',
					},
					{
						name: 'گردش کار فعال شد',
						value: 'activate',
						description: 'زمانی تریگر می‌شود که این گردش کار فعال شود',
					},
				],
			},
		],
	};

	async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
		const events = this.getNodeParameter('events', []) as activationType[];

		const activationMode = this.getActivationMode() as activationType;

		if (events.includes(activationMode)) {
			let event: eventType;
			if (activationMode === 'activate') {
				event = 'گردش کار فعال شد';
			}
			if (activationMode === 'update') {
				event = 'گردش کار به‌روزرسانی شد';
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
