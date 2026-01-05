import { Context, Next } from 'hono';
import { ZodError } from 'zod';
import { logger } from '@/configs';

// /**
//  * @title Validation Middleware Factory
//  * @description Creates a validation middleware using a Zod schema
//  * @param {any} schema - The Zod schema to validate against
//  * @param {string} [source='body'] - The source to validate ('body', 'query', 'param')
//  * @returns {Function} The validation middleware function
//  * @example
//  * app.post('/sources', validate(SourceEventSchema), (c) => { ... });
//  */
// export const validate = (schema: any, source: 'body' | 'query' | 'param' = 'body') => {
//   return async (c: AppContext, next: Next) => {
//     try {
//       let data: any;

//       switch (source) {
//         case 'body':
//           data = await c.req.json();
//           break;
//         case 'query':
//           data = c.req.query();
//           break;
//         case 'param':
//           data = c.req.param();
//           break;
//         default:
//           data = await c.req.json();
//       }

//       const validatedData = schema.parse(data);

//       // Attach validated data to context
//       c.set('validatedData', validatedData);

//       await next();
//     } catch (error) {
//       if (error instanceof ZodError) {
//         throw createValidationError('Validation failed', {
//           errors: error.issues.map(err => ({
//             field: err.path.join('.'),
//             message: err.message,
//             code: err.code,
//           }))
//         });
//       }
//       throw error;
//     }
//   };
// };

// /**
//  * @title Get Validated Event
//  * @description Helper function to get validated event data from context
//  * @param {Context} c - Hono context
//  * @returns {any} The validated event data
//  * @example
//  * const event = getValidatedEvent(c);
//  */
// export const getValidatedEvent = (c: AppContext): any => {
//   return (c as any).get('validatedEvent');
// };

// /**
//  * @title EventCreateValidation
//  * @description Validation function for source event creation
//  * @returns {Function} The validation middleware function
//  * @example
//  * sources.post('/', EventCreateValidation(), (c) => { ... });
//  */
// export const EventCreateValidation = () => {
//   return async (c: AppContext, next: Next) => {
//     try {
//       let data;
//       try {
//         const rawBody = await c.req.text();
//         logger.debug('Raw request body:', rawBody);

//         if (!rawBody || rawBody.trim() === '') {
//           throw new Error('Request body is empty');
//         }

//         data = JSON.parse(rawBody);
//         logger.debug('Parsed JSON data:', data);
//       } catch (jsonError) {
//         logger.error('JSON parsing failed:', jsonError);
//         throw createValidationError('Invalid JSON format', {
//           error: 'The request body must be valid JSON',
//           details: jsonError instanceof Error ? jsonError.message : 'Unknown JSON error'
//         });
//       }
//       // Import the schema here to avoid circular dependencies
//       const { SourceEventSchema } = await import('../validations/event.validation');

//       const validatedEvent = SourceEventSchema.parse(data);
//       c.set('validatedEvent', validatedEvent);

//       await next();
//     } catch (error) {
//       if (error instanceof ZodError) {
//         throw createValidationError('Event validation failed', {
//           errors: error.issues.map(err => ({
//             field: err.path.join('.'),
//             message: err.message,
//             code: err.code,
//           }))
//         });
//       }
//       throw error;
//     }
//   };
// };

// /**
//  * @title EventStrictValidation
//  * @description Validation function for source events with strict event type checking
//  * @returns {Function} The validation middleware function
//  * @example
//  * sources.post('/strict', EventStrictValidation(), (c) => { ... });
//  */
// export const EventStrictValidation = () => {
//   return async (c: AppContext, next: Next) => {
//     try {
//       const data = await c.req.json();

//       // Import the schema here to avoid circular dependencies
//       const { StrictSourceEventSchema } = await import('../validations/event.validation');

//       const validatedEvent = StrictSourceEventSchema.parse(data);
//       c.set('validatedEvent', validatedEvent);

//       await next();
//     } catch (error) {
//       if (error instanceof ZodError) {
//         throw createValidationError('Strict event validation failed', {
//           errors: error.issues.map(err => ({
//             field: err.path.join('.'),
//             message: err.message,
//             code: err.code,
//           }))
//         });
//       }
//       throw error;
//     }
//   };
// };

// /**
//  * @title EventQueryValidation
//  * @description Validation function for event query parameters
//  * @returns {Function} The validation middleware function
//  * @example
//  * sources.get('/events', EventQueryValidation(), (c) => { ... });
//  */
// export const EventQueryValidation = () => {
//   return async (c: AppContext, next: Next) => {
//     try {
//       const query = c.req.query();

//       // Import the schema here to avoid circular dependencies
//       const { EventQuerySchema } = await import('../validations/event.validation');

//       const validatedQuery = EventQuerySchema.parse(query);
//       c.set('validatedQuery', validatedQuery);

//       await next();
//     } catch (error) {
//       if (error instanceof ZodError) {
//         throw createValidationError('Query validation failed', {
//           errors: error.issues.map(err => ({
//             field: err.path.join('.'),
//             message: err.message,
//             code: err.code,
//           }))
//         });
//       }
//       throw error;
//     }
//   };
// };

// /**
//  * @title EventBatchValidation
//  * @description Validation function for batch event processing
//  * @returns {Function} The validation middleware function
//  * @example
//  * sources.post('/batch', EventBatchValidation(), (c) => { ... });
//  */
// export const EventBatchValidation = () => {
//   return async (c: AppContext, next: Next) => {
//     try {
//       const data = await c.req.json();

//       // Import the schema here to avoid circular dependencies
//       const { BatchEventSchema } = await import('../validations/event.validation');

//       const validatedBatch = BatchEventSchema.parse(data);
//       c.set('validatedBatch', validatedBatch);

//       await next();
//     } catch (error) {
//       if (error instanceof ZodError) {
//         throw createValidationError('Batch validation failed', {
//           errors: error.issues.map(err => ({
//             field: err.path.join('.'),
//             message: err.message,
//             code: err.code,
//           }))
//         });
//       }
//       throw error;
//     }
//   };
// };

// /**
//  * @title TargetUpdateValidation
//  * @description Validation function for target status updates
//  * @returns {Function} The validation middleware function
//  * @example
//  * sources.patch('/targets/:targetId', TargetUpdateValidation(), (c) => { ... });
//  */
// export const TargetUpdateValidation = () => {
//   return async (c: AppContext, next: Next) => {
//     try {
//       const data = await c.req.json();

//       // Import the schema here to avoid circular dependencies
//       const { TargetUpdateSchema } = await import('../validations/event.validation');

//       const validatedUpdate = TargetUpdateSchema.parse(data);
//       c.set('validatedTargetUpdate', validatedUpdate);

//       await next();
//     } catch (error) {
//       if (error instanceof ZodError) {
//         throw createValidationError('Target update validation failed', {
//           errors: error.issues.map(err => ({
//             field: err.path.join('.'),
//             message: err.message,
//             code: err.code,
//           }))
//         });
//       }
//       throw error;
//     }
//   };
// };
