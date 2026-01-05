import { NodeConnectionTypes, NodeOperationError, parseErrorMetadata } from 'n8n-workflow';
import type {
	ExecuteWorkflowData,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

import { findPairedItemThroughWorkflowData } from './../../../utils/workflow-backtracking';
import { getWorkflowInfo } from './GenericFunctions';
import { localResourceMapping } from './methods';
import { generatePairedItemData } from '../../../utils/utilities';
import { getCurrentWorkflowInputData } from '../../../utils/workflowInputsResourceMapping/GenericFunctions';

export class ExecuteWorkflow implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'اجرای زیر-گردش کار',
		name: 'executeWorkflow',
		icon: 'fa:sign-in-alt',
		iconColor: 'orange-red',
		group: ['transform'],
		version: [1, 1.1, 1.2, 1.3],
		subtitle: '={{"گردش کار: " + $parameter["workflowId"]}}',
		description: 'اجرای گردش کار دیگر',
		defaults: {
			name: 'اجرای گردش کار',
			color: '#ff6d5a',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		properties: [
			{
				displayName: 'عملیات',
				name: 'operation',
				type: 'hidden',
				noDataExpression: true,
				default: 'call_workflow',
				options: [
					{
						name: 'اجرای یک زیر-گردش کار',
						value: 'call_workflow',
					},
				],
			},
			{
				displayName: 'این نود منسوخ شده است. لطفاً با حذف آن و افزودن یک نود جدید آن را ارتقا دهید',
				name: 'outdatedVersionWarning',
				type: 'notice',
				displayOptions: { show: { '@version': [{ _cnd: { lte: 1.1 } }] } },
				default: '',
			},
			{
				displayName: 'منبع',
				name: 'source',
				type: 'options',
				options: [
					{
						name: 'پایگاه داده',
						value: 'database',
						description: 'بارگذاری گردش کار از پایگاه داده با شناسه',
					},
					{
						name: 'فایل محلی',
						value: 'localFile',
						description: 'بارگذاری گردش کار از یک فایل ذخیره شده محلی',
					},
					{
						name: 'پارامتر',
						value: 'parameter',
						description: 'بارگذاری گردش کار از یک پارامتر',
					},
					{
						name: 'URL',
						value: 'url',
						description: 'بارگذاری گردش کار از یک URL',
					},
				],
				default: 'database',
				description: 'از کجا گردش کار برای اجرا دریافت شود',
				displayOptions: { show: { '@version': [{ _cnd: { lte: 1.1 } }] } },
			},
			{
				displayName: 'منبع',
				name: 'source',
				type: 'options',
				options: [
					{
						name: 'پایگاه داده',
						value: 'database',
						description: 'بارگذاری گردش کار از پایگاه داده با شناسه',
					},
					{
						name: 'تعریف در زیر',
						value: 'parameter',
						description: 'ارسال کد JSON یک گردش کار',
					},
				],
				default: 'database',
				description: 'از کجا گردش کار برای اجرا دریافت شود',
				displayOptions: { show: { '@version': [{ _cnd: { gte: 1.2 } }] } },
			},

			// ----------------------------------
			//         source:database
			// ----------------------------------
			{
				displayName: 'شناسه گردش کار',
				name: 'workflowId',
				type: 'string',
				displayOptions: {
					show: {
						source: ['database'],
						'@version': [1],
					},
				},
				default: '',
				required: true,
				hint: 'می‌تواند در URL گردش کار یافت شود',
				description:
					'توجه در استفاده از عبارت: اگر این نود برای اجرای یک بار با تمام آیتم‌ها تنظیم شده باشد، همه به <em>همان</em> گردش کار ارسال می‌شوند. شناسه آن گردش کار با ارزیابی عبارت برای <strong>اولین آیتم ورودی</strong> محاسبه می‌شود.',
			},
			{
				displayName: 'گردش کار',
				name: 'workflowId',
				type: 'workflowSelector',
				displayOptions: {
					show: {
						source: ['database'],
						'@version': [{ _cnd: { gte: 1.1 } }],
					},
				},
				default: '',
				required: true,
			},
			// ----------------------------------
			//         source:localFile
			// ----------------------------------
			{
				displayName: 'مسیر گردش کار',
				name: 'workflowPath',
				type: 'string',
				displayOptions: {
					show: {
						source: ['localFile'],
					},
				},
				default: '',
				placeholder: '/data/workflow.json',
				required: true,
				description: 'مسیر فایل JSON گردش کار محلی برای اجرا',
			},

			// ----------------------------------
			//         source:parameter
			// ----------------------------------
			{
				displayName: 'JSON گردش کار',
				name: 'workflowJson',
				type: 'json',
				typeOptions: {
					rows: 10,
				},
				displayOptions: {
					show: {
						source: ['parameter'],
					},
				},
				default: '\n\n\n',
				required: true,
				description: 'کد JSON گردش کار برای اجرا',
			},

			// ----------------------------------
			//         source:url
			// ----------------------------------
			{
				displayName: 'URL گردش کار',
				name: 'workflowUrl',
				type: 'string',
				displayOptions: {
					show: {
						source: ['url'],
					},
				},
				default: '',
				placeholder: 'https://example.com/workflow.json',
				required: true,
				description: 'URL که از آن گردش کار بارگذاری می‌شود',
			},
			{
				displayName:
					'هر داده‌ای که به این نود ارسال کنید توسط تریگر اجرای گردش کار خروجی داده می‌شود. <a href="https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.executeworkflow/" target="_blank">اطلاعات بیشتر</a>',
				name: 'executeWorkflowNotice',
				type: 'notice',
				default: '',
				displayOptions: { show: { '@version': [{ _cnd: { lte: 1.1 } }] } },
			},
			{
				displayName: 'ورودی‌های گردش کار',
				name: 'workflowInputs',
				type: 'resourceMapper',
				noDataExpression: true,
				default: {
					mappingMode: 'defineBelow',
					value: null,
				},
				required: true,
				typeOptions: {
					loadOptionsDependsOn: ['workflowId.value'],
					resourceMapper: {
						localResourceMapperMethod: 'loadSubWorkflowInputs',
						valuesLabel: 'ورودی‌های گردش کار',
						mode: 'map',
						fieldWords: {
							singular: 'ورودی',
							plural: 'ورودی‌ها',
						},
						addAllFields: true,
						multiKeyMatch: false,
						supportAutoMap: false,
						showTypeConversionOptions: true,
					},
				},
				displayOptions: {
					show: {
						source: ['database'],
						'@version': [{ _cnd: { gte: 1.2 } }],
					},
					hide: {
						workflowId: [''],
					},
				},
			},
			{
				displayName: 'حالت',
				name: 'mode',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						// eslint-disable-next-line n8n-nodes-base/node-param-display-name-miscased
						name: 'اجرای یک بار با تمام آیتم‌ها',
						value: 'once',
						description: 'ارسال تمام آیتم‌ها به یک اجرای زیر-گردش کار',
					},
					{
						// eslint-disable-next-line n8n-nodes-base/node-param-display-name-miscased
						name: 'اجرای یک بار برای هر آیتم',
						value: 'each',
						description: 'فراخوانی زیر-گردش کار به صورت جداگانه برای هر آیتم',
					},
				],
				default: 'once',
			},
			{
				displayName: 'گزینه‌ها',
				name: 'options',
				type: 'collection',
				default: {},
				placeholder: 'افزودن گزینه',
				options: [
					{
						displayName: 'انتظار برای تکمیل زیر-گردش کار',
						name: 'waitForSubWorkflow',
						type: 'boolean',
						default: true,
						description:
							'آیا گردش کار اصلی باید برای تکمیل اجرای زیر-گردش کار منتظر بماند قبل از ادامه',
					},
				],
			},
		],
		hints: [
			{
				type: 'info',
				message:
					'توجه در استفاده از عبارت برای شناسه گردش کار: از آنجایی که این نود برای اجرای یک بار با تمام آیتم‌ها تنظیم شده است، همه به <em>همان</em> گردش کار ارسال می‌شوند. شناسه آن گردش کار با ارزیابی عبارت برای <strong>اولین آیتم ورودی</strong> محاسبه می‌شود.',
				displayCondition:
					'={{ $rawParameter.workflowId.startsWith("=") && $parameter.mode === "once" && $nodeVersion >= 1.2 }}',
				whenToDisplay: 'always',
				location: 'outputPane',
			},
		],
	};

	methods = {
		localResourceMapping,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const source = this.getNodeParameter('source', 0) as string;
		const mode = this.getNodeParameter('mode', 0, false) as string;
		const items = getCurrentWorkflowInputData.call(this);

		const workflowProxy = this.getWorkflowDataProxy(0);
		const currentWorkflowId = workflowProxy.$workflow.id as string;

		if (mode === 'each') {
			const returnData: INodeExecutionData[][] = [];

			for (let i = 0; i < items.length; i++) {
				try {
					const waitForSubWorkflow = this.getNodeParameter(
						'options.waitForSubWorkflow',
						i,
						true,
					) as boolean;
					const workflowInfo = await getWorkflowInfo.call(this, source, i);

					if (waitForSubWorkflow) {
						const executionResult: ExecuteWorkflowData = await this.executeWorkflow(
							workflowInfo,
							[items[i]],
							undefined,
							{
								parentExecution: {
									executionId: workflowProxy.$execution.id,
									workflowId: workflowProxy.$workflow.id,
									shouldResume: waitForSubWorkflow,
								},
							},
						);
						const workflowResult = executionResult.data as INodeExecutionData[][];

						for (const [outputIndex, outputData] of workflowResult.entries()) {
							for (const item of outputData) {
								item.pairedItem = { item: i };
								item.metadata = {
									subExecution: {
										executionId: executionResult.executionId,
										workflowId: workflowInfo.id ?? currentWorkflowId,
									},
								};
							}

							if (returnData[outputIndex] === undefined) {
								returnData[outputIndex] = [];
							}

							returnData[outputIndex].push(...outputData);
						}
					} else {
						const executionResult: ExecuteWorkflowData = await this.executeWorkflow(
							workflowInfo,
							[items[i]],
							undefined,
							{
								doNotWaitToFinish: true,
								parentExecution: {
									executionId: workflowProxy.$execution.id,
									workflowId: workflowProxy.$workflow.id,
									shouldResume: waitForSubWorkflow,
								},
							},
						);

						if (returnData.length === 0) {
							returnData.push([]);
						}

						returnData[0].push({
							...items[i],
							metadata: {
								subExecution: {
									workflowId: workflowInfo.id ?? currentWorkflowId,
									executionId: executionResult.executionId,
								},
							},
						});
					}
				} catch (error) {
					if (this.continueOnFail()) {
						const nodeVersion = this.getNode().typeVersion;
						// In versions < 1.3 using the "Continue (using error output)" mode
						// the node would return items in extra "error branches" instead of
						// returning an array of items on the error output. These branches weren't really shown correctly on the UI.
						// In the fixed >= 1.3 versions the errors are now all output into the single error output as an array of error items.
						const outputIndex = nodeVersion >= 1.3 ? 0 : i;

						returnData[outputIndex] ??= [];
						const metadata = parseErrorMetadata(error);
						returnData[outputIndex].push({
							json: { error: error.message },
							pairedItem: { item: i },
							metadata,
						});
						continue;
					}
					throw new NodeOperationError(this.getNode(), error, {
						message: `Error executing workflow with item at index ${i}`,
						description: error.message,
						itemIndex: i,
					});
				}
			}

			this.setMetadata({
				subExecutionsCount: items.length,
			});

			return returnData;
		} else {
			try {
				const waitForSubWorkflow = this.getNodeParameter(
					'options.waitForSubWorkflow',
					0,
					true,
				) as boolean;
				const workflowInfo = await getWorkflowInfo.call(this, source);

				const executionResult: ExecuteWorkflowData = await this.executeWorkflow(
					workflowInfo,
					items,
					undefined,
					{
						doNotWaitToFinish: !waitForSubWorkflow,
						parentExecution: {
							executionId: workflowProxy.$execution.id,
							workflowId: workflowProxy.$workflow.id,
							shouldResume: waitForSubWorkflow,
						},
					},
				);

				this.setMetadata({
					subExecution: {
						executionId: executionResult.executionId,
						workflowId: workflowInfo.id ?? (workflowProxy.$workflow.id as string),
					},
					subExecutionsCount: 1,
				});

				if (!waitForSubWorkflow) {
					return [items];
				}

				const workflowRunData = await this.getExecutionDataById(executionResult.executionId);

				const workflowResult = executionResult.data as INodeExecutionData[][];

				const fallbackPairedItemData = generatePairedItemData(items.length);

				for (const output of workflowResult) {
					const sameLength = output.length === items.length;

					for (const [itemIndex, item] of output.entries()) {
						if (item.pairedItem) {
							// If the item already has a paired item, we need to follow these to the start of the child workflow
							if (workflowRunData !== undefined) {
								const pairedItem = findPairedItemThroughWorkflowData(
									workflowRunData,
									item,
									itemIndex,
								);
								if (pairedItem !== undefined) {
									item.pairedItem = pairedItem;
								}
							}
							continue;
						}

						if (sameLength) {
							item.pairedItem = { item: itemIndex };
						} else {
							item.pairedItem = fallbackPairedItemData;
						}
					}
				}

				return workflowResult;
			} catch (error) {
				const pairedItem = generatePairedItemData(items.length);
				if (this.continueOnFail()) {
					const metadata = parseErrorMetadata(error);
					return [
						[
							{
								json: { error: error.message },
								metadata,
								pairedItem,
							},
						],
					];
				}
				throw error;
			}
		}
	}
}
