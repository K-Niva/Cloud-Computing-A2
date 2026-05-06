import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "us-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);

const SUB_TABLE = "subscriptions";

export const handler = async (event) => {

    console.log("EVENT RECEIVED:", JSON.stringify(event));

    let email = event?.queryStringParameters?.email;

    if (!email && event.body) {
        try {
            const body = typeof event.body === "string"
                ? JSON.parse(event.body)
                : event.body;

            email = body.email;
        } catch (e) {
            console.log("BODY PARSE ERROR:", e);
        }
    }

    console.log("EMAIL EXTRACTED:", email);

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

        console.log("DYNAMO RESULT:", JSON.stringify(result));


        return response({
            success: true,
            items: result.Items || []
        });

    } catch (err) {
        console.log("ERROR:", err);

        return response({
            error: err.message
        }, 500);
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