import { Injectable, Logger, HttpException } from '@nestjs/common';
import {
  TwoWayAuthProtocolService,
  OpenApiContext,
} from './two-way-auth.protocol';

import axios from 'axios';

function axiosToCurl(config: any): string {
  const method = (config.method || 'get').toUpperCase();
  const url = config.url;
  const headers = config.headers || {};
  const data =
    typeof config.data === 'string'
      ? config.data
      : JSON.stringify(config.data || {});

  let curl = [`curl -X ${method}`];

  // Add headers
  for (const [key, value] of Object.entries(headers)) {
    if (Array.isArray(value)) {
      value.forEach((v) => curl.push(`-H "${key}: ${v}"`));
    } else if (value !== undefined) {
      curl.push(`-H "${key}: ${value}"`);
    }
  }

  // Add body if exists
  if (data && method !== 'GET') {
    curl.push(`--data '${data}'`);
  }

  curl.push(`"${url}"`);

  return curl.join(' ');
}

axios.interceptors.request.use((config) => {
  console.log('[Axios → cURL]', axiosToCurl(config));
  return config;
});

function isAxiosError(err: any) {
  return (
    typeof err === 'object' &&
    err !== null &&
    (err as any).isAxiosError === true
  );
}

function normalizeHeaders(headers: Record<string, any>) {
  const out: Record<string, string | string[]> = {};
  for (const [k, v] of Object.entries(headers)) out[k.toLowerCase()] = v as any;
  return out;
}

@Injectable()
export class ZolozCallerService {
  private readonly logger = new Logger(ZolozCallerService.name);

  constructor(private proto: TwoWayAuthProtocolService) {}

  async callAmlAnalyze(bizContent: object) {
    const apiName = 'v1.aml.analyze';
    const context: OpenApiContext = {
      apiName,
      requestHeaders: {},
      responseHeaders: {},
      requestBody: '',
      responseBody: '',
    };

    // Step 1: Build signed/encrypted request
    await this.proto.buildRequest(context, JSON.stringify(bizContent));

    // Step 2: Construct full URL
    const url = `${process.env.ZOLOZ_HOST}/api/${apiName.replace(/\./g, '/')}`;

    // Step 3: Send with axios
    const resp = await axios.post(url, context.requestBody, {
      headers: context.requestHeaders,
      responseType: 'text',
      timeout: 15000,
      validateStatus: () => true,
    });

    // Step 4: Update context
    context.responseHeaders = normalizeHeaders(resp.headers);
    context.responseBody =
      typeof resp.data === 'string' ? resp.data : JSON.stringify(resp.data);

    // Step 5: Parse signed/encrypted response
    const businessJson = await this.proto.parseResponse(context);
    return JSON.parse(businessJson);
  }

  async callInitialize(bizContent: object) {
    return this.call('v1.zoloz.realid.initialize', bizContent);
  }

  async callCheckResult(bizContent: object) {
    return this.call('v1.zoloz.realid.checkresult', bizContent);
  }

  private async call(apiName: string, bizContent: object) {
    const context: OpenApiContext = {
      apiName,
      requestHeaders: {},
      responseHeaders: {},
      requestBody: '',
      responseBody: '',
    };

    try {
      await this.proto.buildRequest(context, JSON.stringify(bizContent));
    } catch (e: any) {
      this.logger.error(
        `buildRequest failed for ${apiName}: ${e?.message}`,
        e?.stack,
      );
      return {
        phase: 'buildRequest',
        status: 422,
        data: {
          error: 'BuildRequestFailed',
          message: e?.message ?? 'Failed to prepare request (sign/encrypt).',
        },
      };
    }

    const url = `${process.env.ZOLOZ_HOST}/api/${apiName.replace(/\./g, '/')}`;
    this.logger.debug(`POST ${url}`, JSON.stringify(context.requestHeaders));

    try {
      const resp = await axios.post(url, context.requestBody, {
        headers: context.requestHeaders,
        responseType: 'text',
        timeout: 15000,
        validateStatus: () => true,
      });

      this.logger.debug(`Response ${resp.status}`, resp.data);

      context.responseHeaders = normalizeHeaders(resp.headers);
      context.responseBody =
        typeof resp.data === 'string' ? resp.data : JSON.stringify(resp.data);

      const businessJson = await this.proto.parseResponse(context);

      if (resp.status >= 200 && resp.status < 300) {
        return JSON.parse(businessJson);
      }

      return {
        phase: 'http',
        status: resp.status,
        data: JSON.parse(businessJson),
        headers: context.responseHeaders,
      };
    } catch (err) {
      if (isAxiosError(err)) {
        const ax = err as any; // old AxiosError shape
        if (ax.response) {
          return { status: ax.response.status, data: ax.response.data };
        }
        if (ax.request) {
          return {
            status: 504,
            data: { error: 'GatewayTimeout', message: ax.message },
          };
        }
        return {
          status: 500,
          data: { error: 'AxiosError', message: ax.message },
        };
      }

      this.logger.error(
        `parseResponse/unexpected error for ${apiName}: ${String(err)}`,
      );
      return {
        phase: 'parseResponse',
        status: 502,
        data: {
          error: 'UpstreamParseFailed',
          message: (err as any)?.message ?? String(err),
        },
      };
    }
  }
}
