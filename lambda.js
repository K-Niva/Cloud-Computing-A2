const AWS = require("aws-sdk");

AWS.config.update({ region: "us-east-1" });

const dynamo = new AWS.DynamoDB.DocumentClient();

const LOGIN_TABLE = "login";
const MUSIC_TABLE = "music";
const SUB_TABLE = "subscriptions";

exports.handler = async (event) => {

    const method = event.httpMethod;
    const path = event.resource || event.path;

    if (method === "OPTIONS") {
        return response({});
    }

    try {

        /* =========================
           LOGIN
        ========================= */
        if (method === "POST" && path === "/login") {

            const body = JSON.parse(event.body || "{}");
            const { email, password } = body;

            const result = await dynamo.get({
                TableName: LOGIN_TABLE,
                Key: { email }
            }).promise();

            if (!result.Item || result.Item.password !== password) {
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
        if (method === "POST" && path === "/register") {

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
                });
            }

            await dynamo.put({
                TableName: LOGIN_TABLE,
                Item: { email, user_name, password }
            }).promise();

            return response({ success: true });
        }

        /* =========================
           MUSIC SEARCH
        ========================= */
        if (method === "GET" && path === "/music/search") {

            const params = event.queryStringParameters || {};

            const artist = params.artist?.trim();
            const album = params.album?.trim();
            const title = params.title?.trim();
            const year = params.year;

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
        }

        /* =========================
           SUBSCRIBE
        ========================= */
        if (method === "POST" && path === "/subscribe") {

            const body = JSON.parse(event.body || "{}");

            await dynamo.put({
                TableName: SUB_TABLE,
                Item: body
            }).promise();

            return response({ success: true });
        }

        /* =========================
           GET SUBSCRIPTIONS
        ========================= */
        if (method === "GET" && path === "/subscriptions") {

            const params = event.queryStringParameters || {};

            if (!params.email) {
                return response({ error: "Email is required" }, 400);
            }

            const user = await dynamo.get({
                TableName: LOGIN_TABLE,
                Key: { email: params.email }
            }).promise();

            if (!user.Item) {
                return response({ error: "Invalid user" }, 401);
            }

            const result = await dynamo.query({
                TableName: SUB_TABLE,
                KeyConditionExpression: "email = :e",
                ExpressionAttributeValues: {
                    ":e": params.email
                }
            }).promise();

            return response(result.Items);
        }

        /* =========================
           DELETE SUBSCRIPTION
        ========================= */
        if (method === "DELETE" && path === "/subscription") {

            const body = JSON.parse(event.body || "{}");

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
        console.log(err);
        return response({ error: err.message }, 500);
    }
};


/* =========================
   HELPER RESPONSE (CORS FIX)
========================= */
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