import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
    DynamoDBDocumentClient,
    QueryCommand,
    ScanCommand
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "us-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);

const MUSIC_TABLE = "music";

/* =========================
   MAIN HANDLER
========================= */
export const handler = async (event) => {

    const params = event.queryStringParameters || {};

    // Clean inputs
    const artist = params.artist?.trim() || null;
    const album  = params.album?.trim() || null;
    const title  = params.title?.trim() || null;
    const year   = params.year?.trim() || null;

    try {

        let items = [];

        /* ==================================================
           1. ARTIST + YEAR + TITLE
        ================================================== */
        if (artist && year && title) {

            const result = await dynamo.send(new QueryCommand({
                TableName: MUSIC_TABLE,
                IndexName: "ArtistYearIndex",
                KeyConditionExpression: "artist = :a AND #y = :y",
                ExpressionAttributeNames: { "#y": "year" },
                ExpressionAttributeValues: {
                    ":a": artist,
                    ":y": year
                }
            }));

            items = (result.Items || []).filter(s =>
                (s.title || "").toLowerCase().includes(title.toLowerCase())
            );
        }

        /* ==================================================
           2. ARTIST + ALBUM + TITLE
        ================================================== */
        else if (artist && album && title) {

            const result = await dynamo.send(new QueryCommand({
                TableName: MUSIC_TABLE,
                KeyConditionExpression: "artist = :a",
                ExpressionAttributeValues: {
                    ":a": artist
                }
            }));

            items = (result.Items || []).filter(s =>
                (s.album || "").toLowerCase() === album.toLowerCase() &&
                (s.title || "").toLowerCase().includes(title.toLowerCase())
            );
        }

        /* ==================================================
           3. ARTIST + YEAR + ALBUM
        ================================================== */
        else if (artist && year && album) {

            const result = await dynamo.send(new QueryCommand({
                TableName: MUSIC_TABLE,
                IndexName: "ArtistYearIndex",
                KeyConditionExpression: "artist = :a AND #y = :y",
                ExpressionAttributeNames: { "#y": "year" },
                ExpressionAttributeValues: {
                    ":a": artist,
                    ":y": year
                }
            }));

            items = (result.Items || []).filter(s =>
                (s.album || "").toLowerCase() === album.toLowerCase()
            );
        }

        /* ==================================================
           4. ARTIST + YEAR
        ================================================== */
        else if (artist && year) {

            const result = await dynamo.send(new QueryCommand({
                TableName: MUSIC_TABLE,
                IndexName: "ArtistYearIndex",
                KeyConditionExpression: "artist = :a AND #y = :y",
                ExpressionAttributeNames: { "#y": "year" },
                ExpressionAttributeValues: {
                    ":a": artist,
                    ":y": year
                }
            }));

            items = result.Items || [];
        }

        /* ==================================================
           5. ARTIST + ALBUM
        ================================================== */
        else if (artist && album) {

            const result = await dynamo.send(new QueryCommand({
                TableName: MUSIC_TABLE,
                KeyConditionExpression: "artist = :a",
                ExpressionAttributeValues: {
                    ":a": artist
                }
            }));

            items = (result.Items || []).filter(s =>
                (s.album || "").toLowerCase() === album.toLowerCase()
            );
        }

        /* ==================================================
           6. ARTIST + TITLE
        ================================================== */
        else if (artist && title) {

            const result = await dynamo.send(new QueryCommand({
                TableName: MUSIC_TABLE,
                KeyConditionExpression: "artist = :a",
                ExpressionAttributeValues: {
                    ":a": artist
                }
            }));

            items = (result.Items || []).filter(s =>
                (s.title || "").toLowerCase().includes(title.toLowerCase())
            );
        }

        /* ==================================================
           7. ALBUM ONLY (GSI)
        ================================================== */
        else if (album) {

            const result = await dynamo.send(new QueryCommand({
                TableName: MUSIC_TABLE,
                IndexName: "AlbumArtistIndex",
                KeyConditionExpression: "album = :al",
                ExpressionAttributeValues: {
                    ":al": album
                }
            }));

            items = result.Items || [];
        }

        /* ==================================================
           8. ARTIST ONLY
        ================================================== */
        else if (artist) {

            const result = await dynamo.send(new QueryCommand({
                TableName: MUSIC_TABLE,
                KeyConditionExpression: "artist = :a",
                ExpressionAttributeValues: {
                    ":a": artist
                }
            }));

            items = result.Items || [];
        }

        /* ==================================================
           9. TITLE ONLY (SCAN)
        ================================================== */
        else if (title) {

            const result = await dynamo.send(new ScanCommand({
                TableName: MUSIC_TABLE,
                FilterExpression: "contains(#t, :t)",
                ExpressionAttributeNames: {
                    "#t": "title"
                },
                ExpressionAttributeValues: {
                    ":t": title
                }
            }));

            items = result.Items || [];
        }

        /* ==================================================
           10. YEAR ONLY (SCAN)
        ================================================== */
        else if (year) {

            const result = await dynamo.send(new ScanCommand({
                TableName: MUSIC_TABLE,
                FilterExpression: "#y = :y",
                ExpressionAttributeNames: {
                    "#y": "year"
                },
                ExpressionAttributeValues: {
                    ":y": year
                }
            }));

            items = result.Items || [];
        }

        /* ==================================================
           NO INPUTS
        ================================================== */
        else {
            items = [];
        }

        return response({
            success: true,
            items
        });

    } catch (err) {
        console.error("SEARCH ERROR:", err);

        return response({
            success: false,
            message: err.message
        }, 500);
    }
};

/* =========================
   RESPONSE WRAPPER
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