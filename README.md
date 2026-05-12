# Cloud-Computing-A2
### 2026 Semester 1 – Cloud Computing Assessment 2

## Group Members
- Niva Kandhan – s4009673
- Petrea Theodorakopulos – s4008914
- Chaturya Doddi – s4006675

---

# Project Overview
This project implements a cloud-based Music Subscription Web Application using multiple AWS services including:
- Amazon DynamoDB
- Amazon S3
- Amazon EC2
- Amazon ECS
- AWS Lambda with API Gateway

The application supports:
- User registration and authentication
- Music searching
- Subscription management
- Artist image retrieval

---

# Code Locations

## Frontend
Location:
```text
frontend/
````

Contains:

* HTML pages
* CSS styling
* Frontend JavaScript
* HTML Images

---

## Database and S3 Utility Code

Location:

```text
main/java/com/amazonaws/samples/database/
```

Contains:

* DynamoDB table creation scripts
* Data loading scripts
* S3 image upload utilities

---

## AWS S3 Frontend Hosting Utilities

Location:

```text
src/main/java/com/amazonaws/samples/lambda/
```

Contains:

* S3 frontend bucket creation
* Frontend upload scripts

---

## Lambda Backend Code

Location:

```text
Lambda_Code/
```

Contains:

* Lambda backend handlers
* REST API request processing
* DynamoDB integration logic
* Subscription management functions

---

## EC2 and ECS Backend Code

Main Backend File:

```text
server.js
```

Contains:

* Node.js Express backend
* Authentication routes
* Music search APIs
* Subscription CRUD operations

---

## Docker Configuration

Main Docker File:

```text
Dockerfile
```

Used for:

* ECS containerisation
* Docker image builds


---

## Configuration Files

Project configuration files:

```text
package.json
package-lock.json
pom.xml
```

These files manage:

* Node.js dependencies
* Java Maven dependencies
* Project build configuration


