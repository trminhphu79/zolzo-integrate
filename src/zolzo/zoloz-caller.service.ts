// src/zoloz/zoloz-caller.service.ts
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import {
  TwoWayAuthProtocolService,
  OpenApiContext,
} from './two-way-auth.protocol';
import { normalizeHeaders } from 'src/helper/http.helper';

@Injectable()
export class ZolozCallerService {
  constructor(private proto: TwoWayAuthProtocolService) {}

  async callInitialize(bizContent: object) {
    const apiName = 'v1.zoloz.realid.initialize';
    const context: OpenApiContext = {
      apiName,
      requestHeaders: {},
      responseHeaders: {},
      requestBody: '',
      responseBody: '',
    };

    await this.proto.buildRequest(context, JSON.stringify(bizContent));
    const url = `${process.env.ZOLOZ_HOST}/api/${apiName.replace(/\./g, '/')}`;

    const resp = await axios.post(url, context.requestBody, {
      headers: context.requestHeaders,
    });
    context.responseHeaders = resp.headers as Record<string, string | string[]>;
    context.responseBody =
      typeof resp.data === 'string' ? resp.data : JSON.stringify(resp.data);

    const businessJson = await this.proto.parseResponse(context);
    return JSON.parse(businessJson);
  }

  async callCheckResult(bizContent: object) {
    const apiName = 'v1.zoloz.realid.checkresult';
    const context: OpenApiContext = {
      apiName,
      requestHeaders: {},
      responseHeaders: {},
      requestBody: '',
      responseBody: '',
    };

    await this.proto.buildRequest(context, JSON.stringify(bizContent));

    const url = `${process.env.ZOLOZ_HOST}/api/${apiName.replace(/\./g, '/')}`;
    const resp = await axios.post(url, context.requestBody, {
      headers: context.requestHeaders,
      responseType: 'text',
      timeout: 15000,
      validateStatus: () => true,
    });

    context.responseHeaders = normalizeHeaders(resp.headers);
    context.responseBody =
      typeof resp.data === 'string' ? resp.data : JSON.stringify(resp.data);

    const businessJson = await this.proto.parseResponse(context);
    return JSON.parse(businessJson);
  }
}
