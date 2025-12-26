/* eslint-disable n8n-nodes-base/node-filename-against-convention */
import { NodeConnectionTypes, type INodeTypeDescription } from 'n8n-workflow';

import * as mode from './mode';
import { configuredInputs } from '../helpers/utils';

export const versionDescription: INodeTypeDescription = {
	displayName: 'ادغام',
	name: 'merge',
	group: ['transform'],
	description: 'ادغام داده‌های چندین جریان پس از در دسترس بودن داده از هر دو',
	version: [3, 3.1, 3.2],
	defaults: {
		name: 'ادغام',
	},
	inputs: `={{(${configuredInputs})($parameter)}}`,
	outputs: [NodeConnectionTypes.Main],
	// If mode is chooseBranch data from both branches is required
	// to continue, else data from any input suffices
	requiredInputs: '={{ $parameter["mode"] === "chooseBranch" ? [0, 1] : 1 }}',
	properties: [...mode.description],
};
