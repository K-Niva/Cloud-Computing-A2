const AWS = require("aws-sdk");
const dynamo = new AWS.DynamoDB.DocumentClient();


AWS.config.update({ region: "us-east-1" });

const dynamo = new AWS.DynamoDB.DocumentClient();

const LOGIN_TABLE = "login";
const MUSIC_TABLE = "music";
const SUB_TABLE = "subscriptions";

exports.handler = async (event) => {

    const params = event.queryStringParameters || {};

    const email = params.email;

    if (!email) {
        return response({ error: "Email is required" }, 400);
    }

    const result = await dynamo.query({
        TableName: SUB_TABLE,
        KeyConditionExpression: "email = :e",
        ExpressionAttributeValues: {
            ":e": email
        }
    }).promise();

    return response(result.Items);
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