import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "us-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);

const SUB_TABLE = "subscriptions";

/* Lambda handler for subscribing a user to a song
 * Stores the full song + user metadata in DynamoDB */
export const handler = async (event) => {

    // parses the request body safely
    const body =
        typeof event.body === "string"
            ? JSON.parse(event.body)
            : event.body || {};

    // extracts subscription details from request
    const {
        email,
        song_id,
        title,
        artist,
        album,
        year,
        img_url
    } = body;

    try {

        // =========================
        // INSERTS SUBSCRIPTION ITEM
        // =========================
        await dynamo.send(new PutCommand({
            TableName: SUB_TABLE,
            Item: {
                email,      // partition key (user)
                song_id,    // sort key (unique song identifier)
                title,
                artist,
                album,
                year,
                img_url
            }
        }));

        // success !!
        return response({ success: true });

    } catch (err) {

        // handles DynamoDB or runtime errors
        return response({ success: false, error: err.message }, 500);
    }
};

/* Standard API response wrapper with CORS support */
function response(data, status = 200) {
    return {
        statusCode: status,
        headers: {
            "Access-Control-Allow-Origin": "http://a2-130-music-frontend-bucket.s3-website-us-east-1.amazonaws.com",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS"
        },
        body: JSON.stringify(data)
    };
}