import get from 'lodash/get';
import isEqual from 'lodash/isEqual';
import lt from 'lodash/lt';
import {
	NodeOperationError,
	type IDataObject,
	type IExecuteFunctions,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
	NodeConnectionTypes,
} from 'n8n-workflow';

import { shuffleArray } from '@utils/utilities';

import { sortByCode } from './utils';

export class Sort implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'مرتب‌سازی',
		name: 'sort',
		icon: 'file:sort.svg',
		group: ['transform'],
		subtitle: '',
		version: 1,
		description: 'تغییر ترتیب آیتم‌ها',
		defaults: {
			name: 'مرتب‌سازی',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		properties: [
			{
				displayName: 'نوع',
				name: 'type',
				type: 'options',
				options: [
					{
						name: 'ساده',
						value: 'simple',
					},
					{
						name: 'تصادفی',
						value: 'random',
					},
					{
						name: 'کد',
						value: 'code',
					},
				],
				default: 'simple',
				description: 'نوع مرتب‌سازی برای انجام',
			},
			{
				displayName: 'فیلدهای برای مرتب‌سازی بر اساس',
				name: 'sortFieldsUi',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				placeholder: 'افزودن فیلد برای مرتب‌سازی بر اساس',
				options: [
					{
						displayName: '',
						name: 'sortField',
						values: [
							{
								displayName: 'نام فیلد',
								name: 'fieldName',
								type: 'string',
								required: true,
								default: '',
								description: 'فیلد برای مرتب‌سازی بر اساس',
								// eslint-disable-next-line n8n-nodes-base/node-param-placeholder-miscased-id
								placeholder: 'مثلاً id',
								hint: 'نام فیلد را به صورت متن وارد کنید',
								requiresDataPath: 'single',
							},
							{
								displayName: 'ترتیب',
								name: 'order',
								type: 'options',
								options: [
									{
										name: 'صعودی',
										value: 'ascending',
									},
									{
										name: 'نزولی',
										value: 'descending',
									},
								],
								default: 'ascending',
								description: 'ترتیب مرتب‌سازی',
							},
						],
					},
				],
				default: {},
				description: 'فیلدهای آیتم‌های ورودی برای مرتب‌سازی بر اساس',
				displayOptions: {
					show: {
						type: ['simple'],
					},
				},
			},
			{
				displayName: 'کد',
				name: 'code',
				type: 'string',
				typeOptions: {
					alwaysOpenEditWindow: true,
					editor: 'jsEditor',
					rows: 10,
				},
				default: `// The two items to compare are in the variables a and b
	// Access the fields in a.json and b.json
	// Return -1 if a should go before b
	// Return 1 if b should go before a
	// Return 0 if there's no difference

	fieldName = 'myField';

	if (a.json[fieldName] < b.json[fieldName]) {
	return -1;
	}
	if (a.json[fieldName] > b.json[fieldName]) {
	return 1;
	}
	return 0;`,
				description: 'کد جاوااسکریپت برای تعیین ترتیب هر دو آیتم',
				displayOptions: {
					show: {
						type: ['code'],
					},
				},
			},
			{
				displayName: 'گزینه‌ها',
				name: 'options',
				type: 'collection',
				placeholder: 'افزودن فیلد',
				default: {},
				displayOptions: {
					show: {
						type: ['simple'],
					},
				},
				options: [
					{
						displayName: 'غیرفعال کردن نماد نقطه',
						name: 'disableDotNotation',
						type: 'boolean',
						default: false,
						description:
							'آیا ارجاع به فیلدهای فرزند با استفاده از `parent.child` در نام فیلد مجاز نباشد',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		let returnData = [...items];
		const type = this.getNodeParameter('type', 0) as string;
		const disableDotNotation = this.getNodeParameter(
			'options.disableDotNotation',
			0,
			false,
		) as boolean;

		if (type === 'random') {
			shuffleArray(returnData);
			return [returnData];
		}

		if (type === 'simple') {
			const sortFieldsUi = this.getNodeParameter('sortFieldsUi', 0) as IDataObject;
			const sortFields = sortFieldsUi.sortField as Array<{
				fieldName: string;
				order: 'ascending' | 'descending';
			}>;

			if (!sortFields?.length) {
				throw new NodeOperationError(
					this.getNode(),
					'No sorting specified. Please add a field to sort by',
				);
			}

			for (const { fieldName } of sortFields) {
				let found = false;
				for (const item of items) {
					if (!disableDotNotation) {
						if (get(item.json, fieldName) !== undefined) {
							found = true;
						}
					} else if (item.json.hasOwnProperty(fieldName)) {
						found = true;
					}
				}
				if (!found && disableDotNotation && fieldName.includes('.')) {
					throw new NodeOperationError(
						this.getNode(),
						`Couldn't find the field '${fieldName}' in the input data`,
						{
							description:
								"If you're trying to use a nested field, make sure you turn off 'disable dot notation' in the node options",
						},
					);
				} else if (!found) {
					throw new NodeOperationError(
						this.getNode(),
						`Couldn't find the field '${fieldName}' in the input data`,
					);
				}
			}

			const sortFieldsWithDirection = sortFields.map((field) => ({
				name: field.fieldName,
				dir: field.order === 'ascending' ? 1 : -1,
			}));

			returnData.sort((a, b) => {
				let result = 0;
				for (const field of sortFieldsWithDirection) {
					let equal;
					if (!disableDotNotation) {
						const _a =
							typeof get(a.json, field.name) === 'string'
								? (get(a.json, field.name) as string).toLowerCase()
								: get(a.json, field.name);
						const _b =
							typeof get(b.json, field.name) === 'string'
								? (get(b.json, field.name) as string).toLowerCase()
								: get(b.json, field.name);
						equal = isEqual(_a, _b);
					} else {
						const _a =
							typeof a.json[field.name] === 'string'
								? (a.json[field.name] as string).toLowerCase()
								: a.json[field.name];
						const _b =
							typeof b.json[field.name] === 'string'
								? (b.json[field.name] as string).toLowerCase()
								: b.json[field.name];
						equal = isEqual(_a, _b);
					}

					if (!equal) {
						let lessThan;
						if (!disableDotNotation) {
							const _a =
								typeof get(a.json, field.name) === 'string'
									? (get(a.json, field.name) as string).toLowerCase()
									: get(a.json, field.name);
							const _b =
								typeof get(b.json, field.name) === 'string'
									? (get(b.json, field.name) as string).toLowerCase()
									: get(b.json, field.name);
							lessThan = lt(_a, _b);
						} else {
							const _a =
								typeof a.json[field.name] === 'string'
									? (a.json[field.name] as string).toLowerCase()
									: a.json[field.name];
							const _b =
								typeof b.json[field.name] === 'string'
									? (b.json[field.name] as string).toLowerCase()
									: b.json[field.name];
							lessThan = lt(_a, _b);
						}
						if (lessThan) {
							result = -1 * field.dir;
						} else {
							result = 1 * field.dir;
						}
						break;
					}
				}
				return result;
			});
		} else {
			returnData = sortByCode.call(this, returnData);
		}
		return [returnData];
	}
}
