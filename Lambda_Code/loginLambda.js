import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "us-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);

const LOGIN_TABLE = "login";

export const handler = async (event) => {

    console.log("RAW EVENT:", JSON.stringify(event));

    // ✅ FIX: handle both STRING and OBJECT body
    let body = event.body;

    if (typeof body === "string") {
        body = JSON.parse(body);
    }

    const email = body?.email?.trim();
    const password = body?.password?.trim();

    console.log("LOGIN ATTEMPT:", { email, password });

    const result = await dynamo.send(
        new GetCommand({
            TableName: LOGIN_TABLE,
            Key: { email }
        })
    );

    console.log("DYNAMO RESULT:", result);

    const item = result.Item;

    if (!item) {
        return response({ success: false, message: "User not found" }, 401);
    }

    if (item.password !== password) {
        return response({ success: false, message: "Wrong password" }, 401);
    }

    return response({
        success: true,
        user_name: item.user_name,
        email: item.email
    });
};

function response(data, status = 200) {
    return {
        statusCode: status,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS"
        },
        body: JSON.stringify(data)
    };
}