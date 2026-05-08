package com.amazonaws.samples.lambda;

import com.amazonaws.regions.Regions;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.PutObjectRequest;

import java.io.File;
import java.io.FileInputStream;

public class UploadFrontendToS3 {

    public static void main(String[] args) {

        String bucketName = "a2-130-music-frontend-bucket";

        AmazonS3 s3Client = AmazonS3ClientBuilder.standard()
                .withRegion(Regions.US_EAST_1)
                .build();

        String basePath = "/Users/petreatheodorakopoulos/IdeaProjects/Cloud-Computing-A2/frontend/";

        uploadFile(s3Client, bucketName, basePath + "login.html", "login.html", "text/html");
        uploadFile(s3Client, bucketName, basePath + "register.html", "register.html", "text/html");
        uploadFile(s3Client, bucketName, basePath + "main.html", "main.html", "text/html");

        uploadFile(s3Client, bucketName, basePath + "style_home.css", "style_home.css", "text/css");
        uploadFile(s3Client, bucketName, basePath + "style_login.css", "style_login.css", "text/css");

        uploadFile(s3Client, bucketName, basePath + "background.jpg", "background.jpg", "image/jpeg");
        uploadFile(s3Client, bucketName, basePath + "logo.png", "logo.png", "image/png");
        uploadFile(s3Client, bucketName, basePath + "logo_with_background.png", "logo_with_background.png", "image/png");

        System.out.println("Frontend upload complete!");
    }

    private static void uploadFile(AmazonS3 s3Client,
                                   String bucketName,
                                   String filePath,
                                   String keyName,
                                   String contentType) {

        try {

            File file = new File(filePath);

            ObjectMetadata metadata = new ObjectMetadata();
            metadata.setContentType(contentType);

            FileInputStream inputStream = new FileInputStream(file);
            metadata.setContentLength(file.length());

            PutObjectRequest request = new PutObjectRequest(bucketName, keyName, inputStream, metadata);

            s3Client.putObject(request);

            inputStream.close();

            System.out.println("Uploaded: " + keyName);

        } catch (Exception e) {
            System.err.println("Failed upload: " + keyName);
            e.printStackTrace();
        }
    }
}