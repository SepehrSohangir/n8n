import EventSource from 'eventsource';
import type {
	IDataObject,
	ITriggerFunctions,
	INodeType,
	INodeTypeDescription,
	ITriggerResponse,
} from 'n8n-workflow';
import { NodeConnectionTypes, jsonParse } from 'n8n-workflow';

export class SseTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'تریگر SSE',
		name: 'sseTrigger',
		icon: 'fa:cloud-download-alt',
		iconColor: 'dark-blue',
		group: ['trigger'],
		version: 1,
		description: 'گردش کار را زمانی که رویدادهای ارسال شده از سرور رخ می‌دهند تریگر می‌کند',
		eventTriggerDescription: '',
		activationMessage: 'اکنون می‌توانید به URL SSE خود فراخوانی کنید تا اجراها را تریگر کنید.',
		defaults: {
			name: 'تریگر SSE',
			color: '#225577',
		},
		triggerPanel: {
			header: '',
			executionsHelp: {
				inactive:
					"<b>در حین ساخت گردش کار خود</b>، روی دکمه 'اجرای مرحله' کلیک کنید، سپس یک رویداد SSE را تریگر کنید. این یک اجرا را تریگر می‌کند که در این ویرایشگر نمایش داده خواهد شد.<br /> <br /><b>پس از رضایت از گردش کار خود</b>، آن را منتشر کنید. سپس هر بار که تغییری تشخیص داده شود، گردش کار اجرا خواهد شد. این اجراها در <a data-key='executions'>فهرست اجراها</a> نمایش داده می‌شوند، اما در ویرایشگر نمایش داده نمی‌شوند.",
				active:
					"<b>در حین ساخت گردش کار خود</b>، روی دکمه 'اجرای مرحله' کلیک کنید، سپس یک رویداد SSE را تریگر کنید. این یک اجرا را تریگر می‌کند که در این ویرایشگر نمایش داده خواهد شد.<br /> <br /><b>گردش کار شما همچنین به طور خودکار اجرا خواهد شد</b>، زیرا فعال شده است. هر بار که تغییری تشخیص داده شود، این نود یک اجرا را تریگر می‌کند. این اجراها در <a data-key='executions'>فهرست اجراها</a> نمایش داده می‌شوند، اما در ویرایشگر نمایش داده نمی‌شوند.",
			},
			activationHint:
				'پس از اتمام ساخت گردش کار خود، آن را منتشر کنید تا به طور مداوم گوش دهد (فقط آن اجراها را در اینجا نخواهید دید).',
		},
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		properties: [
			{
				displayName: 'URL',
				name: 'url',
				type: 'string',
				default: '',
				placeholder: 'http://example.com',
				description: 'URL برای دریافت SSE از آن',
				required: true,
			},
		],
	};

	async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
		const url = this.getNodeParameter('url') as string;

		const eventSource = new EventSource(url);

		eventSource.onmessage = (event) => {
			const eventData = jsonParse<IDataObject>(event.data as string, {
				errorMessage: 'JSON نامعتبر برای داده رویداد',
			});
			this.emit([this.helpers.returnJsonArray([eventData])]);
		};

		async function closeFunction() {
			eventSource.close();
		}

		return {
			closeFunction,
		};
	}
}
