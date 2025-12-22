import i18next from 'i18next';
import type { INodeProperties, INodePropertyCollection, INodePropertyOptions } from 'n8n-workflow';

import englishBaseText from '../locales/en.json';
import persianBaseText from '../locales/fa.json';
import type { BaseTextKey, LocaleMessages, INodeTranslationHeaders } from './types';

// Initialize i18next
const i18nInstance = i18next.init({
	lng: 'en',
	fallbackLng: 'en',
	resources: {
		en: { translation: englishBaseText },
		fa: { translation: persianBaseText },
	},
	interpolation: {
		escapeValue: false, // React already escapes values
	},
	returnEmptyString: false,
	returnNull: false,
});

export type * from './types';

type BaseTextOptions = {
	adjustToNumber?: number;
	interpolate?: Record<string, string | number>;
};

export class I18nClass {
	private baseTextCache = new Map<string, string>();

	// ----------------------------------
	//         helper methods
	// ----------------------------------

	exists(key: string) {
		return i18nInstance.exists(key);
	}

	shortNodeType(longNodeType: string) {
		return longNodeType.replace('n8n-nodes-base.', '');
	}

	get locale() {
		return i18nInstance.language;
	}

	set locale(locale: string) {
		i18nInstance.changeLanguage(locale);
		this.clearCache();
	}

	// ----------------------------------
	//        render methods
	// ----------------------------------

	/**
	 * Render a string of base text, i.e. a string with a fixed path to the localized value.
	 * Optionally allows for interpolation when the localized value contains a string between curly braces.
	 */
	baseText(key: BaseTextKey, options?: BaseTextOptions): string {
		// Create a unique cache key
		const cacheKey = `${key}-${JSON.stringify(options)}`;

		// Check if the result is already cached
		if (this.baseTextCache.has(cacheKey)) {
			return this.baseTextCache.get(cacheKey) ?? key;
		}

		const interpolate = { ...options?.interpolate };
		let result: string;

		if (options?.adjustToNumber !== undefined) {
			result = i18nInstance.t(key, {
				...interpolate,
				count: options.adjustToNumber,
			}) as string;
		} else {
			result = i18nInstance.t(key, interpolate) as string;
		}

		// Store the result in the cache
		this.baseTextCache.set(cacheKey, result);

		return result;
	}

	/**
	 * Clear cached baseText results. Useful when locale messages are updated at runtime or locale changes.
	 */
	clearCache() {
		this.baseTextCache.clear();
	}

	/**
	 * Render a string of dynamic text, i.e. a string with a constructed path to the localized value.
	 */
	private dynamicRender({ key, fallback }: { key: string; fallback?: string }) {
		return i18nInstance.exists(key) ? (i18nInstance.t(key) as string) : (fallback ?? '');
	}

	displayTimer(msPassed: number, showMs = false): string {
		if (msPassed > 0 && msPassed < 1000 && showMs) {
			return `${msPassed}${this.baseText('genericHelpers.millis')}`;
		}

		const parts = [];
		const second = 1000;
		const minute = 60 * second;
		const hour = 60 * minute;

		let remainingMs = msPassed;

		if (remainingMs >= hour) {
			parts.push(`${Math.floor(remainingMs / hour)}${this.baseText('genericHelpers.hrsShort')}`);
			remainingMs = remainingMs % hour;
		}

		if (parts.length > 0 || remainingMs >= minute) {
			parts.push(`${Math.floor(remainingMs / minute)}${this.baseText('genericHelpers.minShort')}`);
			remainingMs = remainingMs % minute;
		}

		const remainingSec = showMs ? remainingMs / second : Math.floor(remainingMs / second);

		parts.push(`${remainingSec}${this.baseText('genericHelpers.secShort')}`);

		return parts.join(' ');
	}

	/**
	 * Render a string of header text (a node's name and description),
	 * used variously in the nodes panel, under the node icon, etc.
	 */
	headerText(arg: { key: string; fallback: string }) {
		return this.dynamicRender(arg);
	}

