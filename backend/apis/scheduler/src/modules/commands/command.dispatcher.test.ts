import { expect, test, describe } from 'bun:test';
import { CommandDispatcher } from './command.dispatcher';

describe('Command Dispatcher', () => {
    test('Should export CommandDispatcher class', () => {
        expect(CommandDispatcher).toBeDefined();
        expect(typeof CommandDispatcher).toBe('function');
    });
});
