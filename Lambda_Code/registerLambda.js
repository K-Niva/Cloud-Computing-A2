import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "us-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);

const LOGIN_TABLE = "login";

export const handler = async (event) => {

    let body = event.body;

    if (typeof body === "string") {
        body = JSON.parse(body);
    }

    const { user_name, email, password } = body || {};

    console.log("REGISTER ATTEMPT:", { user_name, email });

    const existingUser = await dynamo.send(
        new GetCommand({
            TableName: LOGIN_TABLE,
            Key: { email }
        })
    );

    if (existingUser.Item) {
        return response({
            success: false,
            message: "The email already exists"
        }, 400);
    }

    await dynamo.send(
        new PutCommand({
            TableName: LOGIN_TABLE,
            Item: { email, user_name, password }
        })
    );

    return response({ success: true });
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