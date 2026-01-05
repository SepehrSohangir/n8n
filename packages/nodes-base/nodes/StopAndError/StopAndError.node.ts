import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import { createErrorFromParameters } from './utils';

const errorObjectPlaceholder = `{
	"code": "404",
	"description": "The resource could not be fetched"
}`;

export class StopAndError implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'توقف و خطا',
		name: 'stopAndError',
		icon: 'fa:exclamation-triangle',
		iconColor: 'red',
		group: ['input'],
		version: 1,
		description: 'پرتاب خطا در گردش کار',
		defaults: {
			name: 'توقف و خطا',
			color: '#ff0000',
		},
		inputs: [NodeConnectionTypes.Main],

		outputs: [],
		properties: [
			{
				displayName: 'نوع خطا',
				name: 'errorType',
				type: 'options',
				options: [
					{
						name: 'پیام خطا',
						value: 'errorMessage',
					},
					{
						name: 'شیء خطا',
						value: 'errorObject',
					},
				],
				default: 'errorMessage',
				description: 'نوع خطایی که پرتاب می‌شود',
			},
			{
				displayName: 'پیام خطا',
				name: 'errorMessage',
				type: 'string',
				placeholder: 'خطایی رخ داد!',
				default: '',
				required: true,
				displayOptions: {
					show: {
						errorType: ['errorMessage'],
					},
				},
			},
			{
				displayName: 'شیء خطا',
				name: 'errorObject',
				type: 'json',
				description: 'شیء حاوی ویژگی‌های خطا',
				default: '',
				typeOptions: {
					alwaysOpenEditWindow: true,
				},
				placeholder: errorObjectPlaceholder,
				required: true,
				displayOptions: {
					show: {
						errorType: ['errorObject'],
					},
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const errorType = this.getNodeParameter('errorType', 0) as 'errorMessage' | 'errorObject';
		const errorParameter =
			errorType === 'errorMessage'
				? (this.getNodeParameter('errorMessage', 0) as string)
				: (this.getNodeParameter('errorObject', 0) as string);

		const { message, options } = createErrorFromParameters(errorType, errorParameter);

		throw new NodeOperationError(this.getNode(), message, options);
	}
}
