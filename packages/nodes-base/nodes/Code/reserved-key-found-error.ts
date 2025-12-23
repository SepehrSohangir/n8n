import { ValidationError } from './ValidationError';

export class ReservedKeyFoundError extends ValidationError {
	constructor(reservedKey: string, itemIndex: number) {
		super({
			message: 'فرمت خروجی نامعتبر است',
			description: `یک آیتم خروجی شامل کلید رزرو شده <code>${reservedKey}</code> است. برای رفع این مشکل، لطفاً هر آیتم را در یک شیء قرار دهید، زیر کلیدی به نام <code>json</code>. <a href="https://docs.n8n.io/data/data-structure/#data-structure" target="_blank">مثال</a>`,
			itemIndex,
		});
	}
}
