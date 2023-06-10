# Web Mentions

> [Webmention](https://www.w3.org/TR/webmention/) is an open web standard (W3C Recommendation) for conversations and interactions across the web, a powerful building block used for a growing distributed network of peer-to-peer comments, likes, reposts, and other responses across the web.

Implementation of a Webmention receiver built in Typescript. This project uses the serverless framework for Deployment to AWS & uses two DynamoDB tables for storing data. By using these services we can deploy an extremely fast & extremely cheap webmention receiver that can be easily deployed & integrated into existing sites.

## Development

```sh
pnpm install
PROFILE="aws-profile-name" REGION="ap-southeast-2" pnpm run start
```

You may have to restart serverless and rerun `pnpm run start` after making changes.

## Deployment

Ensure you have `awscli` installed on your system & have configured a profile.

**Deploy to development environment**
```sh
pnpm install
PROFILE="aws-profile-name" REGION="ap-southeast-2" pnpm run deploy:dev
```

**Deploy to development production**
```sh
pnpm install
PROFILE="aws-profile-name" REGION="ap-southeast-2" pnpm run deploy:dev
```
