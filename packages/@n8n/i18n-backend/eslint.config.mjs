import baseConfig from '@n8n/eslint-config/base.mjs';

export default [
	...baseConfig,
	{
		ignores: ['dist/**', 'node_modules/**'],
	},
];

