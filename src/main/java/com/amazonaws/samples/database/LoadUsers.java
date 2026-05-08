package com.amazonaws.samples.database;

import java.io.File;

import java.util.Iterator;

import com.amazonaws.auth.profile.ProfileCredentialsProvider;

import com.amazonaws.regions.Regions;

import com.amazonaws.services.dynamodbv2.AmazonDynamoDB;
import com.amazonaws.services.dynamodbv2.AmazonDynamoDBClientBuilder;

import com.amazonaws.services.dynamodbv2.document.DynamoDB;
import com.amazonaws.services.dynamodbv2.document.Table;
import com.amazonaws.services.dynamodbv2.document.Item;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

import com.fasterxml.jackson.core.JsonFactory;
import com.fasterxml.jackson.core.JsonParser;

public class LoadUsers {

    public static void main(String[] args) throws Exception {

        // creates DynamoDB client using AWS credentials profile
        AmazonDynamoDB client = AmazonDynamoDBClientBuilder.standard()

                // sets AWS region
                .withRegion(Regions.US_EAST_1)

                // loads AWS credentials from local profile ("default")
                .withCredentials(new ProfileCredentialsProvider("default"))

                // builds the client instance
                .build();

        // creates DynamoDB document API wrapper
        DynamoDB dynamoDB = new DynamoDB(client);

        // refers to the "login" table in DynamoDB
        Table table = dynamoDB.getTable("login");

        // creates the JSON parser for reading user data file
        JsonParser parser = new JsonFactory()
                .createParser(new File("src/main/resources/users.json"));

        // parses the JSON structure into tree model
        JsonNode rootNode = new ObjectMapper().readTree(parser);

        // iterator for looping through all user objects in JSON
        Iterator<JsonNode> iter = rootNode.iterator();

        // temporary object holder for each user record
        ObjectNode currentNode;

        // loops it through each user in dataset
        while (iter.hasNext()) {

            // gets the current user object
            currentNode = (ObjectNode) iter.next();

            // extracts the user attributes
            String email = currentNode.path("email").asText();
            String userName = currentNode.path("user_name").asText();
            String password = currentNode.path("password").asText();

            try {

                // adds the user into DynamoDB table
                table.putItem(new Item()

                        // Primary key: email (unique identifier)
                        .withPrimaryKey("email", email)

                        // Store user attributes
                        .withString("user_name", userName)
                        .withString("password", password)
                );

                // logs in the successful insertion
                System.out.println("Inserted user: " + email);

            } catch (Exception e) {

                // handles the insertion failure
                System.err.println("Unable to add user: " + email);
                System.err.println(e.getMessage());

                // Stop processing if an error occurs
                break;
            }
        }

        // closes the JSON parser to free resources
        parser.close();
    }
}

// this was created to ensure there will be users
// checking if our system can handle over 10 users