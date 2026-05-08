package com.amazonaws.samples.database;

import com.amazonaws.auth.profile.ProfileCredentialsProvider;
import com.amazonaws.regions.Regions;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;
import com.amazonaws.services.s3.model.PublicAccessBlockConfiguration;
import com.amazonaws.services.s3.model.SetPublicAccessBlockRequest;

public class CreateBucketImages {

    public static void main(String[] args) {

        /* AWS REGION */
        Regions clientRegion = Regions.US_EAST_1;


        /* S3 BUCKET NAME */
        String bucketName = "a2-130-music-images";

        try {

            /* CREATE AMAZON S3 CLIENT */
            AmazonS3 s3Client =
                    AmazonS3ClientBuilder.standard()

                            /* AWS credentials profile */
                            .withCredentials(
                                    new ProfileCredentialsProvider("default")
                            )

                            /* AWS region */
                            .withRegion(clientRegion)

                            /* build S3 client */
                            .build();


            /* CHECK IF BUCKET EXISTS */
            if (!s3Client.doesBucketExistV2(bucketName)) {

                /* creates bucket */
                s3Client.createBucket(bucketName);


                /* ENABLES PUBLIC ACCESS BLOCK */
                s3Client.setPublicAccessBlock(

                        new SetPublicAccessBlockRequest()

                                /* targets bucket */
                                .withBucketName(bucketName)

                                /* security settings */
                                .withPublicAccessBlockConfiguration(

                                        new PublicAccessBlockConfiguration()

                                                /* blocks public ACLs */
                                                .withBlockPublicAcls(true)

                                                /* ignores public ACLs */
                                                .withIgnorePublicAcls(true)

                                                /* blocks public bucket policies */
                                                .withBlockPublicPolicy(true)

                                                /* restricts public access */
                                                .withRestrictPublicBuckets(true)
                                )
                );


                /* retrieves bucket region/location */
                String location =
                        s3Client.getBucketLocation(bucketName);


                /* success !! */
                System.out.println(
                        "Bucket '" + bucketName +
                        "' created securely. Location: " +
                        location
                );

            } else {

                /* if bucket already exists */
                System.out.println(
                        "Bucket already exists."
                );
            }

        } catch (Exception e) {

            /* print errors */
            e.printStackTrace();
        }
    }
}