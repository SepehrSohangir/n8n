import {
	NodeConnectionTypes,
	type IExecuteFunctions,
	type INodeExecutionData,
	type INodeParameters,
	type INodeType,
	type INodeTypeBaseDescription,
	type INodeTypeDescription,
	type NodeParameterValue,
} from 'n8n-workflow';

import { compareOperationFunctions, convertDateTime } from './GenericFunctions';

export class FilterV1 implements INodeType {
	description: INodeTypeDescription;

	constructor(baseDescription: INodeTypeBaseDescription) {
		this.description = {
			...baseDescription,
			version: 1,
			defaults: {
				name: 'فیلتر',
				color: '#229eff',
			},
			inputs: [NodeConnectionTypes.Main],
			outputs: [NodeConnectionTypes.Main],
			outputNames: ['نگه‌داشته شده', 'دور ریخته شده'],
			properties: [
				{
					displayName: 'شرایط',
					name: 'conditions',
					placeholder: 'افزودن شرط',
					type: 'fixedCollection',
					typeOptions: {
						multipleValues: true,
						sortable: true,
					},
					description: 'نوع مقادیر برای مقایسه',
					default: {},
					options: [
						{
							name: 'boolean',
							displayName: 'بولین',
							values: [
								{
									displayName: 'مقدار ۱',
									name: 'value1',
									type: 'boolean',
									default: false,
									// eslint-disable-next-line n8n-nodes-base/node-param-description-boolean-without-whether
									description: 'مقداری که با مقدار دوم مقایسه می‌شود',
								},
								// eslint-disable-next-line n8n-nodes-base/node-param-operation-without-no-data-expression
								{
									displayName: 'عملیات',
									name: 'operation',
									type: 'options',
									options: [
										{
											name: 'برابر',
											value: 'equal',
										},
										{
											name: 'نا برابر',
											value: 'notEqual',
										},
									],
									default: 'equal',
									description: 'عملیات برای تصمیم‌گیری در مورد مسیر داده',
								},
								{
									displayName: 'مقدار ۲',
									name: 'value2',
									type: 'boolean',
									default: false,
									// eslint-disable-next-line n8n-nodes-base/node-param-description-boolean-without-whether
									description: 'مقداری که با مقدار اول مقایسه می‌شود',
								},
							],
						},
						{
							name: 'dateTime',
							displayName: 'تاریخ و زمان',
							values: [
								{
									displayName: 'مقدار ۱',
									name: 'value1',
									type: 'dateTime',
									default: '',
									description: 'مقداری که با مقدار دوم مقایسه می‌شود',
								},
								// eslint-disable-next-line n8n-nodes-base/node-param-operation-without-no-data-expression
								{
									displayName: 'عملیات',
									name: 'operation',
									type: 'options',
									options: [
										{
											name: 'بعد از',
											value: 'after',
										},
										{
											name: 'قبل از',
											value: 'before',
										},
									],
									default: 'after',
									description: 'عملیات برای تصمیم‌گیری در مورد مسیر داده',
								},
								{
									displayName: 'مقدار ۲',
									name: 'value2',
									type: 'dateTime',
									default: '',
									description: 'مقداری که با مقدار اول مقایسه می‌شود',
								},
							],
						},
						{
							name: 'number',
							displayName: 'عدد',
							values: [
								{
									displayName: 'مقدار ۱',
									name: 'value1',
									type: 'number',
									default: 0,
									description: 'مقداری که با مقدار دوم مقایسه می‌شود',
								},
								{
									displayName: 'عملیات',
									name: 'operation',
									type: 'options',
									noDataExpression: true,
									// eslint-disable-next-line n8n-nodes-base/node-param-options-type-unsorted-items
									options: [
										{
											name: 'کوچکتر',
											value: 'smaller',
										},
										{
											name: 'کوچکتر یا برابر',
											value: 'smallerEqual',
										},
										{
											name: 'برابر',
											value: 'equal',
										},
										{
											name: 'نا برابر',
											value: 'notEqual',
										},
										{
											name: 'بزرگتر',
											value: 'larger',
										},
										{
											name: 'بزرگتر یا برابر',
											value: 'largerEqual',
										},
										{
											name: 'خالی است',
											value: 'isEmpty',
										},
										{
											name: 'خالی نیست',
											value: 'isNotEmpty',
										},
									],
									default: 'smaller',
									description: 'عملیات برای تصمیم‌گیری در مورد مسیر داده',
								},
								{
									displayName: 'مقدار ۲',
									name: 'value2',
									type: 'number',
									displayOptions: {
										hide: {
											operation: ['isEmpty', 'isNotEmpty'],
										},
									},
									default: 0,
									description: 'مقداری که با مقدار اول مقایسه می‌شود',
								},
							],
						},
						{
							name: 'string',
							displayName: 'رشته',
							values: [
								{
									displayName: 'مقدار ۱',
									name: 'value1',
									type: 'string',
									default: '',
									description: 'مقداری که با مقدار دوم مقایسه می‌شود',
								},
								{
									displayName: 'عملیات',
									name: 'operation',
									type: 'options',
									noDataExpression: true,
									// eslint-disable-next-line n8n-nodes-base/node-param-options-type-unsorted-items
									options: [
										{
											name: 'شامل',
											value: 'contains',
										},
										{
											name: 'شامل نیست',
											value: 'notContains',
										},
										{
											name: 'به پایان می‌رسد با',
											value: 'endsWith',
										},
										{
											name: 'به پایان نمی‌رسد با',
											value: 'notEndsWith',
										},
										{
											name: 'برابر',
											value: 'equal',
										},
										{
											name: 'نا برابر',
											value: 'notEqual',
										},
										{
											name: 'تطابق با Regex',
											value: 'regex',
										},
										{
											name: 'عدم تطابق با Regex',
											value: 'notRegex',
										},
										{
											name: 'شروع می‌شود با',
											value: 'startsWith',
										},
										{
											name: 'شروع نمی‌شود با',
											value: 'notStartsWith',
										},
										{
											name: 'خالی است',
											value: 'isEmpty',
										},
										{
											name: 'خالی نیست',
											value: 'isNotEmpty',
										},
									],
									default: 'equal',
									description: 'عملیات برای تصمیم‌گیری در مورد مسیر داده',
								},
								{
									displayName: 'مقدار ۲',
									name: 'value2',
									type: 'string',
									displayOptions: {
										hide: {
											operation: ['isEmpty', 'isNotEmpty', 'regex', 'notRegex'],
										},
									},
									default: '',
									description: 'مقداری که با مقدار اول مقایسه می‌شود',
								},
								{
									displayName: 'Regex',
									name: 'value2',
									type: 'string',
									displayOptions: {
										show: {
											operation: ['regex', 'notRegex'],
										},
									},
									default: '',
									placeholder: '/text/i',
									description: 'عبارت منظم که باید تطابق داشته باشد',
								},
							],
						},
					],
				},
				{
					displayName: 'ترکیب شرایط',
					name: 'combineConditions',
					type: 'options',
					options: [
						{
							name: 'AND',
							description:
								'آیتم‌ها فقط در صورتی به نود بعدی ارسال می‌شوند که تمام شرایط را برآورده کنند',
							value: 'AND',
						},
						{
							name: 'OR',
							description: 'آیتم‌ها در صورت برآورده کردن حداقل یک شرط به نود بعدی ارسال می‌شوند',
							value: 'OR',
						},
					],
					default: 'AND',
					description:
						'نحوه ترکیب شرایط: AND نیاز به برآورده شدن تمام شرایط دارد، OR نیاز به برآورده شدن حداقل یک شرط دارد',
				},
			],
		};
	}

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnDataTrue: INodeExecutionData[] = [];
		const returnDataFalse: INodeExecutionData[] = [];

