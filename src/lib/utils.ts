import {
  ERROR_CODES,
  MentionObject,
  RequestContext,
  STATUS_CODES,
  StatusObject,
} from '../types';
import cors from 'cors';
import { getConnection, put, update } from './dynamodb';
import express, { Express, NextFunction, Request, Response } from 'express';
import {
  APIGatewayEventRequestContext,
  APIGatewayProxyEvent,
} from 'aws-lambda';
import serverless from 'serverless-http';

const corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200,
};

export const createApp = (): Express => {
  const app = express();
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));
  app.use((req: RequestContext, res: Response, next: NextFunction) => {
    console.log(`Request: ${req.method} ${req.originalUrl}`);
    next();
  });

  return app;
};

export const createHandler = (app: Express) =>
  serverless(app, {
    request(request: RequestContext, event: APIGatewayProxyEvent) {
      request.context = event.requestContext;
    },
  });

export const createStatus = async (
  args: StatusObject,
): Promise<StatusObject> => {
  const dynamoDb = getConnection();

  return await put<StatusObject>({
    dynamoDb,
    table: process.env.STATUS_TABLE,
    item: args,
  });
};

export const updateStatus = async (args: {
  id: string;
  status: STATUS_CODES;
  errorCode?: ERROR_CODES;
}): Promise<StatusObject> => {
  console.log('Updating status object', args);
  const dynamoDb = getConnection();

  return await update<StatusObject>({
    dynamoDb,
    table: process.env.STATUS_TABLE,
    key: { id: args.id },
    fields: { status: args.status, errorCode: args.errorCode },
  });
};

export const createMention = async (args: {
  mentionId: string;
  source: string;
  target: string;
}): Promise<MentionObject> => {
  const dynamoDb = getConnection();

  console.log('Created new Mention:', args.mentionId);

  return await put<MentionObject>({
    dynamoDb,
    table: process.env.MENTION_TABLE,
    item: {
      id: args.mentionId,
      source: args.source,
      target: args.target,
      createdAt: Date.now().toString(),
    },
  });
};
