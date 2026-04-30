const express = require("express");
const AWS = require("aws-sdk");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

AWS.config.update({ region: "us-east-1" });

const dynamo = new AWS.DynamoDB.DocumentClient();

const LOGIN_TABLE = "login";
const MUSIC_TABLE = "music";
const SUB_TABLE = "subscriptions";

/* =========================
   STATIC FRONTEND
========================= */
app.use(express.static(path.join(__dirname, "frontend")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "frontend", "login.html"));
});

/* =========================
   LOGIN API
========================= */
app.post("/login", async (req, res) => {

    const { email, password } = req.body;

    try {
        const result = await dynamo.get({
            TableName: LOGIN_TABLE,
            Key: { email }
        }).promise();

        if (!result.Item) {
            return res.json({ success: false });
        }

        if (result.Item.password === password) {
            return res.json({
                success: true,
                user_name: result.Item.user_name
            });
        }

        return res.json({ success: false });

    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false });
    }
});

/* =========================
   MUSIC SEARCH API
========================= */
app.get("/music/search", async (req, res) => {

    const { title, artist, album, year } = req.query;

    try {

        // ARTIST QUERY (PK)
        if (artist && !year) {

            const result = await dynamo.query({
                TableName: MUSIC_TABLE,
                KeyConditionExpression: "artist = :a",
                ExpressionAttributeValues: {
                    ":a": artist
                }
            }).promise();

            return res.json(result.Items);
        }

        // ARTIST + YEAR (LSI)
        if (artist && year) {

            const result = await dynamo.query({
                TableName: MUSIC_TABLE,
                IndexName: "ArtistYearIndex",
                KeyConditionExpression: "artist = :a AND #y = :y",
                ExpressionAttributeNames: {
                    "#y": "year"
                },
                ExpressionAttributeValues: {
                    ":a": artist,
                    ":y": year
                }
            }).promise();

            return res.json(result.Items);
        }

        // ALBUM SEARCH (GSI)
        if (album) {

            const result = await dynamo.query({
                TableName: MUSIC_TABLE,
                IndexName: "AlbumTitleIndex",
                KeyConditionExpression: "album = :al",
                ExpressionAttributeValues: {
                    ":al": album
                }
            }).promise();

            return res.json(result.Items);
        }

        // MULTI-FILTER SEARCH (SCAN)
        let filters = [];
        let values = {};
        let names = {};

        if (title) {
            filters.push("contains(title, :t)");
            values[":t"] = title;
        }

        if (artist) {
            filters.push("artist = :a");
            values[":a"] = artist;
        }

        if (album) {
            filters.push("album = :al");
            values[":al"] = album;
        }

        if (year) {
            filters.push("#y = :y");
            values[":y"] = year;
            names["#y"] = "year";
        }

        // SAFETY CHECK (IMPORTANT FIX)
        if (filters.length === 0) {
            return res.json([]);
        }

        const result = await dynamo.scan({
            TableName: MUSIC_TABLE,
            FilterExpression: filters.join(" AND "),
            ExpressionAttributeValues: values,
            ExpressionAttributeNames: names
        }).promise();

        res.json(result.Items);

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.message });
    }
});

/* =========================
   SUBSCRIBE SONG
========================= */
app.post("/subscribe", async (req, res) => {

    const { email, song_id, title, artist, album, year, img_url } = req.body;

    try {
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

        res.json({ success: true });

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.message });
    }
});

/* =========================
   GET SUBSCRIPTIONS
========================= */
app.get("/subscriptions", async (req, res) => {

    const { email } = req.query;

    try {
        const result = await dynamo.query({
            TableName: SUB_TABLE,
            KeyConditionExpression: "email = :e",
            ExpressionAttributeValues: {
                ":e": email
            }
        }).promise();

        res.json(result.Items);

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.message });
    }
});

/* =========================
   REMOVE SUBSCRIPTION
========================= */
app.delete("/subscription", async (req, res) => {

    const { email, song_id } = req.body;

    if (!email || !song_id) {
        return res.status(400).json({ error: "Missing fields" });
    }

    try {
        await dynamo.delete({
            TableName: SUB_TABLE,
            Key: {
                email,
                song_id
            }
        }).promise();

        res.json({ success: true });

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.message });
    }
});

/* =========================
   START SERVER
========================= */
app.listen(80, "0.0.0.0", () => {
    console.log("Server running on port 80");
});

//push