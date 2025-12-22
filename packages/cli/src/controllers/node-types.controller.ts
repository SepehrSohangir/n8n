import { GlobalConfig } from '@n8n/config';
import { Post, RestController } from '@n8n/decorators';
import { Request } from 'express';
import get from 'lodash/get';
import type { INodeTypeDescription, INodeTypeNameVersion } from 'n8n-workflow';
import { setLanguage, loadAndRegisterNodeTranslation } from '@n8n/i18n-backend';

import { NodeTypes } from '@/node-types';

@RestController('/node-types')
export class NodeTypesController {
	constructor(
		private readonly nodeTypes: NodeTypes,
		private readonly globalConfig: GlobalConfig,
	) {}

	@Post('/')
	async getNodeInfo(req: Request) {
		const nodeInfos = get(req, 'body.nodeInfos', []) as INodeTypeNameVersion[];

		const defaultLocale = this.globalConfig.defaultLocale;

		// Set the locale for i18n
		setLanguage(defaultLocale);

		if (defaultLocale === 'en') {
			return nodeInfos.reduce<INodeTypeDescription[]>((acc, { name, version }) => {
				const { description } = this.nodeTypes.getByNameAndVersion(name, version);
				acc.push(description);
				return acc;
			}, []);
		}

		const populateTranslation = async (
			name: string,
			version: number,
			nodeTypes: INodeTypeDescription[],
		) => {
			const { description, sourcePath } = this.nodeTypes.getWithSourcePath(name, version);

			// Load and register node translation with i18n
			await loadAndRegisterNodeTranslation(sourcePath, description.name, defaultLocale);

			// Also attach translation to description for backward compatibility
			const translationPath = await this.nodeTypes.getNodeTranslationPath({
				nodeSourcePath: sourcePath,
				longNodeType: description.name,
				locale: defaultLocale,
			});

			try {
				const { readFile } = await import('fs/promises');
				const translation = await readFile(translationPath, 'utf8');
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				description.translation = JSON.parse(translation);
			} catch {
				// ignore - no translation exists at path
			}

			nodeTypes.push(description);
		};

		const nodeTypes: INodeTypeDescription[] = [];

		const promises = nodeInfos.map(
			async ({ name, version }) => await populateTranslation(name, version, nodeTypes),
		);

		await Promise.all(promises);

		return nodeTypes;
	}
}
