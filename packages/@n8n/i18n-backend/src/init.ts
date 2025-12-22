import { setLanguage } from './index';

/**
 * Initialize i18n with the default locale from GlobalConfig
 */
export function initializeI18n(globalConfig: { defaultLocale?: string }): void {
	const defaultLocale = globalConfig.defaultLocale || 'en';
	setLanguage(defaultLocale);
}
