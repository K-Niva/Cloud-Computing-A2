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

        AmazonDynamoDB client = AmazonDynamoDBClientBuilder.standard()
                .withRegion(Regions.US_EAST_1)
                .withCredentials(new ProfileCredentialsProvider("default"))
                .build();

        DynamoDB dynamoDB = new DynamoDB(client);

        Table table = dynamoDB.getTable("music");

        ObjectMapper mapper = new ObjectMapper();

        JsonNode rootNode = mapper.readTree(new File("2026a2_songs.json"));

        Iterator<JsonNode> iter = rootNode.path("songs").elements();

        while (iter.hasNext()) {

            ObjectNode current = (ObjectNode) iter.next();

            String title = current.path("title").asText();
            String artist = current.path("artist").asText();
            String year = current.path("year").asText();
            String album = current.path("album").asText();
            String imgUrl = current.path("img_url").asText();

            String songId = album + "#" + title;

            try {
                table.putItem(new Item()
                        .withPrimaryKey(
                                "artist", artist,
                                "song_id", songId
                        )
                        .withString("year", year)
                        .withString("album", album)
                        .withString("img_url", imgUrl)
                );

                System.out.println("Inserted: " + artist + " - " + title);

            } catch (Exception e) {
                System.err.println("Error inserting: " + title);
                System.err.println(e.getMessage());
            }
        }
    }
}