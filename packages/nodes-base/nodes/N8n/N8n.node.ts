import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';

import { auditFields, auditOperations } from './AuditDescription';
import { credentialFields, credentialOperations } from './CredentialDescription';
import { executionFields, executionOperations } from './ExecutionDescription';
import { workflowFields, workflowOperations } from './WorkflowDescription';
import { searchWorkflows } from './WorkflowLocator';

/**
 * The n8n node provides access to the n8n API.
 *
 * See: https://docs.n8n.io/api/api-reference/
 */
export class N8n implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'n8n',
		name: 'n8n',
		icon: 'file:n8n.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'مدیریت رویدادها و انجام عملیات در نمونه n8n شما',
		defaults: {
			name: 'n8n',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'n8nApi',
				required: true,
			},
		],
		requestDefaults: {
			returnFullResponse: true,
			baseURL: '={{ $credentials.baseUrl.replace(new RegExp("/$"), "") }}',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'منبع',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'حسابرسی',
						value: 'audit',
					},
					{
						name: 'اعتبارسنجی',
						value: 'credential',
					},
					{
						name: 'اجرایی',
						value: 'execution',
					},
					{
						name: 'جریان کاری',
						value: 'workflow',
					},
				],
				default: 'workflow',
			},

			...auditOperations,
			...auditFields,

			...credentialOperations,
			...credentialFields,

			...executionOperations,
			...executionFields,

			...workflowOperations,
			...workflowFields,
		],
	};

	methods = {
		listSearch: {
			// Provide workflows search capability for the workflow resourceLocator
			searchWorkflows,
		},
	};
}
