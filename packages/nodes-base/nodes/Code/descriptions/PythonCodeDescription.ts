import type { INodeProperties } from 'n8n-workflow';

const commonDescription: INodeProperties = {
	displayName: 'Python',
	name: 'pythonCode',
	type: 'string',
	typeOptions: {
		editor: 'codeNodeEditor',
		editorLanguage: 'python',
	},
	default: '',
	description:
		'نوشتن کد پایتون سفارشی برای پردازش داده‌ها. برای مرجع متغیرها و روش‌ها، <a href="https://docs.n8n.io/code-examples/methods-variables-reference/" target="_blank">اینجا را ببینید</a>.',
	noDataExpression: true,
};

const PRINT_INSTRUCTION =
	'Debug by using <code>print()</code> statements and viewing their output in the browser console.';

export const pythonCodeDescription: INodeProperties[] = [
	{
		...commonDescription,
		displayOptions: {
			show: {
				language: ['python', 'pythonNative'],
				mode: ['runOnceForAllItems'],
			},
		},
	},
	{
		...commonDescription,
		displayOptions: {
			show: {
				language: ['python', 'pythonNative'],
				mode: ['runOnceForEachItem'],
			},
		},
	},
	{
		displayName: PRINT_INSTRUCTION,
		name: 'notice',
		type: 'notice',
		displayOptions: {
			show: {
				language: ['python'],
			},
		},
		default: '',
	},
	{
		displayName: `گزینهٔ (Native Python) از سینتکس و helperهای با پیشوند <code>_</code> پشتیبانی نمی‌کند؛ به‌جز <code>_items</code> در حالت all-items و <code>_item</code> در حالت per-item. برای دیدن فهرست متغیرها و متدهای ویژه، کاراکتر <code>$</code> را تایپ کنید. ${PRINT_INSTRUCTION}`,
		name: 'notice',
		type: 'notice',
		displayOptions: {
			show: {
				language: ['pythonNative'],
			},
		},
		default: '',
	},
];
