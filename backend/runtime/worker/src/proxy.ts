import SmeeClient from "smee-client";

const smee = new SmeeClient({
    source: "https://smee.io/vyzuForulkRVxHRH",
    target: "http://localhost:3003/api/ingest/github/gBhWzCsdl",
    logger: console,
});

const events = smee.start();
