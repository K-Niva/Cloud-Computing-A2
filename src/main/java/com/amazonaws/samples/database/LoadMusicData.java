package com.amazonaws.samples.database;

import java.io.File;

import java.util.Iterator;

import com.amazonaws.auth.profile.ProfileCredentialsProvider;

import com.amazonaws.regions.Regions;

import com.amazonaws.services.dynamodbv2.AmazonDynamoDB;
import com.amazonaws.services.dynamodbv2.AmazonDynamoDBClientBuilder;

import com.amazonaws.services.dynamodbv2.document.DynamoDB;
import com.amazonaws.services.dynamodbv2.document.Item;
import com.amazonaws.services.dynamodbv2.document.Table;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

public class LoadMusicData {

    public static void main(String[] args) throws Exception {

        // creates DynamoDB client using AWS credentials profile
        AmazonDynamoDB client = AmazonDynamoDBClientBuilder.standard()

                // sets AWS region
                .withRegion(Regions.US_EAST_1)

                // loads the credentials from local AWS profile ("default")
                .withCredentials(new ProfileCredentialsProvider("default"))

                // builds client instance
                .build();

        // creates DynamoDB document API wrapper
        DynamoDB dynamoDB = new DynamoDB(client);

        // gets he reference to the "music" table
        Table table = dynamoDB.getTable("music");

        // JSON parser utility
        ObjectMapper mapper = new ObjectMapper();

        // reads the JSON file containing song dataset
        JsonNode rootNode = mapper.readTree(new File("2026a2_songs.json"));

        // gets iterator for the "songs" array inside JSON file
        Iterator<JsonNode> iter = rootNode.path("songs").elements();

        // loops it through each song entry in dataset
        while (iter.hasNext()) {

            // converts the JSON node to an editable object node
            ObjectNode current = (ObjectNode) iter.next();

            // extracts the song attributes from JSON
            String title = current.path("title").asText();
            String artist = current.path("artist").asText();
            String year = current.path("year").asText();
            String album = current.path("album").asText();
            String imgUrl = current.path("img_url").asText();

            // creates the lowercase versions for indexing/search consistency
            String artistKey = artist.toLowerCase();
            String albumKey = album.toLowerCase();
            String titleKey = title.toLowerCase();

            // creates a unique song identifier
            String songId = album + "#" + title;

            try {

                // adds the item into DynamoDB table
                table.putItem(new Item()

                        // Primary key: artist (partition) + song_id (sort key)
                        .withPrimaryKey(
                                "artist", artist,
                                "song_id", songId
                        )

                        // stores the song metadata attributes
                        .withString("year", year)
                        .withString("title", title)
                        .withString("album", album)
                        .withString("img_url", imgUrl)

                        // extra indexed the attributes for faster searching
                        .withString("artist_key", artistKey)
                        .withString("album_key", albumKey)
                        .withString("title_key", titleKey)
                );

                // logs in the successful insertion
                System.out.println("Inserted: " + artist + " - " + title);

            } catch (Exception e) {

                // handles the insertion errors
                System.err.println("Error inserting: " + title);
                System.err.println(e.getMessage());
            }
        }
    }
}