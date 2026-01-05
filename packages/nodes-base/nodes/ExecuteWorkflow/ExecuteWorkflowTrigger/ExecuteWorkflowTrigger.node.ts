import pickBy from 'lodash/pickBy';
import {
	type INodeExecutionData,
	NodeConnectionTypes,
	type IExecuteFunctions,
	type INodeType,
	type INodeTypeDescription,
	type ITriggerFunctions,
	type ITriggerResponse,
} from 'n8n-workflow';

import {
	INPUT_SOURCE,
	WORKFLOW_INPUTS,
	JSON_EXAMPLE,
	VALUES,
	TYPE_OPTIONS,
	PASSTHROUGH,
	FALLBACK_DEFAULT_VALUE,
} from '../../../utils/workflowInputsResourceMapping/constants';
import { getFieldEntries } from '../../../utils/workflowInputsResourceMapping/GenericFunctions';

export class ExecuteWorkflowTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'تریگر اجرای گردش کار',
		name: 'executeWorkflowTrigger',
		icon: 'fa:sign-out-alt',
		group: ['trigger'],
		version: [1, 1.1],
		description:
			'کمک‌کننده‌ها برای فراخوانی گردش کارهای دیگر n8n. برای طراحی گردش کارهای ماژولار و شبیه میکروسرویس استفاده می‌شود.',
		eventTriggerDescription: '',
		maxNodes: 1,
		defaults: {
			name: 'هنگام اجرا توسط گردش کار دیگر',
			color: '#ff6d5a',
		},
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		hints: [
			{
				message:
					'این گردش کار برای پذیرش هیچ داده ورودی تنظیم نشده است. طرح ورودی گردش کار را پر کنید یا گردش کار را تغییر دهید تا هر داده‌ای که به آن ارسال می‌شود را بپذیرد.',
				// This condition checks if we have no input fields, which gets a bit awkward:
				// For WORKFLOW_INPUTS: keys() only contains `VALUES` if at least one value is provided
				// For JSON_EXAMPLE: We remove all whitespace and check if we're left with an empty object. Note that we already error if the example is not valid JSON
				displayCondition:
					`={{$parameter['${INPUT_SOURCE}'] === '${WORKFLOW_INPUTS}' && !$parameter['${WORKFLOW_INPUTS}'].keys().length ` +
					`|| $parameter['${INPUT_SOURCE}'] === '${JSON_EXAMPLE}' && $parameter['${JSON_EXAMPLE}'].toString().replaceAll(' ', '').replaceAll('\\n', '') === '{}' }}`,
				whenToDisplay: 'always',
				location: 'ndv',
			},
		],
		properties: [
			{
				displayName: 'رویدادها',
				name: 'events',
				type: 'hidden',
				noDataExpression: true,
				options: [
					{
						name: 'فراخوانی گردش کار',
						value: 'worklfow_call',
						description:
							'زمانی که توسط گردش کار دیگری با استفاده از تریگر اجرای گردش کار اجرا می‌شود',
						action: 'هنگام اجرا توسط گردش کار دیگر',
					},
				],
				default: 'worklfow_call',
			},
			{
				displayName:
					"زمانی که یک نود 'اجرای گردش کار' این گردش کار را فراخوانی می‌کند، اجرا از اینجا شروع می‌شود. هر داده‌ای که به نود 'اجرای گردش کار' ارسال شود توسط این نود خروجی داده می‌شود.",
				name: 'notice',
				type: 'notice',
				default: '',
				displayOptions: {
					show: { '@version': [{ _cnd: { eq: 1 } }] },
				},
			},
			{
				displayName: 'این نود منسوخ شده است. لطفاً با حذف آن و افزودن یک نود جدید آن را ارتقا دهید',
				name: 'outdatedVersionWarning',
				type: 'notice',
				displayOptions: { show: { '@version': [{ _cnd: { eq: 1 } }] } },
				default: '',
			},
			{
				// eslint-disable-next-line n8n-nodes-base/node-param-display-name-miscased
				displayName: 'حالت داده ورودی',
				name: INPUT_SOURCE,
				type: 'options',
				options: [
					{
						// eslint-disable-next-line n8n-nodes-base/node-param-display-name-miscased
						name: 'تعریف با استفاده از فیلدهای زیر',
						value: WORKFLOW_INPUTS,
						description: 'ارائه فیلدهای ورودی از طریق رابط کاربری',
					},
					{
						// eslint-disable-next-line n8n-nodes-base/node-param-display-name-miscased
						name: 'تعریف با استفاده از مثال JSON',
						value: JSON_EXAMPLE,
						description: 'تولید یک طرح از یک شیء JSON نمونه',
					},
					{
						// eslint-disable-next-line n8n-nodes-base/node-param-display-name-miscased
						name: 'پذیرش همه داده‌ها',
						value: PASSTHROUGH,
						description: 'استفاده از همه داده‌های ورودی از گردش کار والد',
					},
				],
				default: WORKFLOW_INPUTS,
				noDataExpression: true,
				displayOptions: {
					show: { '@version': [{ _cnd: { gte: 1.1 } }] },
				},
			},
			{
				displayName:
					'یک شیء نمونه برای استنتاج فیلدها و انواع آنها ارائه دهید.<br>برای اجازه دادن به هر نوع برای یک فیلد مشخص، مقدار را null تنظیم کنید.',
				name: `${JSON_EXAMPLE}_notice`,
				type: 'notice',
				default: '',
				displayOptions: {
					show: { '@version': [{ _cnd: { gte: 1.1 } }], inputSource: [JSON_EXAMPLE] },
				},
			},
			{
				displayName: 'مثال JSON',
				name: JSON_EXAMPLE,
				type: 'json',
				default: JSON.stringify(
					{
						aField: 'a string',
						aNumber: 123,
						thisFieldAcceptsAnyType: null,
						anArray: [],
					},
					null,
					2,
				),
				noDataExpression: true,
				displayOptions: {
					show: { '@version': [{ _cnd: { gte: 1.1 } }], inputSource: [JSON_EXAMPLE] },
				},
			},
			{
				displayName: 'طرح ورودی گردش کار',
				name: WORKFLOW_INPUTS,
				placeholder: 'افزودن فیلد',
				type: 'fixedCollection',
				description:
					'تعریف فیلدهای ورودی مورد انتظار. اگر هیچ ورودی ارائه نشود، همه داده‌ها از گردش کار فراخوانی‌کننده عبور داده می‌شوند.',
				typeOptions: {
					multipleValues: true,
					sortable: true,
					minRequiredFields: 1,
				},
				displayOptions: {
					show: { '@version': [{ _cnd: { gte: 1.1 } }], inputSource: [WORKFLOW_INPUTS] },
				},
				default: {},
				options: [
					{
						name: VALUES,
						displayName: 'مقادیر',
						values: [
							{
								displayName: 'نام',
								name: 'name',
								type: 'string',
								default: '',
								placeholder: 'مثلاً fieldName',
								description:
									'یک نام منحصر به فرد برای این ورودی گردش کار، برای ارجاع به آن از گردش کارهای دیگر استفاده می‌شود',
								required: true,
								noDataExpression: true,
							},
							{
								displayName: 'نوع',
								name: 'type',
								type: 'options',
								description:
									'نوع داده مورد انتظار برای این مقدار ورودی. نحوه ذخیره، اعتبارسنجی و نمایش مقادیر این فیلد را تعیین می‌کند.',
								options: TYPE_OPTIONS,
								required: true,
								default: 'string',
								noDataExpression: true,
							},
						],
					},
				],
			},
		],
	};

	async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
		// ExecuteWorkflowTrigger is triggered by the ExecuteWorkflow node
		// No setup or teardown is required, as the triggering is handled externally
		return {};
	}

	async execute(this: IExecuteFunctions) {
		const inputData = this.getInputData();
		const inputSource = this.getNodeParameter(INPUT_SOURCE, 0, PASSTHROUGH) as string;

		// Note on the data we receive from ExecuteWorkflow caller:
		//
		// The ExecuteWorkflow node typechecks all fields explicitly provided by the user here via the resourceMapper
		// and removes all fields that are in the schema, but `removed` in the resourceMapper.
		//
		// In passthrough and legacy node versions, inputData will line up since the resourceMapper is empty,
		// in which case all input is passed through.
		// In other cases we will already have matching types and fields provided by the resource mapper,
		// so we just need to be permissive on this end,
		// while ensuring we provide default values for fields in our schema, which are removed in the resourceMapper.

		if (inputSource === PASSTHROUGH) {
			return [inputData];
		} else {
			const newParams = getFieldEntries(this);
			const newKeys = new Set(newParams.fields.map((x) => x.name));
			const itemsInSchema: INodeExecutionData[] = inputData.map(({ json, binary }, index) => ({
				json: {
					...Object.fromEntries(newParams.fields.map((x) => [x.name, FALLBACK_DEFAULT_VALUE])),
					// Need to trim to the expected schema to support legacy Execute Workflow callers passing through all their data
					// which we do not want to expose past this node.
					...pickBy(json, (_value, key) => newKeys.has(key)),
				},
				index,
				binary,
			}));

			return [itemsInSchema];
		}
	}
}
