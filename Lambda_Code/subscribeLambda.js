import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "us-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);

const SUB_TABLE = "subscriptions";

export const handler = async (event) => {

    const body = JSON.parse(event.body || "{}");

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

        await dynamo.send(new PutCommand({
            TableName: SUB_TABLE,
            Item: {
                email,
                song_id,
                title,
                artist,
                album,
                year,
                img_url
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