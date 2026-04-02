import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { Target, unprefixId } from '@kyrazo/shared';

dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log("Connected to Mongo.");

    const doc = await Target.findOne({
        _id: unprefixId("trg_69c83c7091850bd16a76b732"),
        workspaceId: unprefixId("69c83ba291850bd16a76b709"),
        namespaceId: unprefixId("69c83bac4a388744851e2210")
    });

    console.log("Found:", doc);
    
    // Also try without workspaceId/namespaceId
    const doc2 = await Target.findOne({ _id: unprefixId("trg_69c83c7091850bd16a76b732") });
    console.log("Found without contextual filters:", doc2);

    process.exit(0);
}

run().catch(console.error);
