import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import type { Dirent } from 'fs';
import { readdir } from 'fs/promises';
import { addNodeTranslation, setLanguage } from './index';

/**
 * Load node translation from a file path
 */
export async function loadNodeTranslation(
	nodeSourcePath: string,
	longNodeType: string,
	locale: string,
): Promise<object | null> {
	const nodeDir = dirname(nodeSourcePath);
	const maxVersion = await getMaxVersion(nodeDir);
	const nodeType = longNodeType.replace('n8n-nodes-base.', '');

	const translationPath = maxVersion
		? join(nodeDir, `v${maxVersion}`, 'translations', locale, `${nodeType}.json`)
		: join(nodeDir, 'translations', locale, `${nodeType}.json`);

	try {
		const translation = await readFile(translationPath, 'utf8');
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return JSON.parse(translation);
	} catch {
		// Translation file doesn't exist
		return null;
	}
}

/**
 * Load and register node translation with i18n
 */
export async function loadAndRegisterNodeTranslation(
	nodeSourcePath: string,
	longNodeType: string,
	locale: string,
): Promise<void> {
	const translation = await loadNodeTranslation(nodeSourcePath, longNodeType, locale);
	if (translation) {
		const nodeType = longNodeType.replace('n8n-nodes-base.', '');
		addNodeTranslation({ [nodeType]: translation }, locale);
	}
}

/**
 * Get the maximum version directory in a node directory
 */
async function getMaxVersion(dir: string): Promise<number | null> {
	const entries = await readdir(dir, { withFileTypes: true });

	const dirnames = entries.reduce<string[]>((acc, cur) => {
		if (isVersionedDirname(cur)) acc.push(cur.name);
		return acc;
	}, []);

	if (!dirnames.length) return null;

	return Math.max(...dirnames.map((d) => parseInt(d.charAt(1), 10)));
}

/**
 * Check if a directory entry is a versioned directory (e.g., v1, v2)
 */
function isVersionedDirname(dirent: Dirent): boolean {
	if (!dirent.isDirectory()) return false;

	const ALLOWED_VERSIONED_DIRNAME_LENGTH = [2, 3]; // e.g. v1, v10

	return (
		ALLOWED_VERSIONED_DIRNAME_LENGTH.includes(dirent.name.length) &&
		dirent.name.toLowerCase().startsWith('v')
	);
}
