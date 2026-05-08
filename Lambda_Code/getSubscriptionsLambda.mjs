import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "us-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);
const SUB_TABLE = "subscriptions";

/* AWS Lambda handler for retrieving a user's subscriptions -> runs through API Gateway (GET or POST !!) */
export const handler = async (event) => {

    // log is full with incoming events for debugging
    console.log("EVENT RECEIVED:", JSON.stringify(event));

    // trying to extract the email from query string parameters (GET request)
    let email = event?.queryStringParameters?.email;

    // if not found, tries to extract from request body (POST fallback)
    if (!email && event.body) {
        try {

            // parsing body safely
            const body = typeof event.body === "string"
                ? JSON.parse(event.body)
                : event.body;

            email = body.email;

        } catch (e) {

            // log parsing error if JSON is invalid
            console.log("BODY PARSE ERROR:", e);
        }
    }

    // log extracts email for debugging
    console.log("EMAIL EXTRACTED:", email);

    // validating input
    if (!email) {
        return response({ error: "Email is required" }, 400);
    }

    try {

        // all DynamoDB queries for all subscriptions belonging to this email
        const result = await dynamo.send(new QueryCommand({
            TableName: SUB_TABLE,

            // query using partition key (email)
            KeyConditionExpression: "email = :e",

            // bind value for query
            ExpressionAttributeValues: {
                ":e": email
            }
        }));

        // logs raw DynamoDB response
        console.log("DYNAMO RESULT:", JSON.stringify(result));

        // returns retrieved items to frontend
        return response({
            success: true,
            items: result.Items || []
        });

    } catch (err) {

        // logs error for debugging
        console.log("ERROR:", err);

        // returns failure response
        return response({
            error: err.message
        }, 500);
    }
};

/* Helper function to format API Gateway responses */
function response(data, status = 200) {
    return {
        statusCode: status,

        headers: {
            // allows frontend hosted on S3 bucket to access API
            "Access-Control-Allow-Origin": "http://a2-130-music-frontend-bucket.s3-website-us-east-1.amazonaws.com",

            // allows JSON requests
            "Access-Control-Allow-Headers": "Content-Type",

            // allows HTTP methods used by frontend
            "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS"
        },

        // converts response body into JSON string
        body: JSON.stringify(data)
    };
}