	/**
	 * Namespace for methods to render text in the credentials details modal.
	 */
	credText(credentialType: string | null) {
		const credentialPrefix = `n8n-nodes-base.credentials.${credentialType}`;
		const context = this;

		return {
			/**
			 * Display name for a top-level param.
			 */
			inputLabelDisplayName({ name: parameterName, displayName }: INodeProperties) {
				if (['clientId', 'clientSecret'].includes(parameterName)) {
					return context.dynamicRender({
						key: `_reusableDynamicText.oauth2.${parameterName}`,
						fallback: displayName,
					});
				}

				return context.dynamicRender({
					key: `${credentialPrefix}.${parameterName}.displayName`,
					fallback: displayName,
				});
			},

			/**
			 * Hint for a top-level param.
			 */
			hint({ name: parameterName, hint }: INodeProperties) {
				return context.dynamicRender({
					key: `${credentialPrefix}.${parameterName}.hint`,
					fallback: hint,
				});
			},

			/**
			 * Description (tooltip text) for an input label param.
			 */
			inputLabelDescription({ name: parameterName, description }: INodeProperties) {
				return context.dynamicRender({
					key: `${credentialPrefix}.${parameterName}.description`,
					fallback: description,
				});
			},

			/**
			 * Display name for an option inside an `options` or `multiOptions` param.
			 */
			optionsOptionDisplayName(
				{ name: parameterName }: INodeProperties,
				{ value: optionName, name: displayName }: INodePropertyOptions,
			) {
				return context.dynamicRender({
					key: `${credentialPrefix}.${parameterName}.options.${optionName}.displayName`,
					fallback: displayName,
				});
			},

			/**
			 * Description for an option inside an `options` or `multiOptions` param.
			 */
			optionsOptionDescription(
				{ name: parameterName }: INodeProperties,
				{ value: optionName, description }: INodePropertyOptions,
			) {
				return context.dynamicRender({
					key: `${credentialPrefix}.${parameterName}.options.${optionName}.description`,
					fallback: description,
				});
			},

			/**
			 * Placeholder for a `string` param.
			 */
			placeholder({ name: parameterName, placeholder }: INodeProperties) {
				return context.dynamicRender({
					key: `${credentialPrefix}.${parameterName}.placeholder`,
					fallback: placeholder,
				});
			},
		};
	}

	/**
	 * Namespace for methods to render text in the node details view.
	 */
	nodeText(activeNodeType?: string | null) {
		const shortNodeType = activeNodeType ? this.shortNodeType(activeNodeType) : '';
		const initialKey = `n8n-nodes-base.nodes.${shortNodeType}.nodeView`;
		const context = this;

		return {
			/**
			 * Display name for an input label, whether top-level or nested.
			 */
			inputLabelDisplayName(parameter: INodeProperties | INodePropertyCollection, path: string) {
				const middleKey = context.deriveMiddleKey(path, parameter);

				return context.dynamicRender({
					key: `${initialKey}.${middleKey}.displayName`,
					fallback: parameter.displayName,
				});
			},

			/**
			 * Description (tooltip text) for an input label, whether top-level or nested.
			 */
			inputLabelDescription(parameter: INodeProperties, path: string) {
				const middleKey = context.deriveMiddleKey(path, parameter);

				return context.dynamicRender({
					key: `${initialKey}.${middleKey}.description`,
					fallback: parameter.description,
				});
			},

			/**
			 * Hint for an input, whether top-level or nested.
			 */
			hint(parameter: INodeProperties, path: string): string {
				const middleKey = context.deriveMiddleKey(path, parameter);

				return context.dynamicRender({
					key: `${initialKey}.${middleKey}.hint`,
					fallback: parameter.hint,
				});
			},

			/**
			 * Placeholder for an input label or `collection` or `fixedCollection` param,
			 * whether top-level or nested.
			 */
			placeholder(parameter: INodeProperties, path: string) {
				let middleKey = parameter.name;

				if (context.isNestedInCollectionLike(path)) {
					const pathSegments = context.normalize(path).split('.');
					middleKey = context.insertOptionsAndValues(pathSegments).join('.');
				}

				return context.dynamicRender({
					key: `${initialKey}.${middleKey}.placeholder`,
					fallback: parameter.placeholder,
				});
			},

			/**
			 * Display name for an option inside an `options` or `multiOptions` param,
			 * whether top-level or nested.
			 */
			optionsOptionDisplayName(
				parameter: INodeProperties,
				{ value: optionName, name: displayName }: INodePropertyOptions,
				path: string,
			) {
				let middleKey = parameter.name;

				if (context.isNestedInCollectionLike(path)) {
					const pathSegments = context.normalize(path).split('.');
					middleKey = context.insertOptionsAndValues(pathSegments).join('.');
				}

				return context.dynamicRender({
					key: `${initialKey}.${middleKey}.options.${optionName}.displayName`,
					fallback: displayName,
				});
			},

			/**
			 * Description for an option inside an `options` or `multiOptions` param,
			 * whether top-level or nested.
			 */
			optionsOptionDescription(
				parameter: INodeProperties,
				{ value: optionName, description }: INodePropertyOptions,
				path: string,
			) {
				let middleKey = parameter.name;

				if (context.isNestedInCollectionLike(path)) {
					const pathSegments = context.normalize(path).split('.');
					middleKey = context.insertOptionsAndValues(pathSegments).join('.');
				}

				return context.dynamicRender({
					key: `${initialKey}.${middleKey}.options.${optionName}.description`,
					fallback: description,
				});
			},

			/**
			 * Display name for an option in the dropdown menu of a `collection` or
			 * fixedCollection` param. No nesting support since `collection` cannot
			 * be nested in a `collection` or in a `fixedCollection`.
			 */
			collectionOptionDisplayName(
				parameter: INodeProperties,
				{ name: optionName, displayName }: INodePropertyCollection,
				path: string,
			) {
				let middleKey = parameter.name;

				if (context.isNestedInCollectionLike(path)) {
					const pathSegments = context.normalize(path).split('.');
					middleKey = context.insertOptionsAndValues(pathSegments).join('.');
				}

				return context.dynamicRender({
					key: `${initialKey}.${middleKey}.options.${optionName}.displayName`,
					fallback: displayName,
				});
			},

			/**
			 * Text for a button to add another option inside a `collection` or
			 * `fixedCollection` param having `multipleValues: true`.
			 */
			multipleValueButtonText({ name: parameterName, typeOptions }: INodeProperties) {
				return context.dynamicRender({
					key: `${initialKey}.${parameterName}.multipleValueButtonText`,
					fallback: typeOptions?.multipleValueButtonText,
				});
			},

			eventTriggerDescription(nodeType: string, eventTriggerDescription: string) {
				return context.dynamicRender({
					key: `n8n-nodes-base.nodes.${nodeType}.nodeView.eventTriggerDescription`,
					fallback: eventTriggerDescription,
				});
			},
		};
	}

