import * as AWS from 'aws-sdk';
import * as https from 'https';
import {
  DocumentClient,
  GetItemInput,
  QueryInput,
} from 'aws-sdk/clients/dynamodb';

const IS_OFFLINE = process.env.AWS_SAM_LOCAL === 'true';

export let dynamoDb: AWS.DynamoDB.DocumentClient | undefined = undefined;

const createNewClient = (): DocumentClient => {
  const agent = new https.Agent({
    keepAlive: true,
    maxSockets: Infinity, // Interpreted as 50 lol
  });

  let connection: DocumentClient;
  if (IS_OFFLINE) {
    connection = new AWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://dynamodb:8000',
    });
  } else {
    connection = new AWS.DynamoDB.DocumentClient({
      httpOptions: {
        agent,
      },
      paramValidation: false,
      convertResponseTypes: false,
    });
  }

  return connection;
};

export const getConnection = (): DocumentClient => {
  console.log('Getting DynamoDB Connection');
  if (typeof dynamoDb === 'undefined') {
    dynamoDb = createNewClient();
  }

  return dynamoDb;
};

export const get = async <T>(params: {
  dynamoDb: DocumentClient;
  table: string;
  key: Record<string, any>;
}): Promise<T> => {
  console.log(`Getting item from ${params.table}`, params.key);
  const input: GetItemInput = {
    TableName: params.table,
    Key: params.key,
  };

  const result = await params.dynamoDb.get(input).promise();

  if (result?.$response?.error) {
    throw new Error(result?.$response?.error.message);
  }

  return result.Item as T;
};

export const query = async <T>(params: {
  dynamoDb: DocumentClient;
  table: string;
  indexName: string;
  keyName: string;
  keyValue: any;
}): Promise<T[]> => {
  console.log(
    `Querying index ${params.indexName} for ${params.keyName}: ${params.keyValue}`,
  );

  const input: QueryInput = {
    TableName: params.table,
    IndexName: params.indexName,
    KeyConditionExpression: '#a = :b',
    ExpressionAttributeNames: {
      '#a': params.keyName,
    },
    ExpressionAttributeValues: {
      ':b': params.keyValue,
    },
  };

  const records: T[] = [];
  let lastKey: AWS.DynamoDB.DocumentClient.Key | undefined = undefined;
  do {
    const result = await params.dynamoDb.query(input).promise();
    const resultRecords = result.Items as T[];
    records.push(...resultRecords);
    lastKey = result.LastEvaluatedKey;
    input.ExclusiveStartKey = lastKey;
  } while (lastKey);

  return records;
};

export const put = async <T>(params: {
  dynamoDb: DocumentClient;
  table: string;
  item: T;
}): Promise<T> => {
  console.log(`Putting item into ${params.table}`, params.item);
  const input: DocumentClient.PutItemInput = {
    TableName: params.table,
    Item: params.item,
  };

  const result = await params.dynamoDb.put(input).promise();

  if (result?.$response?.error) {
    throw new Error(result?.$response?.error.message);
  }

  return params.item;
};

export const update = async <T>(params: {
  dynamoDb: DocumentClient;
  table: string;
  key: { [key: string]: any };
  fields: Partial<Record<keyof T, any>>;
}): Promise<T> => {
  const fieldsToUpdate: {
    name: string;
    attributeName: string;
    attributeValue: any;
    ref: string;
  }[] = [];

  Object.keys(params.fields).forEach((field, index) => {
    if (
      typeof params.fields[field] !== undefined &&
      params.fields[field] !== undefined
    ) {
      fieldsToUpdate.push({
        name: field,
        attributeName: `#attr${index}`,
        attributeValue: params.fields[field],
        ref: `:attr${index}`,
      });
    }
  });

  const updateExpression = `set ${fieldsToUpdate
    .map((item) => `${item.attributeName}=${item.ref}`)
    .join(', ')}`;

  const expressionAttributeValues = fieldsToUpdate.reduce((acc, item) => {
    return {
      ...acc,
      [item.ref]: item.attributeValue,
    };
  }, {} as { [key: string]: any });

  const expressionAttributeNames = fieldsToUpdate.reduce((acc, item) => {
    return {
      ...acc,
      [item.attributeName]: item.name,
    };
  }, {} as { [key: string]: any });

  const input: DocumentClient.UpdateItemInput = {
    TableName: params.table,
    Key: params.key,
    UpdateExpression: updateExpression,
    ExpressionAttributeValues: expressionAttributeValues,
    ExpressionAttributeNames: expressionAttributeNames,
    ReturnValues: 'ALL_NEW',
  };

  const result = await params.dynamoDb.update(input).promise();

  if (result?.$response?.error) {
    throw new Error(result?.$response?.error.message);
  }

  return result.Attributes as T;
};
