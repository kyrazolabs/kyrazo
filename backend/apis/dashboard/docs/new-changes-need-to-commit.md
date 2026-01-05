make a huge fucking commit 
what i have done 

make and fix and customize and test workspace layer 
make mailq service to build top of resend and bullmq 

make and fix the auth and login middleware to stop choosing the first workspace instead of that make it selectable 

make endpoint to invite a member and another to accept invitation or reject it with a special workspaceInvitation model 

make changes on (delivery, endpoint, webhooks, events ) validations to accept workspaceId as a require input  backend/api/src/models/Workspace.ts 

make changes and improvements on auth controllers and validation and also types for safe-type and better responses and requests and defragmentation of auth.controller.ts functions to auth.service.ts file

make changes on utils and change the file structure to a new structure for better scalable and developments, separated all crypto function to libs/crypto directory and separated key, secrets, signature function to key.crypto.ts, secrets.crypto.ts, signature.crypto.ts files

make also changes jwt functions and move it to utils/libs/jwt directory to have all functions that about tokens inside tokens/auth.jwt.ts files instead of using jwt.service.ts


improve logger.ts file couple of level up to gain more efficient and make it better to log better tracking error, activities etc add also morgan for better development 

add requestId in error responses


make changes on producer folder architecture to make it more scalable and Achieving more efficiency in development

make a BatchQ services to manage batch insert to clickhouse for tracking deliveries and receives and forward events to reduce the latency and delay on Workers and APIs

separated producers/v2/publishers/nats.publisher.ts to producers/jobs/v1/publishers/nats/events/forward.nats.ts and producers/jobs/v1/publishers/nats/events/publish.nats.ts and producers/jobs/v1/publishers/nats/events/receive.nats.ts for better structure and scalable  with more efficiency in development 

deleted producers/v2 because nothing in there needed

make some change on key models to contain on workspace as owner and createBy to see who do some things 

make a project layer on top of the workspace and make webhooks, endpoint, deliveries and event depend on it with a permission middlewares for more safety and role base access

add rate limiters for all endpoints 


and testing all endpoint and every thing works will 

and i make APIs has three APIs Dashboard API, Ingest API, Integration API 

and i change folder name from worker to Worker with first cap

an others things