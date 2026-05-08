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

        // creates DynamoDB client using AWS credentials profile
        AmazonDynamoDB client = AmazonDynamoDBClientBuilder.standard()

                // sets AWS region for the service
                .withRegion(Regions.US_EAST_1)

                // loads the credentials from local AWS profile ("default")
                .withCredentials(new ProfileCredentialsProvider("default"))

                // builds the client instance
                .build();

        // creates DynamoDB document API wrapper for easier table operations
        DynamoDB dynamoDB = new DynamoDB(client);

        // Name of the DynamoDB table
        String tableName = "music";

        try {

            System.out.println("Creating music table...");

            // defines table creation request
            CreateTableRequest request = new CreateTableRequest()

                    // sets table name
                    .withTableName(tableName)

                    // defines primary key structure
                    .withKeySchema(

                            // Partition key: artist (main grouping key)
                            new KeySchemaElement("artist", KeyType.HASH),

                            // Sort key: song_id (identifies each song by artist)
                            new KeySchemaElement("song_id", KeyType.RANGE)
                    )

                    // Local Secondary Index (LSI) -> allows querying songs by Artist + Year
                    .withLocalSecondaryIndexes(
                            new LocalSecondaryIndex()
                                    .withIndexName("ArtistYearIndex")
                                    .withKeySchema(
                                            new KeySchemaElement("artist", KeyType.HASH),
                                            new KeySchemaElement("year", KeyType.RANGE)
                                    )
                                    // projects all attributes into the index
                                    .withProjection(
                                            new Projection().withProjectionType(ProjectionType.ALL)
                                    )
                    )

                    // Global Secondary Index (GSI) -> allows querying by Album + Title
                    .withGlobalSecondaryIndexes(
                            new GlobalSecondaryIndex()
                                    .withIndexName("AlbumArtistIndex")
                                    .withKeySchema(
                                            new KeySchemaElement("album", KeyType.HASH),
                                            new KeySchemaElement("title", KeyType.RANGE)
                                    )
                                    .withProjection(
                                            new Projection().withProjectionType(ProjectionType.ALL)
                                    )
                    )

                    // defines all attribute types used in the table and indexes
                    .withAttributeDefinitions(
                            new AttributeDefinition("artist", ScalarAttributeType.S),
                            new AttributeDefinition("title", ScalarAttributeType.S),
                            new AttributeDefinition("year", ScalarAttributeType.S),
                            new AttributeDefinition("song_id", ScalarAttributeType.S),
                            new AttributeDefinition("album", ScalarAttributeType.S)
                    )

                    // uses on-demand pricing
                    .withBillingMode(BillingMode.PAY_PER_REQUEST);

            // creates the table in DynamoDB
            Table table = dynamoDB.createTable(request);

            table.waitForActive();

            // success !!
            System.out.println("Success. Table status: " + table.getDescription().getTableStatus());

        } catch (Exception e) {

            // error message
            System.err.println("Unable to create table:");
            System.err.println(e.getMessage());
        }
    }
}