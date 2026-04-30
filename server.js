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

// Serve frontend files
app.use(express.static(path.join(__dirname, "frontend")));

// First page = login page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "frontend", "login.html"));
});

// LOGIN API
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    const params = {
        TableName: LOGIN_TABLE,
        Key: { email }
    };

    try {
        const result = await dynamo.get(params).promise();

        if (!result.Item) {
            return res.json({ success: false });
        }

        if (result.Item.password === password) {
            return res.json({
                success: true,
                user_name: result.Item.user_name
            });
        } else {
            return res.json({ success: false });
        }

    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false });
    }
});

// Port 80
app.listen(80, "0.0.0.0", () => {
    console.log("Server running on port 80");
});

//push