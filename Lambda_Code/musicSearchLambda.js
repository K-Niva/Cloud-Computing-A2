import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "us-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);

const MUSIC_TABLE = "music";



export const handler = async (event) => {

    const params = event.queryStringParameters || {};

    const artist = params.artist?.trim();
    const album = params.album?.trim();
    const title = params.title?.trim();
    const year = params.year ? Number(params.year) : null;

    try {

        let items = [];

        // 1. BEST CASE: artist + year (uses GSI)
        if (artist && year) {
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

            items = result.Items;
        }

        // 2. artist only
        else if (artist) {
            const result = await dynamo.send(new QueryCommand({
                TableName: MUSIC_TABLE,
                KeyConditionExpression: "artist = :a",
                ExpressionAttributeValues: {
                    ":a": artist
                }
            }));

            items = result.Items;
        }

        // 3. album only (GSI)
        else if (album) {
            const result = await dynamo.send(new QueryCommand({
                TableName: MUSIC_TABLE,
                IndexName: "AlbumArtistIndex",
                KeyConditionExpression: "album = :al",
                ExpressionAttributeValues: {
                    ":al": album
                }
            }));

            items = result.Items;
        }

        // 4. fallback scan (title/year filtering)
        else {
            const result = await dynamo.send(new ScanCommand({
                TableName: MUSIC_TABLE
            }));

            items = result.Items;
        }

        // FINAL FILTER (frontend flexibility)
        if (title) {
            items = items.filter(s =>
                s.title?.toLowerCase().includes(title.toLowerCase())
            );
        }

        if (album && !artist) {
            items = items.filter(s =>
                s.album?.toLowerCase() === album.toLowerCase()
            );
        }

        return response(items);

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