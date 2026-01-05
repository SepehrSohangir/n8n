import set from 'lodash/set';
import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeParameters,
	INodeType,
	INodeTypeBaseDescription,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, deepCopy } from 'n8n-workflow';

const versionDescription: INodeTypeDescription = {
	displayName: 'Set',
	name: 'set',
	icon: 'fa:pen',
	group: ['input'],
	version: [1, 2],
	description: 'تنظیم مقادیر روی آیتم‌ها و به صورت اختیاری حذف مقادیر دیگر',
	defaults: {
		name: 'Set',
		color: '#0000FF',
	},
	inputs: [NodeConnectionTypes.Main],
	outputs: [NodeConnectionTypes.Main],
	properties: [
		{
			displayName: 'فقط نگه داشتن تنظیم شده',
			name: 'keepOnlySet',
			type: 'boolean',
			default: false,
			description: 'آیا فقط مقادیر تنظیم شده در این نود باید حفظ شوند و همه بقیه حذف شوند',
		},
		{
			displayName: 'مقادیر برای تنظیم',
			name: 'values',
			placeholder: 'افزودن مقدار',
			type: 'fixedCollection',
			typeOptions: {
				multipleValues: true,
				sortable: true,
			},
			description: 'مقدار برای تنظیم',
			default: {},
			options: [
				{
					name: 'boolean',
					displayName: 'بولین',
					values: [
						{
							displayName: 'نام',
							name: 'name',
							type: 'string',
							requiresDataPath: 'single',
							default: 'propertyName',
							description:
								'نام ویژگی برای نوشتن داده در آن. از نماد نقطه پشتیبانی می‌کند. مثال: "data.person[0].name"',
						},
						{
							displayName: 'مقدار',
							name: 'value',
							type: 'boolean',
							default: false,
							// eslint-disable-next-line n8n-nodes-base/node-param-description-boolean-without-whether
							description: 'مقدار بولین برای نوشتن در ویژگی',
						},
					],
				},
				{
					name: 'number',
					displayName: 'عدد',
					values: [
						{
							displayName: 'نام',
							name: 'name',
							type: 'string',
							default: 'propertyName',
							requiresDataPath: 'single',
							description:
								'نام ویژگی برای نوشتن داده در آن. از نماد نقطه پشتیبانی می‌کند. مثال: "data.person[0].name"',
						},
						{
							displayName: 'مقدار',
							name: 'value',
							type: 'number',
							default: 0,
							description: 'مقدار عددی برای نوشتن در ویژگی',
						},
					],
				},
				{
					name: 'string',
					displayName: 'رشته',
					values: [
						{
							displayName: 'نام',
							name: 'name',
							type: 'string',
							default: 'propertyName',
							requiresDataPath: 'single',
							description:
								'نام ویژگی برای نوشتن داده در آن. از نماد نقطه پشتیبانی می‌کند. مثال: "data.person[0].name"',
						},
						{
							displayName: 'مقدار',
							name: 'value',
							type: 'string',
							default: '',
							description: 'مقدار رشته برای نوشتن در ویژگی',
						},
					],
				},
			],
		},

		{
			displayName: 'گزینه‌ها',
			name: 'options',
			type: 'collection',
			placeholder: 'افزودن گزینه',
			default: {},
			options: [
				{
					displayName: 'نماد نقطه',
					name: 'dotNotation',
					type: 'boolean',
					default: true,
					// eslint-disable-next-line n8n-nodes-base/node-param-description-boolean-without-whether
					description:
						'<p>به طور پیش‌فرض، نماد نقطه در نام ویژگی‌ها استفاده می‌شود. این به معنای آن است که "a.b" ویژگی "b" را زیر "a" تنظیم می‌کند بنابراین { "a": { "b": value} }.<p></p>اگر این مورد نظر نیست می‌تواند غیرفعال شود، سپس { "a.b": value } را تنظیم می‌کند.</p>.',
				},
			],
		},
	],
};

export class SetV1 implements INodeType {
	description: INodeTypeDescription;

	constructor(baseDescription: INodeTypeBaseDescription) {
		this.description = {
			...baseDescription,
			...versionDescription,
		};
	}

	async execute(this: IExecuteFunctions) {
		const items = this.getInputData();
		const nodeVersion = this.getNode().typeVersion;

		if (items.length === 0) {
			items.push({ json: {}, pairedItem: { item: 0 } });
		}

		const returnData: INodeExecutionData[] = [];

		let item: INodeExecutionData;
		let keepOnlySet: boolean;
		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			keepOnlySet = this.getNodeParameter('keepOnlySet', itemIndex, false) as boolean;
			item = items[itemIndex];
			const options = this.getNodeParameter('options', itemIndex, {});

			const newItem: INodeExecutionData = {
				json: {},
				pairedItem: { item: itemIndex },
			};

			if (!keepOnlySet) {
				if (item.binary !== undefined) {
					// Create a shallow copy of the binary data so that the old
					// data references which do not get changed still stay behind
					// but the incoming data does not get changed.
					newItem.binary = {};
					Object.assign(newItem.binary, item.binary);
				}

				newItem.json = deepCopy(item.json);
			}

			// Add boolean values
			(this.getNodeParameter('values.boolean', itemIndex, []) as INodeParameters[]).forEach(
				(setItem) => {
					if (options.dotNotation === false) {
						newItem.json[setItem.name as string] = !!setItem.value;
					} else {
						set(newItem.json, setItem.name as string, !!setItem.value);
					}
				},
			);

			// Add number values
			(this.getNodeParameter('values.number', itemIndex, []) as INodeParameters[]).forEach(
				(setItem) => {
					if (
						nodeVersion >= 2 &&
						typeof setItem.value === 'string' &&
						!Number.isNaN(Number(setItem.value))
					) {
						setItem.value = Number(setItem.value);
					}
					if (options.dotNotation === false) {
						newItem.json[setItem.name as string] = setItem.value;
					} else {
						set(newItem.json, setItem.name as string, setItem.value);
					}
				},
			);

			// Add string values
			(this.getNodeParameter('values.string', itemIndex, []) as INodeParameters[]).forEach(
				(setItem) => {
					if (options.dotNotation === false) {
						newItem.json[setItem.name as string] = setItem.value;
					} else {
						set(newItem.json, setItem.name as string, setItem.value);
					}
				},
			);

			returnData.push(newItem);
		}

		return [returnData];
	}
}
