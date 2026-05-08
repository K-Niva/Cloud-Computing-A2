package com.amazonaws.samples.database;

import com.amazonaws.auth.profile.ProfileCredentialsProvider;

import com.amazonaws.regions.Regions;

import com.amazonaws.services.dynamodbv2.AmazonDynamoDB;
import com.amazonaws.services.dynamodbv2.AmazonDynamoDBClientBuilder;

import com.amazonaws.services.dynamodbv2.document.DynamoDB;
import com.amazonaws.services.dynamodbv2.document.Table;

import com.amazonaws.services.dynamodbv2.model.*;

public class CreateSubscriptionsTable {

    public static void main(String[] args) {

        // creates DynamoDB client using AWS credentials profile
        AmazonDynamoDB client = AmazonDynamoDBClientBuilder.standard()

                // Set AWS region
                .withRegion(Regions.US_EAST_1)

                // Load credentials from local AWS profile ("default")
                .withCredentials(new ProfileCredentialsProvider("default"))

                // Build client instance
                .build();

        // creates DynamoDB document API wrapper
        DynamoDB dynamoDB = new DynamoDB(client);

        // Table Name for storing the user's song subscriptions
        String tableName = "subscriptions";

        try {

            System.out.println("Creating subscriptions table...");

            // Define table creation request
            CreateTableRequest request = new CreateTableRequest()

                    // sets Table Name
                    .withTableName(tableName)

                    // defines Primary key structure
                    .withKeySchema(

                            // Partition key: email (groups subscriptions by user)
                            new KeySchemaElement("email", KeyType.HASH),

                            // Sort key: song_id (unique song per user)
                            new KeySchemaElement("song_id", KeyType.RANGE)
                    )

                    // defines attribute data types used in table
                    .withAttributeDefinitions(
                            new AttributeDefinition("email", ScalarAttributeType.S),
                            new AttributeDefinition("song_id", ScalarAttributeType.S)
                    )

                    // uses on-demand billing
                    .withBillingMode(BillingMode.PAY_PER_REQUEST);

            // creates table in DynamoDB
            Table table = dynamoDB.createTable(request);

            table.waitForActive();

            // success !!
            System.out.println("Subscriptions table created successfully!");
            System.out.println("Status: " + table.getDescription().getTableStatus());

        } catch (Exception e) {

            // error message
            System.err.println("Error creating subscriptions table:");
            System.err.println(e.getMessage());
        }
    }
}