import { UserError } from 'n8n-workflow';

export class NativePythonWithoutRunnerError extends UserError {
	constructor() {
		super(
			'گزینهٔ (Native Python) بدون اجرای کد پشتیبانی نمی‌شود. لطفاً حالت اجرای را به "یک‌بار اجرا برای همه موارد" یا "اجرای جداگانه برای هر آیتم" تغییر دهید.',
		);
	}
}
