import { NodeVM, makeResolverFromLegacyOptions, type Resolver } from '@n8n/vm2';
import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';

import { ExecutionError } from './ExecutionError';
import {
	mapItemNotDefinedErrorIfNeededForRunForEach,
	mapItemsNotDefinedErrorIfNeededForRunForAll,
	validateNoDisallowedMethodsInRunForEach,
} from './JsCodeValidator';
import type { SandboxContext } from './Sandbox';
import { Sandbox } from './Sandbox';
import { ValidationError } from './ValidationError';

const { NODE_FUNCTION_ALLOW_BUILTIN: builtIn, NODE_FUNCTION_ALLOW_EXTERNAL: external } =
	process.env;

export const vmResolver = makeResolverFromLegacyOptions({
	external: external
		? {
				modules: external.split(','),
				transitive: false,
			}
		: false,
	builtin: builtIn?.split(',') ?? [],
});

export class JavaScriptSandbox extends Sandbox {
	private readonly vm: NodeVM;

	constructor(
		context: SandboxContext,
		private jsCode: string,
		helpers: IExecuteFunctions['helpers'],
		options?: { resolver?: Resolver },
	) {
		super(
			{
				object: {
					singular: 'object',
					plural: 'objects',
				},
			},
			helpers,
		);
		this.vm = new NodeVM({
			console: 'redirect',
			sandbox: context,
			require: options?.resolver ?? vmResolver,
			wasm: false,
		});

		this.vm.on('console.log', (...args: unknown[]) => this.emit('output', ...args));
	}

	async runCode<T = unknown>(): Promise<T> {
		const script = `module.exports = async function() {${this.jsCode}\n}()`;
		try {
			const executionResult = (await this.vm.run(script, __dirname)) as T;
			return executionResult;
		} catch (error) {
			throw new ExecutionError(error);
		}
	}

	async runCodeAllItems(options?: {
		multiOutput?: boolean;
	}): Promise<INodeExecutionData[] | INodeExecutionData[][]> {
		const script = `module.exports = async function() {${this.jsCode}\n}()`;

		let executionResult: INodeExecutionData | INodeExecutionData[] | INodeExecutionData[][];

		try {
			executionResult = await this.vm.run(script, __dirname);
		} catch (error) {
			// anticipate user expecting `items` to pre-exist as in Function Item node
			mapItemsNotDefinedErrorIfNeededForRunForAll(this.jsCode, error);

			throw new ExecutionError(error);
		}

		if (executionResult === null) return [];

		if (options?.multiOutput === true) {
			// Check if executionResult is an array of arrays
			if (!Array.isArray(executionResult) || executionResult.some((item) => !Array.isArray(item))) {
				throw new ValidationError({
					message: 'این کد یک آرایه از آرایه‌ها برنمی‌گرداند',
					description:
						'لطفاً یک آرایه از آرایه‌ها بازگردانید. یک آرایه برای خروجی‌های مختلف و یک آرایه برای آیتم‌های مختلفی که بازگردانده می‌شوند.',
				});
			}

			return executionResult.map((data) => {
				return this.validateRunCodeAllItems(data);
			});
		}

		return this.validateRunCodeAllItems(
			executionResult as INodeExecutionData | INodeExecutionData[],
		);
	}

	async runCodeEachItem(itemIndex: number): Promise<INodeExecutionData | undefined> {
		const script = `module.exports = async function() {${this.jsCode}\n}()`;

		validateNoDisallowedMethodsInRunForEach(this.jsCode, itemIndex);

		let executionResult: INodeExecutionData;

		try {
			executionResult = await this.vm.run(script, __dirname);
		} catch (error) {
			// anticipate user expecting `item` to pre-exist as in Function Item node
			mapItemNotDefinedErrorIfNeededForRunForEach(this.jsCode, error);

			throw new ExecutionError(error, itemIndex);
		}

		if (executionResult === null) return undefined;

		return this.validateRunCodeEachItem(executionResult, itemIndex);
	}
}
