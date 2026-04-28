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

        Regions clientRegion = Regions.US_EAST_1;
        String bucketName = "a2-130-music-images";

        Set<String> uploadedUrls = new HashSet<>();


        try {

            AmazonS3 s3Client = AmazonS3ClientBuilder.standard()
                    .withRegion(clientRegion)
                    .build();

            ObjectMapper mapper = new ObjectMapper();

            JsonNode rootNode = mapper.readTree(new File("2026a2_songs.json"));
            Iterator<JsonNode> iter = rootNode.path("songs").elements();

            while (iter.hasNext()) {

                JsonNode song = iter.next();

                String artist = song.path("artist").asText();
                String imgUrl = song.path("img_url").asText();

                if (uploadedUrls.contains(imgUrl)) {
                    System.out.println("Skipping duplicate image for: " + artist);
                    continue;
                }

                try {

                    // Download image from URL
                    URL url = new URL(imgUrl);
                    InputStream in = url.openStream();

                    File tempFile = File.createTempFile("artist-", ".jpg");
                    FileOutputStream out = new FileOutputStream(tempFile);

                    byte[] buffer = new byte[4096];
                    int bytesRead;

                    while ((bytesRead = in.read(buffer)) != -1) {
                        out.write(buffer, 0, bytesRead);
                    }

                    in.close();
                    out.close();

                    // Upload to S3
                    String keyName = artist.replaceAll("[^a-zA-Z0-9]", "_") + ".jpg";

                    PutObjectRequest request =
                            new PutObjectRequest(bucketName, keyName, tempFile);

                    s3Client.putObject(request);

                    System.out.println("Uploaded image for: " + artist);

                    uploadedUrls.add(imgUrl);

                    tempFile.delete();

                } catch (Exception e) {
                    System.err.println("Failed for artist: " + artist);
                    e.printStackTrace();
                }
            }

        } catch (AmazonServiceException e) {
            e.printStackTrace();
        } catch (SdkClientException e) {
            e.printStackTrace();
        }
    }
}


