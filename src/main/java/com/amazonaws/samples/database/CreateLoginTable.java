package com.amazonaws.samples.database;

// might need to remove this; import java.util.Arrays;

import com.amazonaws.auth.profile.ProfileCredentialsProvider;
import com.amazonaws.regions.Regions;
import com.amazonaws.services.dynamodbv2.AmazonDynamoDB;
import com.amazonaws.services.dynamodbv2.AmazonDynamoDBClientBuilder;
import com.amazonaws.services.dynamodbv2.document.DynamoDB;
import com.amazonaws.services.dynamodbv2.document.Table;
import com.amazonaws.services.dynamodbv2.model.*;

public class CreateLoginTable {

    public static void main(String[] args) {

        AmazonDynamoDB client = AmazonDynamoDBClientBuilder.standard()
                .withRegion(Regions.US_EAST_1)
                .withCredentials(new ProfileCredentialsProvider("default"))
                .build();

        DynamoDB dynamoDB = new DynamoDB(client);

        String tableName = "login";

        try {
            System.out.println("Attempting to create table...");

            CreateTableRequest request = new CreateTableRequest()
                    .withTableName(tableName)
                    .withKeySchema(
                            new KeySchemaElement("email", KeyType.HASH) // Partition key only
                    )
                    .withAttributeDefinitions(
                            new AttributeDefinition("email", ScalarAttributeType.S)
                    )
                    .withBillingMode(BillingMode.PAY_PER_REQUEST); // matches your JS version

            Table table = dynamoDB.createTable(request);
            table.waitForActive();

            System.out.println("Table created successfully!");
            System.out.println("Status: " + table.getDescription().getTableStatus());

        } catch (Exception e) {
            System.err.println("Error creating table:");
            System.err.println(e.getMessage());
        }
    }
}

