import type { INodeTypeBaseDescription, IVersionedNodeType } from 'n8n-workflow';
import { VersionedNodeType } from 'n8n-workflow';

import { SetV1 } from './v1/SetV1.node';
import { SetV2 } from './v2/SetV2.node';

export class Set extends VersionedNodeType {
	constructor() {
		const baseDescription: INodeTypeBaseDescription = {
			displayName: 'ویرایش فیلدها (Set)',
			name: 'set',
			icon: 'fa:pen',
			group: ['input'],
			description: 'افزودن یا ویرایش فیلدها روی یک آیتم ورودی و به صورت اختیاری حذف فیلدهای دیگر',
			defaultVersion: 3.4,
		};

		const nodeVersions: IVersionedNodeType['nodeVersions'] = {
			1: new SetV1(baseDescription),
			2: new SetV1(baseDescription),
			3: new SetV2(baseDescription),
			3.1: new SetV2(baseDescription),
			3.2: new SetV2(baseDescription),
			3.3: new SetV2(baseDescription),
			3.4: new SetV2(baseDescription),
		};

		super(nodeVersions, baseDescription);
	}
}
