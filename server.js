const express = require("express");
const AWS = require("aws-sdk");
const cors = require("cors");
const path = require("path");

const app = express();

/* SESSION SETUP */

const session = require("express-session");

app.use(session({
    secret: "music-app-secret",
    resave: false,
    saveUninitialized: false
}));

/* MIDDLEWARE */
app.use(cors());              // frontend-backend communication
app.use(express.json());      // JSON request bodies

/* AWS CONFIGURATION */
AWS.config.update({ region: "us-east-1" });

const dynamo = new AWS.DynamoDB.DocumentClient();

/* DynamoDB TABLE NAMES */
const LOGIN_TABLE = "login";
const MUSIC_TABLE = "music";
const SUB_TABLE = "subscriptions";


/* STATIC FRONTEND FILES */

/* frontend assets */
app.use("/public", express.static(path.join(__dirname, "frontend")));

/* Default route -> login page */
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "frontend", "login.html"));
});

/* Register page route */
app.get("/register.html", (req, res) => {
    res.sendFile(path.join(__dirname, "frontend", "register.html"));
});


/* AUTHENTICATION MIDDLEWARE */
function auth(req, res, next) {

    /* If user is not logged in */
    if (!req.session.user) {
        return res.redirect("/");
    }

    next();
}


/* LOGOUT ROUTE */
app.post("/logout", (req, res) => {

    /* destroys current session */
    req.session.destroy(() => {
        res.json({ success: true });
    });
});


/* PROTECTED MAIN PAGE */
app.get("/main.html", auth, (req, res) => {
    res.sendFile(path.join(__dirname, "frontend", "main.html"));
});


/* LOGIN + REGISTER PAGE ROUTES */
app.get("/register.html", (req, res) => {
    res.sendFile(path.join(__dirname, "frontend", "register.html"));
});

app.get("/login.html", (req, res) => {
    res.sendFile(path.join(__dirname, "frontend", "login.html"));
});


/* LOGIN API*/
app.post("/login", async (req, res) => {

    /* retrieves login details */
    const { email, password } = req.body;

    try {

        /* GET user from DynamoDB */
        const result = await dynamo.get({
            TableName: LOGIN_TABLE,
            Key: { email }
        }).promise();

        /* user doesn't exist */
        if (!result.Item) {
            return res.json({ success: false });
        }

        /* validates password */
        if (result.Item.password === password) {

            /* stores user session */
            req.session.user = {
                email: result.Item.email,
                user_name: result.Item.user_name
            };

            return res.json({
                success: true,
                user_name: result.Item.user_name
            });
        }

        /* incorrect password */
        return res.json({ success: false });

    } catch (err) {

        console.log(err);

        res.status(500).json({ success: false });
    }
});