	localizeNodeName(language: string, nodeName: string, type: string) {
		if (language === 'en') return nodeName;

		const nodeTypeName = this.shortNodeType(type);

		return this.headerText({
			key: `headers.${nodeTypeName}.displayName`,
			fallback: nodeName,
		});
	}

	// ----------------------------------
	//         utility methods
	// ----------------------------------

	private deriveMiddleKey(path: string, parameter: { name: string; type?: string }) {
		let middleKey = parameter.name;

		if (this.isTopLevelCollection(path, parameter) || this.isNestedInCollectionLike(path)) {
			const pathSegments = this.normalize(path).split('.');
			middleKey = this.insertOptionsAndValues(pathSegments).join('.');
		}

		if (this.isNestedCollection(path, parameter) || this.isFixedCollection(path, parameter)) {
			const pathSegments = [...this.normalize(path).split('.'), parameter.name];
			middleKey = this.insertOptionsAndValues(pathSegments).join('.');
		}

		return middleKey;
	}

	private isNestedInCollectionLike(path: string) {
		return path.split('.').length >= 3;
	}

	private isTopLevelCollection(path: string, parameter: { type?: string }) {
		return path.split('.').length === 2 && parameter.type === 'collection';
	}

	private isNestedCollection(path: string, parameter: { type?: string }) {
		return path.split('.').length > 2 && parameter.type === 'collection';
	}

	private isFixedCollection(path: string, parameter: { type?: string }) {
		return parameter.type === 'fixedCollection' && path !== 'parameters';
	}

	private normalize(path: string) {
		return path.replace(/\[.*?\]/g, '').replace('parameters.', '');
	}

	private insertOptionsAndValues(pathSegments: string[]) {
		return pathSegments.reduce<string[]>((acc, cur, i) => {
			acc.push(cur);

			if (i === pathSegments.length - 1) return acc;

			acc.push(i % 2 === 0 ? 'options' : 'values');

			return acc;
		}, []);
	}
}

export const i18n: I18nClass = new I18nClass();

/**
 * Set the language/locale for i18n
 */
export function setLanguage(locale: string) {
	i18n.locale = locale;
	return locale;
}

/**
 * Load a language with messages
 */
export function loadLanguage(locale: string, messages: LocaleMessages) {
	i18nInstance.addResourceBundle(locale, 'translation', messages, true, true);
	i18n.locale = locale;
	return locale;
}

/**
 * Add a node translation to the i18n instance's `messages` object.
 */
export function addNodeTranslation(
	nodeTranslation: { [nodeType: string]: object },
	language: string,
) {
	const newMessages = {
		'n8n-nodes-base': {
			nodes: nodeTranslation,
		},
	};

	i18nInstance.addResourceBundle(language, 'translation', newMessages, true, true);
}

/**
 * Update locale messages for a locale
 */
export function updateLocaleMessages(locale: string, messages: LocaleMessages) {
	i18nInstance.addResourceBundle(locale, 'translation', messages, true, true);
	i18n.clearCache();
}

/**
 * Add a credential translation to the i18n instance's `messages` object.
 */
export function addCredentialTranslation(
	nodeCredentialTranslation: { [credentialType: string]: object },
	language: string,
) {
	const newMessages = {
		'n8n-nodes-base': {
			credentials: nodeCredentialTranslation,
		},
	};

	i18nInstance.addResourceBundle(language, 'translation', newMessages, true, true);
}

/**
 * Add a node's header strings to the i18n instance's `messages` object.
 */
export function addHeaders(headers: INodeTranslationHeaders, language: string) {
	i18nInstance.addResourceBundle(language, 'translation', { headers: headers.data }, true, true);
}

export { i18nInstance };

// Export node translation utilities
export * from './node-translations';

// Export initialization function
export { initializeI18n } from './init';
