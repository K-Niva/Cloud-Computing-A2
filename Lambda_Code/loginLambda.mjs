import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "us-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);
const LOGIN_TABLE = "login";

/* Lambda handler for user login authentication */
export const handler = async (event) => {

    // log is full with incoming API Gateway event for debugging
    console.log("RAW EVENT:", JSON.stringify(event));

    // =========================
    // Parse request body safely + Handles both stringified JSON and object payloads
    // =========================
    let body = event.body;

    if (typeof body === "string") {
        body = JSON.parse(body);
    }

    // extracts and cleans user input
    const email = body?.email?.trim();
    const password = body?.password?.trim();

    console.log("LOGIN ATTEMPT:", { email, password });

    try {
        // fetches user record from DynamoDB using primary key (email)
        const result = await dynamo.send(
            new GetCommand({
                TableName: LOGIN_TABLE,
                Key: { email }
            })
        );

        console.log("DYNAMO RESULT:", result);

        const item = result.Item;

        // if the user does not exist
        if (!item) {
            return response({ success: false, message: "User not found" }, 401);
        }

        // validates password (plain-text comparison for assignment !!)
        if (item.password !== password) {
            return response({ success: false, message: "Wrong password" }, 401);
        }

        // successful login
        return response({
            success: true,
            user_name: item.user_name,
            email: item.email
        });

    } catch (err) {
        // safety catch (why not lol)
        console.log("LOGIN ERROR:", err);

        return response({
            success: false,
            message: "Server error"
        }, 500);
    }
};

/* Standard API response wrapper with CORS headers */
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