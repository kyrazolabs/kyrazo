import { describe, it, expect } from 'bun:test';
import { Types } from 'mongoose';
import { prefixId, unprefixId, isValidPrefixedId, transformWithId, ID_PREFIXES } from './id';

describe('ID Utility', () => {
    const validObjectId = new Types.ObjectId().toHexString();

    describe('prefixId', () => {
        it('should prefix a string ID correctly', () => {
            expect(prefixId(validObjectId, 'source')).toBe(`src_${validObjectId}`);
        });

        it('should handle Types.ObjectId', () => {
            const objectId = new Types.ObjectId(validObjectId);
            expect(prefixId(objectId, 'target')).toBe(`trg_${validObjectId}`);
        });

        it('should return undefined for null/undefined', () => {
            expect(prefixId(null as any, 'project')).toBeUndefined();
            expect(prefixId(undefined, 'project')).toBeUndefined();
        });

        it('should NOT double-prefix', () => {
            const prefixed = `src_${validObjectId}`;
            expect(prefixId(prefixed, 'source')).toBe(prefixed);
        });
    });

    describe('unprefixId', () => {
        it('should remove prefix correctly', () => {
            expect(unprefixId(`src_${validObjectId}`)).toBe(validObjectId);
            expect(unprefixId(`trg_${validObjectId}`)).toBe(validObjectId);
            expect(unprefixId(`pro_${validObjectId}`)).toBe(validObjectId);
            expect(unprefixId(`end_${validObjectId}`)).toBe(validObjectId);
        });

        it('should return original string if no prefix or unknown prefix', () => {
            expect(unprefixId(validObjectId)).toBe(validObjectId);
            expect(unprefixId(`unknown_${validObjectId}`)).toBe(`unknown_${validObjectId}`);
        });

        it('should handle undefined/null', () => {
            expect(unprefixId(undefined)).toBeUndefined();
            expect(unprefixId(null as any)).toBeUndefined();
        });
    });

    describe('isValidPrefixedId', () => {
        it('should validate correctly prefixed IDs', () => {
            expect(isValidPrefixedId(`src_${validObjectId}`, 'source')).toBe(true);
            expect(isValidPrefixedId(`trg_${validObjectId}`, 'target')).toBe(true);
        });

        it('should validate with any valid prefix if type not provided', () => {
            expect(isValidPrefixedId(`src_${validObjectId}`)).toBe(true);
            expect(isValidPrefixedId(`pro_${validObjectId}`)).toBe(true);
        });

        it('should fail for incorrect prefix or invalid hex', () => {
            expect(isValidPrefixedId(`src_invalidhex`, 'source')).toBe(false);
            expect(isValidPrefixedId(`trg_${validObjectId}`, 'source')).toBe(false);
            expect(isValidPrefixedId(validObjectId)).toBe(false);
        });
    });

    describe('transformWithId', () => {
        it('should transform a plain object with _id', () => {
            const input = { _id: validObjectId, name: 'Test' };
            const result = transformWithId(input, 'source');
            expect(result.id).toBe(`src_${validObjectId}`);
            expect((result as any)._id).toBeUndefined();
            expect(result.name).toBe('Test');
        });

        it('should transform an array of objects', () => {
            const input = [
                { _id: validObjectId, name: 'Test 1' },
                { _id: validObjectId, name: 'Test 2' },
            ];
            const result = transformWithId(input, 'target');
            expect(result[0].id).toBe(`trg_${validObjectId}`);
            expect(result[1].id).toBe(`trg_${validObjectId}`);
            expect((result[0] as any)._id).toBeUndefined();
        });

        it('should handle objects without _id', () => {
            const input = { name: 'Test' };
            const result = transformWithId(input, 'source');
            expect(result).toEqual(input);
        });
    });
});
