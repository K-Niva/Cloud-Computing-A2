const AWS = require("aws-sdk");
const dynamo = new AWS.DynamoDB.DocumentClient();

const LOGIN_TABLE = "login";

exports.handler = async (event) => {

    const body = JSON.parse(event.body || "{}");
    const { user_name, email, password } = body;

    const existingUser = await dynamo.get({
        TableName: LOGIN_TABLE,
        Key: { email }
    }).promise();

    if (existingUser.Item) {
        return response({
            success: false,
            message: "The email already exists"
        }, 400);
    }

    await dynamo.put({
        TableName: LOGIN_TABLE,
        Item: { email, user_name, password }
    }).promise();

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