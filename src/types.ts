import { Request } from 'express';
import { APIGatewayEventRequestContext } from 'aws-lambda';

export type RequestContext = Request & {
  context: APIGatewayEventRequestContext;
};

export type STATUS_CODES = 'SUCCESS' | 'PENDING' | 'FAILED';
export type ERROR_CODES =
  | 'STATUS_GONE'
  | 'INVALID_INPUT'
  | 'SAME_URL'
  | 'FETCH_FAILED'
  | 'NO_MENTION'
  | 'UNKNOWN'
  | 'MISSING_TARGET';

export interface StatusObject {
  id: string;
  status: STATUS_CODES;
  errorCode?: ERROR_CODES;
  source: string;
  target: string;
}

export interface MentionObject {
  id: string;
  source: string;
  target: string;
  createdAt: string;
}
