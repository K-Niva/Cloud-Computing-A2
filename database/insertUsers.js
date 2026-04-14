const AWS = require('aws-sdk');

// Configure region
AWS.config.update({ region: 'us-east-1' });

const docClient = new AWS.DynamoDB.DocumentClient();