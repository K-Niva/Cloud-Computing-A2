import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "us-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);

const SUB_TABLE = "subscriptions";

export const handler = async (event) => {

    const params = event.queryStringParameters || {};
    const email = params.email;

    if (!email) {
        return response({ error: "Email is required" }, 400);
    }

    try {

        const result = await dynamo.send(new QueryCommand({
            TableName: SUB_TABLE,
            KeyConditionExpression: "email = :e",
            ExpressionAttributeValues: {
                ":e": email
            }
        }));

        return response(result.Items || []);

    } catch (err) {
        return response({ error: err.message }, 500);
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