import { UserError } from 'n8n-workflow';

type FailureReason = 'python' | 'venv';

const REASONS: Record<FailureReason, string> = {
	python: 'Python 3 is missing from this system',
	venv: 'Virtual environment is missing from this system',
};

export class PythonRunnerUnavailableError extends UserError {
	constructor(reason?: FailureReason) {
		const message = reason
			? `Python runner unavailable: ${REASONS[reason]}`
			: 'Python runner unavailable';

		super(message, {
			description:
				'حالت داخلی (Internal mode) فقط برای دیباگ در نظر گرفته شده است. برای محیط پروداکشن، از حالت خارجی (External mode) استفاده کنید. برای اطلاعات بیشتر، به <a href="https://docs.n8n.io/hosting/configuration/task-runners/#setting-up-external-mode" target="_blank">مستندات</a> مراجعه کنید.',
		});
	}
}
