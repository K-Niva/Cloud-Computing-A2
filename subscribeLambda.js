const AWS = require("aws-sdk");
const dynamo = new AWS.DynamoDB.DocumentClient();

AWS.config.update({ region: "us-east-1" });

const dynamo = new AWS.DynamoDB.DocumentClient();

const LOGIN_TABLE = "login";
const MUSIC_TABLE = "music";
const SUB_TABLE = "subscriptions";


exports.handler = async (event) => {

    const body = JSON.parse(event.body || "{}");

    const { email, song_id, title, artist, album, year, img_url } = body;

    await dynamo.put({
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