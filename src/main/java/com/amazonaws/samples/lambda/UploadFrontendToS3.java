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

        /* FRONTEND S3 BUCKET NAME */
        String bucketName = "a2-130-music-frontend-bucket";


        /* CREATE AMAZON S3 CLIENT */
        AmazonS3 s3Client = AmazonS3ClientBuilder.standard()

                /* AWS region */
                .withRegion(Regions.US_EAST_1)

                /* build S3 client */
                .build();


        /* ALL FRONTEND FILES */
        String basePath =
                "/Users/petreatheodorakopoulos/IdeaProjects/Cloud-Computing-A2/frontend/";


        /* UPLOADS HTML FILES */
        uploadFile(
                s3Client,
                bucketName,
                basePath + "login.html",
                "login.html",
                "text/html"
        );

        uploadFile(
                s3Client,
                bucketName,
                basePath + "register.html",
                "register.html",
                "text/html"
        );

        uploadFile(
                s3Client,
                bucketName,
                basePath + "main.html",
                "main.html",
                "text/html"
        );


        /* UPLOADS CSS FILES */
        uploadFile(
                s3Client,
                bucketName,
                basePath + "style_home.css",
                "style_home.css",
                "text/css"
        );

        uploadFile(
                s3Client,
                bucketName,
                basePath + "style_login.css",
                "style_login.css",
                "text/css"
        );


        /* UPLOADS IMAGE FILES */
        uploadFile(
                s3Client,
                bucketName,
                basePath + "background.jpg",
                "background.jpg",
                "image/jpeg"
        );

        uploadFile(
                s3Client,
                bucketName,
                basePath + "logo.png",
                "logo.png",
                "image/png"
        );

        uploadFile(
                s3Client,
                bucketName,
                basePath + "logo_with_background.png",
                "logo_with_background.png",
                "image/png"
        );


        /* completion message */
        System.out.println("Frontend upload complete!");
    }


    /* REUSABLE FILE UPLOAD METHOD */
    private static void uploadFile(

            AmazonS3 s3Client,
            String bucketName,
            String filePath,
            String keyName,
            String contentType

    ) {

        try {

            /* creates a file object */
            File file = new File(filePath);


            /* OBJECT METADATA */
            ObjectMetadata metadata = new ObjectMetadata();

            metadata.setContentType(contentType);


            /* creates the file input stream */
            FileInputStream inputStream =
                    new FileInputStream(file);


            /* sets the file size */
            metadata.setContentLength(file.length());


            /* CREATES AN UPLOAD REQUEST */
            PutObjectRequest request =
                    new PutObjectRequest(
                            bucketName,
                            keyName,
                            inputStream,
                            metadata
                    );


            /* uploads file to S3 */
            s3Client.putObject(request);


            /* closes input stream */
            inputStream.close();


            /* success !! */
            System.out.println(
                    "Uploaded: " + keyName
            );

        } catch (Exception e) {

            /* failure message */
            System.err.println(
                    "Failed upload: " + keyName
            );

            e.printStackTrace();
        }
    }
}