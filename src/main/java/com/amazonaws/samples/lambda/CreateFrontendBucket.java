package com.amazonaws.samples.lambda;

import com.amazonaws.auth.profile.ProfileCredentialsProvider;
import com.amazonaws.regions.Regions;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;
import com.amazonaws.services.s3.model.BucketWebsiteConfiguration;

public class CreateFrontendBucket {

    public static void main(String[] args) {

        /* S3 BUCKET NAME */
        String bucketName = "a2-130-music-frontend-bucket";


        /* CREATE AMAZON S3 CLIENT -> Connects to AWS S3 service */
        AmazonS3 s3Client = AmazonS3ClientBuilder.standard()

                /* AWS credentials profile */
                .withCredentials(
                        new ProfileCredentialsProvider("default")
                )

                /* AWS region */
                .withRegion(Regions.US_EAST_1)

                /* build client */
                .build();

        try {

            /* CHECK IF BUCKET EXISTS */
            if (!s3Client.doesBucketExistV2(bucketName)) {

                /* creates bucket if it does not exist */
                s3Client.createBucket(bucketName);

                System.out.println(
                        "Bucket created: " + bucketName
                );
            }


            /* ENABLE STATIC WEBSITE HOSTING -> login.html becomes homepage */
            s3Client.setBucketWebsiteConfiguration(

                    bucketName,

                    new BucketWebsiteConfiguration(
                            "login.html",   // index page
                            null            // no custom error page
                    )
            );


            /* success !! */
            System.out.println(
                    "Frontend bucket configured successfully."
            );

        } catch (Exception e) {

            /* print errors */
            e.printStackTrace();
        }
    }
}