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
   REGISTER API
========================= */
app.post("/register", async (req, res) => {

    const { user_name, email, password } = req.body;

    try {

        // Check if email already exists
        const existingUser = await dynamo.get({
            TableName: LOGIN_TABLE,
            Key: { email }
        }).promise();

        if (existingUser.Item) {
            return res.json({
                success: false,
                message: "The email already exists"
            });
        }

        // Insert new user
        await dynamo.put({
            TableName: LOGIN_TABLE,
            Item: {
                email,
                user_name,
                password
            }
        }).promise();

        return res.json({
            success: true
        });

    } catch (err) {
        console.log(err);

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});

/* =========================
   MUSIC SEARCH API
========================= */
app.get("/music/search", async (req, res) => {

    let { title, artist, album, year } = req.query;

    try {

        /* =========================
           NORMALISE INPUT (IMPORTANT)
        ========================= */
        if (artist) artist = artist.toLowerCase();
        if (album) album = album.toLowerCase();
        if (title) title = title.toLowerCase();
        if (year) year = year;

        /* helper: safer title match */
        const titleMatch = (songTitle) => {
            if (!songTitle) return false;

            const t = songTitle.toLowerCase();

            // word-based match (prevents "we" matching inside "were")
            const regex = new RegExp(`\\b${title}\\b`);
            return regex.test(t);
        };

        /* ==================================================
           1. ARTIST + YEAR + TITLE (BEST CASE PATH)
        ================================================== */
        if (artist && year && title) {

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

            const items = result.Items.filter(song =>
                titleMatch(song.title)
            );

            return res.json(items);
        }

        /* ==================================================
           2. ARTIST + ALBUM + TITLE
        ================================================== */
        if (artist && album && title) {

            const result = await dynamo.query({
                TableName: MUSIC_TABLE,
                KeyConditionExpression: "artist = :a",
                ExpressionAttributeValues: {
                    ":a": artist
                }
            }).promise();

            const items = result.Items.filter(song =>
                song.album &&
                song.album.toLowerCase() === album &&
                titleMatch(song.title)
            );

            return res.json(items);
        }

        /* ==================================================
           3. ARTIST + YEAR
        ================================================== */
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

        /* ==================================================
           4. ARTIST + ALBUM
        ================================================== */
        if (artist && album) {

            const result = await dynamo.query({
                TableName: MUSIC_TABLE,
                KeyConditionExpression: "artist = :a",
                ExpressionAttributeValues: {
                    ":a": artist
                }
            }).promise();

            const items = result.Items.filter(song =>
                song.album &&
                song.album.toLowerCase() === album
            );

            return res.json(items);
        }

        /* ==================================================
           5. ARTIST + TITLE
        ================================================== */
        if (artist && title) {

            const result = await dynamo.query({
                TableName: MUSIC_TABLE,
                KeyConditionExpression: "artist = :a",
                ExpressionAttributeValues: {
                    ":a": artist
                }
            }).promise();

            const items = result.Items.filter(song =>
                titleMatch(song.title)
            );

            return res.json(items);
        }

        /* ==================================================
           6. ALBUM ONLY (GSI)
        ================================================== */
        if (album) {

            const result = await dynamo.query({
                TableName: MUSIC_TABLE,
                IndexName: "AlbumArtistIndex",
                KeyConditionExpression: "album = :al",
                ExpressionAttributeValues: {
                    ":al": album
                }
            }).promise();

            return res.json(result.Items);
        }

        /* ==================================================
           7. ARTIST ONLY (PK)
        ================================================== */
        if (artist) {

            const result = await dynamo.query({
                TableName: MUSIC_TABLE,
                KeyConditionExpression: "artist = :a",
                ExpressionAttributeValues: {
                    ":a": artist
                }
            }).promise();

            return res.json(result.Items);
        }

        /* ==================================================
           8. TITLE ONLY (SCAN)
        ================================================== */
        if (title) {

            const result = await dynamo.scan({
                TableName: MUSIC_TABLE,
                FilterExpression: "contains(title, :t)",
                ExpressionAttributeValues: {
                    ":t": title
                }
            }).promise();

            return res.json(result.Items);
        }

        /* ==================================================
           9. YEAR ONLY (SCAN)
        ================================================== */
        if (year) {

            const result = await dynamo.scan({
                TableName: MUSIC_TABLE,
                FilterExpression: "#y = :y",
                ExpressionAttributeNames: {
                    "#y": "year"
                },
                ExpressionAttributeValues: {
                    ":y": year
                }
            }).promise();

            return res.json(result.Items);
        }

        /* ==================================================
           10. EMPTY QUERY
        ================================================== */
        return res.json([]);

    } catch (err) {
        console.log(err);
        return res.status(500).json({
            error: err.message
        });
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
                song_id,   // MUST BE album#title everywhere
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
   REMOVE SUBSCRIPTION (SAFE VERSION)
========================= */
app.post("/subscription/delete", async (req, res) => {

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
// fianlly commit for tn