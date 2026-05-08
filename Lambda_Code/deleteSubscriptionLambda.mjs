import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "us-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);
const SUB_TABLE = "subscriptions";

/* AWS Lambda handler function -> runs when a DELETE request is made to remove a subscription */
export const handler = async (event) => {

    // extracts the request body from API Gateway event
    let body = event.body;

    // if the body is a string, parses it into JSON
    if (typeof body === "string") {
        body = JSON.parse(body);
    }

    // extracts the required fields from request body
    const { email, song_id } = body || {};

    // log incoming request for debugging
    console.log("DELETE REQUEST:", { email, song_id });

    // validates the required input fields
    if (!email || !song_id) {
        return response({ error: "email and song_id are required" }, 400);
    }

    try {

        // deletes item from DynamoDB using primary key (email + song_id)
        await dynamo.send(new DeleteCommand({
            TableName: SUB_TABLE,
            Key: {
                email,
                song_id
            }
        }));

        // returns success response
        return response({ success: true });

    } catch (err) {

        // handles the backend or DynamoDB errors
        return response({ success: false, error: err.message }, 500);
    }
};

/* Helper function to format HTTP responses for API Gateway */
function response(data, status = 200) {
    return {
        statusCode: status,

        headers: {
            // allows frontend (S3 hosted site) to access this API
            "Access-Control-Allow-Origin": "http://a2-130-music-frontend-bucket.s3-website-us-east-1.amazonaws.com",

            // allows JSON requests
            "Access-Control-Allow-Headers": "Content-Type",

            // allows HTTP methods used by the frontend
            "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS"
        },

        // converts the response body into a JSON string
        body: JSON.stringify(data)
    };
}