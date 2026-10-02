# Types

`backend/shared/src/types`

This folder holds shared types for the shared backend library.

## Contents

### Files

- `EventPayload.ts` — exports `IEventPayload`
- `WebhookEventSubscription.ts` — exports `ISourceEventSubscription`
- `api.types.ts` — exports `IAPIKey`, `IAPIKeyModel`, `ApiKeyAuthEnv`, `Env`
- `auth.types.ts` — exports `AuthResponse`, `Verify2FAInput`, `Setup2FAResponse`, `OTPActionRequest` and 5 more
- `billing.types.ts` — exports `IPlanLimits`, `IPlanFeatures`, `IPlan`, `IPlanModel` and 10 more
- `delivery.types.ts` — exports `IGetDeliveriesResponse`, `IGetTargetsResponse`, `IGetDeliveryResponse`
- `endpoint.types.ts` — exports `EndpointStatus`, `EndpointMethods`, `IEndpoint`, `IEndpointModel` and 5 more
- `event.types.ts` — exports `EventStatus`, `EventPriority`, `ProcessingStatus`, `IPublishedEvent` and 6 more
- `index.ts` — exports `IPagination`, `IErrorResponse`, `ISuccessResponse`, `BaseDocument` and 2 more
- `ingest.types.ts` — exports `IGetIngestEventsResponse`, `IGetIngestEventResponse`
- `namespace.types.ts` — exports `INamespace`, `INamespaceModel`, `CreateNamespaceResponse`, `GetNamespaceResponse` and 4 more
- `s3.types.ts` — exports `S3Provider`, `IS3Bucket`, `IS3BucketModel`
- `source.types.ts` — exports `ISourceAuthentication`, `ISource`, `ISourceModel`
- `sqs.types.ts` — exports `IASQS`, `IASQSModel`
- `target.types.ts` — exports `TargetMethods`, `TargetStatus`, `ITarget`, `ITargetModel`
- `transform.types.ts` — exports `ITransform`, `ITransformVersion`, `ITransformModel`, `ITransformVersionModel`
- `user.types.ts` — exports `IUser`, `IUserModel`, `IUserWorkspace`, `WorkspaceRole` and 8 more
- `workspace.types.ts` — exports `IWorkspace`, `IWorkspaceModel`, `InvitationStatus`, `IWorkspaceInvitation` and 7 more

## License

Copyright (c) 2026 Kyrazo LLC. All rights reserved. You may not use this folder for a commercial or a non-commercial purpose without written permission from Kyrazo LLC. See the [repository license](../../../../LICENSE).

The rules for changing this folder are in [CONTRIBUTING.md](CONTRIBUTING.md).
