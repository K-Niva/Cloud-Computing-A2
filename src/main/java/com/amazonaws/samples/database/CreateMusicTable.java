package com.amazonaws.samples.database;

import com.amazonaws.auth.profile.ProfileCredentialsProvider;
import com.amazonaws.regions.Regions;
import com.amazonaws.services.dynamodbv2.AmazonDynamoDB;
import com.amazonaws.services.dynamodbv2.AmazonDynamoDBClientBuilder;
import com.amazonaws.services.dynamodbv2.document.DynamoDB;
import com.amazonaws.services.dynamodbv2.document.Table;
import com.amazonaws.services.dynamodbv2.model.*;
import java.util.Arrays;

public class CreateMusicTable {

    public static void main(String[] args) {

        AmazonDynamoDB client = AmazonDynamoDBClientBuilder.standard()
                .withRegion(Regions.US_EAST_1)
                .withCredentials(new ProfileCredentialsProvider("default"))
                .build();

        DynamoDB dynamoDB = new DynamoDB(client);

        String tableName = "music";

        try {
            System.out.println("Creating music table...");

            CreateTableRequest request = new CreateTableRequest()
                    .withTableName(tableName)
                    .withKeySchema(
                            new KeySchemaElement("artist", KeyType.HASH),  // Partition key
                            new KeySchemaElement("title", KeyType.RANGE)   // Sort key
                    )
                    .withAttributeDefinitions(
                            new AttributeDefinition("artist", ScalarAttributeType.S),
                            new AttributeDefinition("title", ScalarAttributeType.S)
                    )
                    .withBillingMode(BillingMode.PAY_PER_REQUEST);

            Table table = dynamoDB.createTable(request);
            table.waitForActive();

            System.out.println("Success. Table status: " + table.getDescription().getTableStatus());

        } catch (Exception e) {
            System.err.println("Unable to create table:");
            System.err.println(e.getMessage());
        }
    }
}