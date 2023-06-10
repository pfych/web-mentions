import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { get, getConnection, query } from './lib/dynamodb';
import axios from 'axios';
import { MentionObject, RequestContext, StatusObject } from './types';
import {
  createApp,
  createHandler,
  createMention,
  createStatus,
  updateStatus,
} from './lib/utils';

const app = createApp();
export const handler = createHandler(app);

app.post(
  '/web-mentions',
  async (request: RequestContext, response: Response) => {
    const { source, target } = request.body;
    const statusId: string = uuidv4();

    try {
      if (!source || !target) {
        return response
          .status(400)
          .json({ error: 'Missing either source or target value' });
      }

      if (source === target) {
        return response
          .status(400)
          .json({ error: 'Source & Target cannot be the same' });
      }

      await createStatus({ id: statusId, status: 'PENDING', source, target });

      // Tell user we've started processing
      response
        .header('Location', `/web-mentions/status/${statusId}`)
        .status(201)
        .json({});

      // Check if source & target exists
      const [sourceResponse, targetResponse] = await Promise.all([
        axios.get(source, {
          headers: {},
          responseType: 'document',
          validateStatus: () => true,
        }),
        axios.get(target, {
          headers: {},
          responseType: 'document',
          validateStatus: () => true,
        }),
      ]);

      if (sourceResponse.status !== 200 || targetResponse.status !== 200) {
        console.warn('Failed to fetch either source or target');

        await updateStatus({
          id: statusId,
          status: 'FAILED',
          errorCode: 'FETCH_FAILED',
        });
      }

      // Check if source mentions target
      if (!JSON.stringify(sourceResponse.data).includes(target)) {
        console.warn('Source does not mention target');

        return await updateStatus({
          id: statusId,
          status: 'FAILED',
          errorCode: 'NO_MENTION',
        });
      }

      await createMention({
        mentionId: uuidv4(),
        source,
        target,
      });

      await updateStatus({ id: statusId, status: 'SUCCESS' });

      return;
    } catch (e) {
      console.error(`Mention ${statusId} failed ungracefully.`);

      await updateStatus({
        id: statusId,
        status: 'FAILED',
        errorCode: 'UNKNOWN',
      });

      return;
    }
  },
);

app.get(
  '/web-mentions/status/:id',
  async (req: RequestContext, res: Response) => {
    try {
      const { id } = req.params;
      const dynamoDb = getConnection();

      const statusObject = await get<StatusObject>({
        dynamoDb,
        table: process.env.STATUS_TABLE,
        key: { id },
      });

      if (!statusObject) {
        return res.status(400).json({
          code: 'STATUS_GONE',
        });
      }

      return res.status(200).json(statusObject);
    } catch (e) {
      return res.status(400).json({
        code: 'UNKNOWN',
      });
    }
  },
);

app.post('/web-mentions/query', async (req: RequestContext, res: Response) => {
  try {
    const { target } = req.body;
    const dynamoDb = getConnection();

    if (!target) {
      return res.status(400).json({ code: 'MISSING_TARGET' });
    }

    const statusObject = await query<MentionObject>({
      dynamoDb,
      table: process.env.MENTION_TABLE,
      keyName: 'target',
      keyValue: target,
      indexName: 'target-index',
    });

    return res.status(200).json([...(statusObject || [])]);
  } catch (e) {
    console.error('Query failed ungracefully: ', e);
    return res.status(400).json({
      code: 'UNKNOWN',
    });
  }
});
