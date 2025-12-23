import type { INodeProperties } from 'n8n-workflow';

const commonDescription: INodeProperties = {
	displayName: 'جاوااسکریپت',
	name: 'jsCode',
	type: 'string',
	typeOptions: {
		editor: 'codeNodeEditor',
		editorLanguage: 'javaScript',
	},
	default: '',
	description:
		'نوشتن کد جاوااسکریپت سفارشی برای پردازش داده‌ها. برای مرجع متغیرها و روش‌ها، <a href="https://docs.n8n.io/code-examples/methods-variables-reference/" target="_blank">اینجا را ببینید</a>.',
	noDataExpression: true,
};

const v1Properties: INodeProperties[] = [
	{
		...commonDescription,
		displayOptions: {
			show: {
				'@version': [1],
				mode: ['runOnceForAllItems'],
			},
		},
	},
	{
		...commonDescription,
		displayOptions: {
			show: {
				'@version': [1],
				mode: ['runOnceForEachItem'],
			},
		},
	},
];

const v2Properties: INodeProperties[] = [
	{
		...commonDescription,
		displayOptions: {
			show: {
				'@version': [2],
				language: ['javaScript'],
				mode: ['runOnceForAllItems'],
			},
		},
	},
	{
		...commonDescription,
		displayOptions: {
			show: {
				'@version': [2],
				language: ['javaScript'],
				mode: ['runOnceForEachItem'],
			},
		},
	},
];

export const javascriptCodeDescription: INodeProperties[] = [
	...v1Properties,
	...v2Properties,
	{
		displayName:
			'برای دیدن فهرست متغیرها و متدهای ویژه، کاراکتر <code>$</code> را تایپ کنید. برای دیباگ کردن، از دستور <code>console.log()</code> استفاده کنید و خروجی آن را در کنسول مرورگر مشاهده کنید.',
		name: 'notice',
		type: 'notice',
		displayOptions: {
			show: {
				language: ['javaScript'],
			},
		},
		default: '',
	},
];
