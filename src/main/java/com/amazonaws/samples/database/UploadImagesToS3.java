package com.amazonaws.samples.database;

import com.amazonaws.AmazonServiceException;
import com.amazonaws.SdkClientException;

import com.amazonaws.regions.Regions;

import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;

import com.amazonaws.services.s3.model.PutObjectRequest;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.*;
import java.net.URL;
import java.util.Iterator;

import java.util.HashSet;
import java.util.Set;

public class UploadImagesToS3 {

    public static void main(String[] args) throws IOException {

        // AWS region where S3 bucket is hosted
        Regions clientRegion = Regions.US_EAST_1;

        // targets the S3 bucket for storing artist images
        String bucketName = "a2-130-music-images";

        // tracks the already-uploaded image URLs to avoid duplicates
        Set<String> uploadedUrls = new HashSet<>();

        try {

            // creates the S3 client
            AmazonS3 s3Client = AmazonS3ClientBuilder.standard()
                    .withRegion(clientRegion)
                    .build();

            // JSON parser for song dataset
            ObjectMapper mapper = new ObjectMapper();

            // loads the song data file
            JsonNode rootNode = mapper.readTree(new File("2026a2_songs.json"));

            // iterates through songs array
            Iterator<JsonNode> iter = rootNode.path("songs").elements();

            // processes each song entry
            while (iter.hasNext()) {

                JsonNode song = iter.next();

                // extracts the Artist's Name and image URL
                String artist = song.path("artist").asText();
                String imgUrl = song.path("img_url").asText();

                // skips if the image was already uploaded
                if (uploadedUrls.contains(imgUrl)) {
                    System.out.println("Skipping duplicate image for: " + artist);
                    continue;
                }

                try {

                    // DOWNLOADS IMAGE FROM URL
                    URL url = new URL(imgUrl);

                    // opens the input stream from image URL
                    InputStream in = url.openStream();

                    // creates the temporary file to store image locally
                    File tempFile = File.createTempFile("artist-", ".jpg");

                    // outputs the stream to write downloaded image
                    FileOutputStream out = new FileOutputStream(tempFile);

                    byte[] buffer = new byte[4096];
                    int bytesRead;

                    // reads the image data in chunks and write to file
                    while ((bytesRead = in.read(buffer)) != -1) {
                        out.write(buffer, 0, bytesRead);
                    }

                    // closes the streams after download
                    in.close();
                    out.close();

                    // UPLOAD IMAGE TO S3
                    // create a safe S3 object key (to remove special characters)
                    String keyName = artist.replaceAll("[^a-zA-Z0-9]", "_") + ".jpg";

                    // creates S3 upload request
                    PutObjectRequest request =
                            new PutObjectRequest(bucketName, keyName, tempFile);

                    // uploads the file to the S3 bucket
                    s3Client.putObject(request);

                    System.out.println("Uploaded image for: " + artist);

                    // marks the URL as uploaded to prevent duplicates
                    uploadedUrls.add(imgUrl);

                    // deletes the temporary file after upload
                    tempFile.delete();

                } catch (Exception e) {

                    // handles the errors for individual image upload
                    System.err.println("Failed for artist: " + artist);
                    e.printStackTrace();
                }
            }

        } catch (AmazonServiceException e) {

            // AWS service-side errors
            e.printStackTrace();

        } catch (SdkClientException e) {

            // Client-side errors
            e.printStackTrace();
        }
    }
}