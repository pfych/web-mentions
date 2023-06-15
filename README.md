# Web Mentions

> [Webmention](https://www.w3.org/TR/webmention/) is an open web standard (W3C Recommendation) for conversations and interactions across the web, a powerful building block used for a growing distributed network of peer-to-peer comments, likes, reposts, and other responses across the web.

Implementation of a Webmention receiver built in Typescript. This project uses the serverless framework for Deployment to AWS & uses two DynamoDB tables for storing data. By using these services we can deploy an extremely fast & extremely cheap webmention receiver that can be easily deployed & integrated into existing sites.


## Development

### Prerequisites

- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
- [Docker](https://docs.docker.com/desktop/)
- [yq](https://github.com/mikefarah/yq) ([MacOS](https://formulae.brew.sh/formula/yq))
- [jq](https://jqlang.github.io/jq/)

### Starting

Install dependencies:
```sh
pnpm install
```

Start the local dynamoDB instances container and seed the tables:
```sh
PROFILE="aws-profile-name" REGION="ap-southeast-2" pnpm run start:dynamo
```

Start the local lambda session with SAM:
```sh
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

**Deploy to production environment**
```sh
pnpm install
PROFILE="aws-profile-name" REGION="ap-southeast-2" pnpm run deploy:dev
```

## Endpoints

- `/web-mentions` (`POST`): Submit a Webmention
- `/web-mentions/status/:id` (`GET`): Get status of submitted Webmention
- `/web-mentions/query` (`POST`): Query all Webmentions based on target param


## Flow and error handling 

When making a request to the webmention endpoint the service will return `201` if the base of your request is ok, this response will include a `location` header which contains a path to view the status of your request. 

The server will then fetch the `source` and `target` and confirm that both exist and the `source` mentions the `target`. If this is successful the status object will update to have the status of `SUCCESS` and a mention object will be inserted into the database.

The following errors codes exist in the system:

- `STATUS_GONE`: You requested a status object that does not exist or has been removed from the DB
- `INVALID_INPUT`: You are missing either `source` or `target` in your initial request
- `SAME_URL`: Both `source` and `target` are the same
- `FETCH_FAILED`: Either `source` or `target` did not response `200 OK`
- `NO_MENTION`: The provided `Source` does not mention the `target`
- `MISSING_TARGET`: You requested a list of mentions for a target without including a `target`
- `UNKOWN`: This will come alongside a `500` response from the server, there has been an error in the handler itself
