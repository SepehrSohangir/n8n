import get from 'lodash/get';
import set from 'lodash/set';
import unset from 'lodash/unset';
import { NodeConnectionTypes, deepCopy } from 'n8n-workflow';
import type {
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
interface IRenameKey {
	currentKey: string;
	newKey: string;
}

export class RenameKeys implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'تغییر نام کلیدها',
		name: 'renameKeys',
		icon: 'fa:edit',
		iconColor: 'crimson',
		group: ['transform'],
		version: 1,
		description: 'به‌روزرسانی نام فیلدهای آیتم',
		defaults: {
			name: 'تغییر نام کلیدها',
			color: '#772244',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		properties: [
			{
				displayName: 'کلیدها',
				name: 'keys',
				placeholder: 'افزودن کلید جدید',
				description: 'افزودن کلیدی که باید تغییر نام داده شود',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
					sortable: true,
				},
				default: {},
				options: [
					{
						displayName: 'کلید',
						name: 'key',
						values: [
							{
								displayName: 'نام کلید فعلی',
								name: 'currentKey',
								type: 'string',
								default: '',
								placeholder: 'currentKey',
								requiresDataPath: 'single',
								description:
									'نام فعلی کلید. همچنین می‌توان کلیدهای عمیق را با استفاده از نماد نقطه مانند "level1.level2.currentKey" تعریف کرد.',
							},
							{
								displayName: 'نام کلید جدید',
								name: 'newKey',
								type: 'string',
								default: '',
								placeholder: 'newKey',
								description:
									'نامی که کلید باید به آن تغییر نام داده شود. همچنین می‌توان کلیدهای عمیق را با استفاده از نماد نقطه مانند "level1.level2.newKey" تعریف کرد.',
							},
						],
					},
				],
			},
			{
				displayName: 'گزینه‌های اضافی',
				name: 'additionalOptions',
				type: 'collection',
				default: {},
				placeholder: 'افزودن گزینه',
				options: [
					{
						displayName: 'Regex',
						name: 'regexReplacement',
						placeholder: 'افزودن عبارت باقاعده جدید',
						description: 'افزودن یک عبارت باقاعده',
						type: 'fixedCollection',
						typeOptions: {
							multipleValues: true,
							sortable: true,
						},
						default: {},
						options: [
							{
								displayName: 'جایگزینی',
								name: 'replacements',
								values: [
									{
										displayName:
											'توجه داشته باشید که با استفاده از عبارت باقاعده، کلیدهای قبلاً تغییر نام داده شده ممکن است تحت تأثیر قرار گیرند',
										name: 'regExNotice',
										type: 'notice',
										default: '',
									},
									{
										displayName: 'عبارت باقاعده',
										name: 'searchRegex',
										type: 'string',
										default: '',
										placeholder: 'مثلاً [N-n]ame',
										description: 'Regex برای تطبیق نام کلید',
										hint: 'در مورد RegEx <a href="https://regex101.com/">اینجا</a> بیشتر بیاموزید و آن را تست کنید',
									},
									{
										displayName: 'جایگزینی با',
										name: 'replaceRegex',
										type: 'string',
										default: '',
										placeholder: 'replacedName',
										description:
											'نامی که کلید(ها) باید به آن تغییر نام داده شوند. می‌توان از گروه‌های تطبیق regex مانند $1, $2, ... استفاده کرد.',
									},
									{
										displayName: 'گزینه‌ها',
										name: 'options',
										type: 'collection',
										default: {},
										placeholder: 'افزودن گزینه Regex',
										options: [
											{
												displayName: 'غیر حساس به حروف کوچک و بزرگ',
												name: 'caseInsensitive',
												type: 'boolean',
												description: 'آیا از تطابق غیر حساس به حروف کوچک و بزرگ استفاده شود',
												default: false,
											},
											{
												displayName: 'حداکثر عمق',
												name: 'depth',
												type: 'number',
												default: -1,
												description: 'حداکثر عمق برای جایگزینی کلیدها',
												hint: 'عدد را برای سطح عمق مشخص کنید (-1 برای نامحدود، 0 فقط برای سطح بالا)',
											},
										],
									},
								],
							},
						],
					},
				],
			},
		],
		hints: [
			{
				type: 'warning',
				message:
					'Complex regex patterns like nested quantifiers .*+, ()*+, or multiple wildcards may cause performance issues. Consider using simpler patterns like [a-z]+ or \\w+ for better performance.',
				displayCondition:
					'={{ $parameter.additionalOptions.regexReplacement.replacements && $parameter.additionalOptions.regexReplacement.replacements.some(r => r.searchRegex && /(\\.\\*\\+|\\)\\*\\+|\\+\\*|\\*.*\\*|\\+.*\\+|\\?.*\\?|\\{[0-9]+,\\}|\\*{2,}|\\+{2,}|\\?{2,}|[a-zA-Z0-9]{4,}[\\*\\+]|\\([^)]*\\|[^)]*\\)[\\*\\+])/.test(r.searchRegex)) }}',
				whenToDisplay: 'always',
				location: 'outputPane',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		let item: INodeExecutionData;
		let newItem: INodeExecutionData;
		let renameKeys: IRenameKey[];
		let value: any;

		const renameKey = (key: IRenameKey) => {
			if (key.currentKey === '' || key.newKey === '' || key.currentKey === key.newKey) {
				// Ignore all which do not have all the values set or if the new key is equal to the current key
				return;
			}
			value = get(item.json, key.currentKey);
			if (value === undefined) {
				return;
			}
			set(newItem.json, key.newKey, value);

			unset(newItem.json, key.currentKey);
		};

		const regexReplaceKey = (replacement: IDataObject) => {
			const { searchRegex, replaceRegex, options } = replacement;
			const { depth, caseInsensitive } = options as IDataObject;

			const flags = (caseInsensitive as boolean) ? 'i' : undefined;

			const regex = new RegExp(searchRegex as string, flags);

			const renameObjectKeys = (obj: IDataObject, objDepth: number) => {
				for (const key in obj) {
					if (Array.isArray(obj)) {
						// Don't rename array object references
						if (objDepth !== 0) {
							renameObjectKeys(obj[key] as IDataObject, objDepth - 1);
						}
					} else if (obj.hasOwnProperty(key)) {
						if (typeof obj[key] === 'object' && objDepth !== 0) {
							renameObjectKeys(obj[key] as IDataObject, objDepth - 1);
						}
						if (key.match(regex)) {
							const newKey = key.replace(regex, replaceRegex as string);
							if (newKey !== key) {
								obj[newKey] = obj[key];
								delete obj[key];
							}
						}
					}
				}
				return obj;
			};
			newItem.json = renameObjectKeys(newItem.json, depth as number);
		};
		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				renameKeys = this.getNodeParameter('keys.key', itemIndex, []) as IRenameKey[];
				const regexReplacements = this.getNodeParameter(
					'additionalOptions.regexReplacement.replacements',
					itemIndex,
					[],
				) as IDataObject[];

				item = items[itemIndex];

				// Copy the whole JSON data as data on any level can be renamed
				newItem = {
					json: deepCopy(item.json),
					pairedItem: {
						item: itemIndex,
					},
				};

				if (item.binary !== undefined) {
					// Reference binary data if any exists. We can reference it
					// as this nodes does not change it
					newItem.binary = item.binary;
				}

				renameKeys.forEach(renameKey);

				regexReplacements.forEach(regexReplaceKey);

				returnData.push(newItem);
			} catch (error) {
				if (this.continueOnFail()) {
					const executionErrorData = this.helpers.constructExecutionMetaData(
						this.helpers.returnJsonArray({ error: error.message }),
						{ itemData: { item: itemIndex } },
					);
					returnData.push(...executionErrorData);
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
