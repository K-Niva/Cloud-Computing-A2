// MIGHT NEED TO CHANGE TO FIT IN LIKE LAB

const AWS = require('aws-sdk');

// Configure region
AWS.config.update({ region: 'us-east-1' });

// Create DynamoDB service object
const dynamodb = new AWS.DynamoDB();

// define table structure
const params = {
    TableName: "login",

    // define primary key
    KeySchema: [
        { AttributeName: "email", KeyType: "HASH" } // Partition key
    ],

    // define attribute types
    AttributeDefinitions: [
        { AttributeName: "email", AttributeType: "S" }
    ],

    // simple pricing model
    BillingMode: "PAY_PER_REQUEST"
};

// creating table
dynamodb.createTable(params, (err, data) => {
    if (err) {
        console.error("Error creating table:", err);
    } else {
        console.log("Table created successfully:", data);
    }
});