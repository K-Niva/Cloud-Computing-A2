import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "us-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);

const LOGIN_TABLE = "login";

/* Lambda handler for user registration:
 * - checks if user already exists
 * - if not, inserts the new user into DynamoDB */
export const handler = async (event) => {

    // parses request body
    let body = event.body;

    if (typeof body === "string") {
        body = JSON.parse(body);
    }

    // extracts register fields from request body
    const { user_name, email, password } = body || {};

    console.log("REGISTER ATTEMPT:", { user_name, email });

    // CHECK IF USER EXISTS
    const existingUser = await dynamo.send(
        new GetCommand({
            TableName: LOGIN_TABLE,
            Key: { email }
        })
    );

    // If email already exists, reject registration
    if (existingUser.Item) {
        return response({
            success: false,
            message: "The email already exists"
        }, 400);
    }

    // CREATE NEW USER
    await dynamo.send(
        new PutCommand({
            TableName: LOGIN_TABLE,
            Item: { email, user_name, password }
        })
    );

    // success !!
    return response({ success: true });
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