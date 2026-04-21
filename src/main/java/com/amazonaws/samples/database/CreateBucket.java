package com.amazonaws.samples.database;

import com.amazonaws.AmazonServiceException;
import com.amazonaws.SdkClientException;
import com.amazonaws.auth.profile.ProfileCredentialsProvider;
import com.amazonaws.regions.Regions;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;
import com.amazonaws.services.s3.model.CreateBucketRequest;
import com.amazonaws.services.s3.model.GetBucketLocationRequest;

import java.io.IOException;


public class CreateBucket {
    public static void main(String[] args) {

        Regions clientRegion = Regions.US_EAST_1;
        String bucketName = "a2_130_music_images";

        try {
            AmazonS3 s3Client = AmazonS3ClientBuilder.standard()
                    .withCredentials(new ProfileCredentialsProvider("default"))
                    .withRegion(clientRegion)
                    .build();

            if (!s3Client.doesBucketExistV2(bucketName)) {

                s3Client.createBucket(bucketName);

                String location = s3Client.getBucketLocation(bucketName);
                System.out.println("Bucket created. Location: " + location);
            } else {
                System.out.println("Bucket already exists.");
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
