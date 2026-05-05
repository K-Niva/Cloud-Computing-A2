const AWS = require("aws-sdk");

AWS.config.update({ region: "us-east-1" });

const dynamo = new AWS.DynamoDB.DocumentClient();

const LOGIN_TABLE = "login";
const MUSIC_TABLE = "music";
const SUB_TABLE = "subscriptions";

exports.handler = async (event) => {

    const route = event.resource || event.path;
    const method = event.httpMethod;

    const body = event.body ? JSON.parse(event.body) : {};
    const query = event.queryStringParameters || {};

    try {

        /* =========================
           LOGIN
        ========================= */
        if (route === "/login" && method === "POST") {

            const result = await dynamo.get({
                TableName: LOGIN_TABLE,
                Key: { email: body.email }
            }).promise();

            if (!result.Item || result.Item.password !== body.password) {
                return response({ success: false });
            }

            return response({
                success: true,
                user_name: result.Item.user_name,
                email: result.Item.email
            });
        }

        /* =========================
           REGISTER
        ========================= */
        if (route === "/register" && method === "POST") {

            const existingUser = await dynamo.get({
                TableName: LOGIN_TABLE,
                Key: { email: body.email }
            }).promise();

            if (existingUser.Item) {
                return response({ success: false, message: "Email exists" });
            }

            await dynamo.put({
                TableName: LOGIN_TABLE,
                Item: body
            }).promise();

            return response({ success: true });
        }

        /* =========================
           MUSIC SEARCH (KEEP ALL LOGIC)
        ========================= */
        if (route === "/music/search" && method === "GET") {

            const artist = query.artist?.trim();
            const album = query.album?.trim();
            const title = query.title?.trim();
            const year = query.year;

            let result;
            let items = [];

            // 1. ARTIST + YEAR + TITLE
            if (artist && year && title) {
                result = await dynamo.query({
                    TableName: MUSIC_TABLE,
                    IndexName: "ArtistYearIndex",
                    KeyConditionExpression: "artist = :a AND #y = :y",
                    ExpressionAttributeNames: { "#y": "year" },
                    ExpressionAttributeValues: { ":a": artist, ":y": year }
                }).promise();

                items = result.Items.filter(i =>
                    i.title?.toLowerCase().includes(title.toLowerCase())
                );
                return response(items);
            }

            // 2. ARTIST + ALBUM + TITLE
            if (artist && album && title) {
                result = await dynamo.query({
                    TableName: MUSIC_TABLE,
                    KeyConditionExpression: "artist = :a",
                    ExpressionAttributeValues: { ":a": artist }
                }).promise();

                items = result.Items.filter(i =>
                    i.album?.toLowerCase() === album.toLowerCase() &&
                    i.title?.toLowerCase().includes(title.toLowerCase())
                );
                return response(items);
            }

            // 3. ARTIST + YEAR + ALBUM
            if (artist && year && album) {
                result = await dynamo.query({
                    TableName: MUSIC_TABLE,
                    IndexName: "ArtistYearIndex",
                    KeyConditionExpression: "artist = :a AND #y = :y",
                    ExpressionAttributeNames: { "#y": "year" },
                    ExpressionAttributeValues: { ":a": artist, ":y": year }
                }).promise();

                items = result.Items.filter(i =>
                    i.album?.toLowerCase() === album.toLowerCase()
                );
                return response(items);
            }

            // 4. ARTIST + YEAR
            if (artist && year) {
                result = await dynamo.query({
                    TableName: MUSIC_TABLE,
                    IndexName: "ArtistYearIndex",
                    KeyConditionExpression: "artist = :a AND #y = :y",
                    ExpressionAttributeNames: { "#y": "year" },
                    ExpressionAttributeValues: { ":a": artist, ":y": year }
                }).promise();

                return response(result.Items);
            }

            // 5. ARTIST + ALBUM
            if (artist && album) {
                result = await dynamo.query({
                    TableName: MUSIC_TABLE,
                    KeyConditionExpression: "artist = :a",
                    ExpressionAttributeValues: { ":a": artist }
                }).promise();

                items = result.Items.filter(i =>
                    i.album?.toLowerCase() === album.toLowerCase()
                );
                return response(items);
            }

            // 6. ARTIST + TITLE
            if (artist && title) {
                result = await dynamo.query({
                    TableName: MUSIC_TABLE,
                    KeyConditionExpression: "artist = :a",
                    ExpressionAttributeValues: { ":a": artist }
                }).promise();

                items = result.Items.filter(i =>
                    i.title?.toLowerCase().includes(title.toLowerCase())
                );
                return response(items);
            }

            // 7. ALBUM ONLY
            if (album) {
                result = await dynamo.query({
                    TableName: MUSIC_TABLE,
                    IndexName: "AlbumArtistIndex",
                    KeyConditionExpression: "album = :al",
                    ExpressionAttributeValues: { ":al": album }
                }).promise();

                return response(result.Items);
            }

            // 8. ARTIST ONLY
            if (artist) {
                result = await dynamo.query({
                    TableName: MUSIC_TABLE,
                    KeyConditionExpression: "artist = :a",
                    ExpressionAttributeValues: { ":a": artist }
                }).promise();

                return response(result.Items);
            }

            // 9. TITLE ONLY
            if (title) {
                result = await dynamo.scan({
                    TableName: MUSIC_TABLE,
                    FilterExpression: "contains(title, :t)",
                    ExpressionAttributeValues: { ":t": title }
                }).promise();

                return response(result.Items);
            }

            // 10. YEAR ONLY
            if (year) {
                result = await dynamo.scan({
                    TableName: MUSIC_TABLE,
                    FilterExpression: "#y = :y",
                    ExpressionAttributeNames: { "#y": "year" },
                    ExpressionAttributeValues: { ":y": year }
                }).promise();

                return response(result.Items);
            }

            return response([]);
        }

        /* =========================
           SUBSCRIBE
        ========================= */
        if (route === "/subscribe" && method === "POST") {
            await dynamo.put({
                TableName: SUB_TABLE,
                Item: body
            }).promise();

            return response({ success: true });
        }

        /* =========================
           SUBSCRIPTIONS
        ========================= */
        if (route === "/subscriptions" && method === "GET") {

            const email = query.email;

            const result = await dynamo.query({
                TableName: SUB_TABLE,
                KeyConditionExpression: "email = :e",
                ExpressionAttributeValues: { ":e": email }
            }).promise();

            return response(result.Items);
        }

        /* =========================
           DELETE SUBSCRIPTION
        ========================= */
        if (route === "/subscription" && method === "DELETE") {

            await dynamo.delete({
                TableName: SUB_TABLE,
                Key: {
                    email: body.email,
                    song_id: body.song_id
                }
            }).promise();

            return response({ success: true });
        }

        return response({ message: "Not found" }, 404);

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