		const items = this.getInputData();

		const dataTypes = ['boolean', 'dateTime', 'number', 'string'];

		itemLoop: for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			const item = items[itemIndex];

			const combineConditions = this.getNodeParameter('combineConditions', itemIndex) as string;

			for (const dataType of dataTypes) {
				const typeConditions = this.getNodeParameter(
					`conditions.${dataType}`,
					itemIndex,
					[],
				) as INodeParameters[];

				for (const condition of typeConditions) {
					let value1 = condition.value1 as NodeParameterValue;
					let value2 = condition.value2 as NodeParameterValue;

					if (dataType === 'dateTime') {
						const node = this.getNode();
						value1 = convertDateTime(node, value1);
						value2 = convertDateTime(node, value2);
					}

					const compareResult = compareOperationFunctions[condition.operation as string](
						value1,
						value2,
					);

					if (item.pairedItem === undefined) {
						item.pairedItem = [{ item: itemIndex }];
					}

					// If the operation is "OR" it means the item did match one condition no ned to check further
					if (compareResult && combineConditions === 'OR') {
						returnDataTrue.push(item);
						continue itemLoop;
					}

					// If the operation is "AND" it means the item failed one condition no ned to check further
					if (!compareResult && combineConditions === 'AND') {
						returnDataFalse.push(item);
						continue itemLoop;
					}
				}
			}

			// If the operation is "AND" it means the item did match all conditions
			if (combineConditions === 'AND') {
				returnDataTrue.push(item);
			} else {
				// If the operation is "OR" it means the the item did not match any condition.
				returnDataFalse.push(item);
			}
		}

		return [returnDataTrue, returnDataFalse];
	}
}
