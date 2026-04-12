import { ITransform, ITransformVersion } from '@kyrazo/shared';
import { transformRepository } from './transforms.repo';
import { CreateTransformInput, UpdateTransformInput } from './transforms.schema';

export class TransformService {
    private readonly DANGEROUS_PATTERNS = [
        /eval\s*\(/,
        /new\s+Function\s*\(/,
        /Function\s*\(/,
        /__proto__/,
        /\.prototype/,
        /constructor\.prototype/,
        /process\./,
        /require\s*\(/,
        /import\s*\(/,
        /setTimeout\s*\(/,
        /setInterval\s*\(/,
        /setImmediate\s*\(/,
        /global\s*\./,
    ];

    validateCode(code: string): { valid: boolean; error?: string } {
        for (const pattern of this.DANGEROUS_PATTERNS) {
            if (pattern.test(code)) {
                return {
                    valid: false,
                    error: `Dangerous code pattern detected: ${pattern.toString()}`,
                };
            }
        }
        return { valid: true };
    }

    async createTransform(
        data: CreateTransformInput, 
        userId: string, 
        workspaceId: string, 
        namespaceId: string
    ): Promise<ITransform> {
        const validation = this.validateCode(data.code);
        if (!validation.valid) {
            throw new Error(validation.error);
        }

        return transformRepository.create(
            {
                ...data,
                workspaceId: workspaceId as any,
                namespaceId: namespaceId as any,
            },
            userId
        );
    }

    async getTransforms(
        query: Record<string, unknown>,
        limit: number,
        page: number
    ): Promise<{ transforms: ITransform[]; total: number }> {
        return transformRepository.findAll({ query, limit, page });
    }

    async getTransformById(id: string, workspaceId: string, namespaceId: string): Promise<ITransform> {
        const transform = await transformRepository.findById(id, workspaceId, namespaceId);
        if (!transform) throw new Error('Transform not found');
        return transform;
    }

    async updateTransform(
        id: string,
        workspaceId: string,
        namespaceId: string,
        data: UpdateTransformInput,
        userId: string
    ): Promise<ITransform> {
        if (data.code) {
            const validation = this.validateCode(data.code);
            if (!validation.valid) {
                throw new Error(validation.error);
            }
        }

        const updated = await transformRepository.update(id, workspaceId, namespaceId, data, userId);
        if (!updated) throw new Error('Transform not found');
        return updated;
    }

    async deleteTransform(id: string, workspaceId: string, namespaceId: string): Promise<boolean> {
        return transformRepository.deleteById(id, workspaceId, namespaceId);
    }

    async getVersions(id: string): Promise<ITransformVersion[]> {
        return transformRepository.getVersions(id);
    }

    async rollback(
        id: string,
        workspaceId: string,
        namespaceId: string,
        version: number,
        userId: string
    ): Promise<ITransform> {
        const rolledBack = await transformRepository.rollback(id, workspaceId, namespaceId, version, userId);
        if (!rolledBack) throw new Error('Rollback failed');
        return rolledBack;
    }

    async testTransform(code: string, payload: any): Promise<{ result: any; logs: string[]; executionTimeMs: number }> {
        const validation = this.validateCode(code);
        if (!validation.valid) {
            throw new Error(validation.error);
        }

        const logs: string[] = [];
        const startTime = performance.now();

        try {
            // Context for the transformer
            const context = {
                console: {
                    log: (...args: any[]) => logs.push(args.map(a => String(a)).join(' ')),
                    error: (...args: any[]) => logs.push(`ERROR: ${args.map(a => String(a)).join(' ')}`),
                    info: (...args: any[]) => logs.push(`INFO: ${args.map(a => String(a)).join(' ')}`),
                },
            };

            // Wrap code in a function
            // Expecting: (event) => { ... return result; }
            // Or just a block that returns
            const script = `
                return (function(event) {
                    const console = this.console;
                    ${code}
                }).call(this, payload);
            `;

            const fn = new Function('payload', script);
            const result = fn.call(context, payload);
            
            const executionTimeMs = performance.now() - startTime;

            return {
                result,
                logs,
                executionTimeMs,
            };
        } catch (error: any) {
            const executionTimeMs = performance.now() - startTime;
            return {
                result: null,
                logs: [...logs, `Runtime Error: ${error.message}`],
                executionTimeMs,
            };
        }
    }
}

export const transformService = new TransformService();
