import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "us-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);

const SUB_TABLE = "subscriptions";

export const handler = async (event) => {

    let body = event.body;

    if (typeof body === "string") {
        body = JSON.parse(body);
    }

    const { email, song_id } = body || {};

    console.log("DELETE REQUEST:", { email, song_id });

    if (!email || !song_id) {
        return response({ error: "email and song_id are required" }, 400);
    }

    try {

        await dynamo.send(new DeleteCommand({
            TableName: SUB_TABLE,
            Key: {
                email,
                song_id
            }
        }));

        return response({ success: true });

    } catch (err) {
        return response({ success: false, error: err.message }, 500);
    }
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