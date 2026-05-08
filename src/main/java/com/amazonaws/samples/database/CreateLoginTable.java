package com.amazonaws.samples.database;
import com.amazonaws.auth.profile.ProfileCredentialsProvider;

import com.amazonaws.regions.Regions;
import com.amazonaws.services.dynamodbv2.AmazonDynamoDB;

import com.amazonaws.services.dynamodbv2.AmazonDynamoDBClientBuilder;
import com.amazonaws.services.dynamodbv2.document.DynamoDB;
import com.amazonaws.services.dynamodbv2.document.Table;

import com.amazonaws.services.dynamodbv2.model.*;

public class CreateLoginTable {

    public static void main(String[] args) {

        // creates DynamoDB client connection
        AmazonDynamoDB client = AmazonDynamoDBClientBuilder.standard()

                // sets AWS region
                .withRegion(Regions.US_EAST_1)

                // uses AWS credentials profile
                .withCredentials(new ProfileCredentialsProvider("default"))

                // builds DynamoDB client
                .build();

        // creates DynamoDB document interface
        DynamoDB dynamoDB = new DynamoDB(client);

        // Table Name
        String tableName = "login";

        try {

            System.out.println("Attempting to create table...");

            // defines the table structure
            CreateTableRequest request = new CreateTableRequest()

                    // Table Name
                    .withTableName(tableName)

                    // defines the primary key schema
                    .withKeySchema(

                            // Email = Partition key
                            new KeySchemaElement("email", KeyType.HASH)
                    )

                    // defines attribute type
                    .withAttributeDefinitions(

                            // Email is as stored as a String
                            new AttributeDefinition("email", ScalarAttributeType.S)
                    )

                    // use on-demand billing mode
                    .withBillingMode(BillingMode.PAY_PER_REQUEST);

            // creates the table
            Table table = dynamoDB.createTable(request);

            table.waitForActive();

            // success !!
            System.out.println("Table created successfully!");
            System.out.println("Status: " + table.getDescription().getTableStatus());

        } catch (Exception e) {

            // error message
            System.err.println("Error creating table:");
            System.err.println(e.getMessage());
        }
    }
}