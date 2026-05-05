package com.amazonaws.samples.lambda;

import com.amazonaws.auth.profile.ProfileCredentialsProvider;
import com.amazonaws.regions.Regions;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;
import com.amazonaws.services.s3.model.BucketWebsiteConfiguration;

public class CreateFrontendBucket {

    public static void main(String[] args) {

        String bucketName = "a2-130-music-frontend-bucket";

        AmazonS3 s3Client = AmazonS3ClientBuilder.standard()
                .withCredentials(new ProfileCredentialsProvider("default"))
                .withRegion(Regions.US_EAST_1)
                .build();

        try {

            if (!s3Client.doesBucketExistV2(bucketName)) {
                s3Client.createBucket(bucketName);
                System.out.println("Bucket created: " + bucketName);
            }

            // Static website hosting
            s3Client.setBucketWebsiteConfiguration(
                    bucketName,
                    new BucketWebsiteConfiguration("login.html", null)
            );

            System.out.println("Frontend bucket configured successfully.");

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}