import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);

const LOGIN_TABLE = "login";

export const handler = async (event) => {

    const body = JSON.parse(event.body || "{}");
    const { email, password } = body;

    const result = await dynamo.send(
        new GetCommand({
            TableName: LOGIN_TABLE,
            Key: { email }
        })
    );

    const item = result.Item;

    if (!item || item.password !== password) {
        return response({ success: false, message: "email or password is invalid" }, 401);
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