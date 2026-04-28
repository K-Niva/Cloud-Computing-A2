package com.amazonaws.samples.database;

import com.amazonaws.AmazonServiceException;
import com.amazonaws.SdkClientException;
import com.amazonaws.auth.profile.ProfileCredentialsProvider;
import com.amazonaws.regions.Regions;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;
import com.amazonaws.services.s3.model.CreateBucketRequest;
import com.amazonaws.services.s3.model.GetBucketLocationRequest;
import com.amazonaws.services.s3.model.PublicAccessBlockConfiguration;
import com.amazonaws.services.s3.model.SetPublicAccessBlockRequest;

import java.io.IOException;


public class CreateBucket {
    public static void main(String[] args) {

        Regions clientRegion = Regions.US_EAST_1;
        String bucketName = "a2-130-music-images";

        try {
            AmazonS3 s3Client = AmazonS3ClientBuilder.standard()
                    .withCredentials(new ProfileCredentialsProvider("default"))
                    .withRegion(clientRegion)
                    .build();

            if (!s3Client.doesBucketExistV2(bucketName)) {

                s3Client.createBucket(bucketName);

                s3Client.setPublicAccessBlock(
                        new SetPublicAccessBlockRequest()
                                .withBucketName(bucketName)
                                .withPublicAccessBlockConfiguration(
                                        new PublicAccessBlockConfiguration()
                                                .withBlockPublicAcls(true)
                                                .withIgnorePublicAcls(true)
                                                .withBlockPublicPolicy(true)
                                                .withRestrictPublicBuckets(true)
                                )
                );

                String location = s3Client.getBucketLocation(bucketName);
                System.out.println("Bucket '" + bucketName + "' created securely. Location: " + location);

            } else {
                System.out.println("Bucket already exists.");
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