/* REGISTER API */
app.post("/register", async (req, res) => {

    /* retrieves register details */
    const { user_name, email, password } = req.body;

    try {

        /* checks if email already exists */
        const existingUser = await dynamo.get({
            TableName: LOGIN_TABLE,
            Key: { email }
        }).promise();

        /* prevents duplicate accounts */
        if (existingUser.Item) {

            return res.json({
                success: false,
                message: "The email already exists"
            });
        }

        /* adds new user into DynamoDB */
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


/* MUSIC SEARCH API */
app.get("/music/search", async (req, res) => {

    /* retrieve search filters */
    const artist = req.query.artist?.trim();
    const album = req.query.album?.trim();
    const title = req.query.title?.trim();
    const year = req.query.year;

    try {

        /* ==================================================
           1. ARTIST + YEAR + TITLE
           LSI then filter Title
        ================================================== */
        if (artist && year && title) {

            const result = await dynamo.query({
                TableName: MUSIC_TABLE,
                IndexName: "ArtistYearIndex",

                KeyConditionExpression:
                    "artist = :a AND #y = :y",

                ExpressionAttributeNames: {
                    "#y": "year"
                },

                ExpressionAttributeValues: {
                    ":a": artist,
                    ":y": year
                }

            }).promise();

            /* filter title manually */
            const items = result.Items.filter(song =>
                song.title &&
                song.title.toLowerCase().includes(title.toLowerCase())
            );

            return res.json(items);
        }


        /* ==================================================
           2. ARTIST + ALBUM + TITLE
           using Primary key (Artist), the filter
        ================================================== */
        if (artist && album && title) {

            const result = await dynamo.query({
                TableName: MUSIC_TABLE,

                KeyConditionExpression:
                    "artist = :a",

                ExpressionAttributeValues: {
                    ":a": artist
                }

            }).promise();

            const items = result.Items.filter(song =>
                song.album &&
                song.album.toLowerCase() === album.toLowerCase() &&
                song.title &&
                song.title.toLowerCase().includes(title.toLowerCase())
            );

            return res.json(items);
        }


        /* ==================================================
           3. ARTIST + YEAR + ALBUM
           LSI (ArtistYearIndex), then filter Album
        ================================================== */
        if (artist && year && album) {

            const result = await dynamo.query({
                TableName: MUSIC_TABLE,
                IndexName: "ArtistYearIndex",

                KeyConditionExpression:
                    "artist = :a AND #y = :y",

                ExpressionAttributeNames: {
                    "#y": "year"
                },

                ExpressionAttributeValues: {
                    ":a": artist,
                    ":y": year
                }

            }).promise();

            const items = result.Items.filter(song =>
                song.album &&
                song.album.toLowerCase() === album.toLowerCase()
            );

            return res.json(items);
        }


        /* ==================================================
           4. ARTIST + YEAR
           LSI (ArtistYearIndex) with NO extra filter
        ================================================== */
        if (artist && year) {

            const result = await dynamo.query({
                TableName: MUSIC_TABLE,
                IndexName: "ArtistYearIndex",

                KeyConditionExpression:
                    "artist = :a AND #y = :y",

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
           5. ARTIST + ALBUM
           using Primary key (Artist) then filter Album
        ================================================== */
        if (artist && album) {

            const result = await dynamo.query({
                TableName: MUSIC_TABLE,

                KeyConditionExpression:
                    "artist = :a",

                ExpressionAttributeValues: {
                    ":a": artist
                }

            }).promise();

            const items = result.Items.filter(song =>
                song.album &&
                song.album.toLowerCase() === album.toLowerCase()
            );

            return res.json(items);
        }


        /* ==================================================
           6. ARTIST + TITLE
           using Primary key (Artist), then filter Title
        ================================================== */
        if (artist && title) {

            const result = await dynamo.query({
                TableName: MUSIC_TABLE,

                KeyConditionExpression:
                    "artist = :a",

                ExpressionAttributeValues: {
                    ":a": artist
                }

            }).promise();

            const items = result.Items.filter(song =>
                song.title &&
                song.title.toLowerCase().includes(title.toLowerCase())
            );

            return res.json(items);
        }


        /* ==================================================
           7. ALBUM ONLY
           GSI (AlbumArtistIndex) only
        ================================================== */
        if (album) {

            const result = await dynamo.query({
                TableName: MUSIC_TABLE,
                IndexName: "AlbumArtistIndex",

                KeyConditionExpression:
                    "album = :al",

                ExpressionAttributeValues: {
                    ":al": album
                }

            }).promise();

            return res.json(result.Items);
        }


        /* ==================================================
           8. ARTIST ONLY
           using Primary partition key
        ================================================== */
        if (artist) {

            const result = await dynamo.query({
                TableName: MUSIC_TABLE,

                KeyConditionExpression:
                    "artist = :a",

                ExpressionAttributeValues: {
                    ":a": artist
                }

            }).promise();

            return res.json(result.Items);
        }


        /* ==================================================
           9. TITLE ONLY
           Full table scan (fallback)
        ================================================== */
        if (title) {

            const result = await dynamo.scan({
                TableName: MUSIC_TABLE,

                FilterExpression:
                    "contains(title, :t)",

                ExpressionAttributeValues: {
                    ":t": title
                }

            }).promise();

            return res.json(result.Items);
        }


        /* ==================================================
           10. YEAR ONLY
           Full table scan (fallback)
        ================================================== */
        if (year) {

            const result = await dynamo.scan({
                TableName: MUSIC_TABLE,

                FilterExpression:
                    "#y = :y",

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
           11. No filtering search
        ================================================== */
        return res.json([]);

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            error: err.message
        });
    }
});


/* SUBSCRIBE TO SONG */
app.post("/subscribe", auth, async (req, res) => {

    /* retrieves song details */
    const {
        email,
        song_id,
        title,
        artist,
        album,
        year,
        img_url

    } = req.body;

    try {

        /* inserts subscription record */
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

        res.status(500).json({
            error: err.message
        });
    }
});


/* USER SUBSCRIPTIONS */
app.get("/subscriptions", auth, async (req, res) => {

    const { email } = req.query;

    try {

        /* subscriptions table */
        const result = await dynamo.query({
            TableName: SUB_TABLE,

            KeyConditionExpression:
                "email = :e",

            ExpressionAttributeValues: {
                ":e": email
            }

        }).promise();

        res.json(result.Items);

    } catch (err) {

        console.log(err);

        res.status(500).json({
            error: err.message
        });
    }
});


/* REMOVE SUBSCRIPTION */
app.delete("/subscription", auth, async (req, res) => {

    const { email, song_id } = req.body;

    /* validating */
    if (!email || !song_id) {

        return res.status(400).json({
            error: "Missing fields"
        });
    }

    try {

        /* deletes subscription record */
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

        res.status(500).json({
            error: err.message
        });
    }
});


/* START EXPRESS SERVER */
app.listen(80, "0.0.0.0", () => {

    console.log("Server running on port 80");

});

/* END OF SERVER */