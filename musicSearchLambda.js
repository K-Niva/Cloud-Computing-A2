const AWS = require("aws-sdk");
const dynamo = new AWS.DynamoDB.DocumentClient();


AWS.config.update({ region: "us-east-1" });

const dynamo = new AWS.DynamoDB.DocumentClient();

const MUSIC_TABLE = "music";

exports.handler = async (event) => {

    const params = event.queryStringParameters || {};

    const artist = params.artist?.trim();
    const album = params.album?.trim();
    const title = params.title?.trim();
    const year = params.year;

    try {

        /* ==================================================
           1. ARTIST + YEAR + TITLE
        ================================================== */
        if (artist && year && title) {

            const result = await dynamo.query({
                TableName: MUSIC_TABLE,
                IndexName: "ArtistYearIndex",
                KeyConditionExpression: "artist = :a AND #y = :y",
                ExpressionAttributeNames: { "#y": "year" },
                ExpressionAttributeValues: {
                    ":a": artist,
                    ":y": year
                }
            }).promise();

            const items = result.Items.filter(song =>
                song.title?.toLowerCase().includes(title.toLowerCase())
            );

            return response(items);
        }

        /* ==================================================
           2. ARTIST + ALBUM + TITLE
        ================================================== */
        if (artist && album && title) {

            const result = await dynamo.query({
                TableName: MUSIC_TABLE,
                KeyConditionExpression: "artist = :a",
                ExpressionAttributeValues: { ":a": artist }
            }).promise();

            const items = result.Items.filter(song =>
                song.album?.toLowerCase() === album.toLowerCase() &&
                song.title?.toLowerCase().includes(title.toLowerCase())
            );

            return response(items);
        }

        /* ==================================================
           3. ARTIST + YEAR + ALBUM
        ================================================== */
        if (artist && year && album) {

            const result = await dynamo.query({
                TableName: MUSIC_TABLE,
                IndexName: "ArtistYearIndex",
                KeyConditionExpression: "artist = :a AND #y = :y",
                ExpressionAttributeNames: { "#y": "year" },
                ExpressionAttributeValues: {
                    ":a": artist,
                    ":y": year
                }
            }).promise();

            const items = result.Items.filter(song =>
                song.album?.toLowerCase() === album.toLowerCase()
            );

            return response(items);
        }

        /* ==================================================
           4. ARTIST + YEAR
        ================================================== */
        if (artist && year) {

            const result = await dynamo.query({
                TableName: MUSIC_TABLE,
                IndexName: "ArtistYearIndex",
                KeyConditionExpression: "artist = :a AND #y = :y",
                ExpressionAttributeNames: { "#y": "year" },
                ExpressionAttributeValues: {
                    ":a": artist,
                    ":y": year
                }
            }).promise();

            return response(result.Items);
        }

        /* ==================================================
           5. ARTIST + ALBUM
        ================================================== */
        if (artist && album) {

            const result = await dynamo.query({
                TableName: MUSIC_TABLE,
                KeyConditionExpression: "artist = :a",
                ExpressionAttributeValues: { ":a": artist }
            }).promise();

            const items = result.Items.filter(song =>
                song.album?.toLowerCase() === album.toLowerCase()
            );

            return response(items);
        }

        /* ==================================================
           6. ARTIST + TITLE
        ================================================== */
        if (artist && title) {

            const result = await dynamo.query({
                TableName: MUSIC_TABLE,
                KeyConditionExpression: "artist = :a",
                ExpressionAttributeValues: { ":a": artist }
            }).promise();

            const items = result.Items.filter(song =>
                song.title?.toLowerCase().includes(title.toLowerCase())
            );

            return response(items);
        }

        /* ==================================================
           7. ALBUM ONLY (GSI)
        ================================================== */
        if (album) {

            const result = await dynamo.query({
                TableName: MUSIC_TABLE,
                IndexName: "AlbumArtistIndex",
                KeyConditionExpression: "album = :al",
                ExpressionAttributeValues: { ":al": album }
            }).promise();

            return response(result.Items);
        }

        /* ==================================================
           8. ARTIST ONLY
        ================================================== */
        if (artist) {

            const result = await dynamo.query({
                TableName: MUSIC_TABLE,
                KeyConditionExpression: "artist = :a",
                ExpressionAttributeValues: { ":a": artist }
            }).promise();

            return response(result.Items);
        }

        /* ==================================================
           9. TITLE ONLY (SCAN)
        ================================================== */
        if (title) {

            const result = await dynamo.scan({
                TableName: MUSIC_TABLE,
                FilterExpression: "contains(title, :t)",
                ExpressionAttributeValues: { ":t": title }
            }).promise();

            return response(result.Items);
        }

        /* ==================================================
           10. YEAR ONLY (SCAN)
        ================================================== */
        if (year) {

            const result = await dynamo.scan({
                TableName: MUSIC_TABLE,
                FilterExpression: "#y = :y",
                ExpressionAttributeNames: { "#y": "year" },
                ExpressionAttributeValues: { ":y": year }
            }).promise();

            return response(result.Items);
        }

        return response([]);

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