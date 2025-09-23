import { Injectable, Logger } from '@nestjs/common';
import {
  aesDecryptBase64,
  aesEncryptBase64,
  aesGenerateKey,
  rsaOaepDecrypt,
  rsaOaepEncryptBase64,
  rsaSha256SignBase64,
  rsaSha256VerifyBase64,
} from 'src/helper/crypto.helper';
import {
  parseComposedHeaderValue,
  toHeaderMap,
  urlDecode,
} from 'src/helper/http.helper';
import { formatReqTime } from 'src/helper/time.helper';

export interface OpenApiContext {
  apiName: string;
  requestHeaders: Record<string, string>;
  responseHeaders: Record<string, string | string[]>;
  requestBody: string;
  responseBody: string;
}

@Injectable()
export class TwoWayAuthProtocolService {
  private readonly logger = new Logger(TwoWayAuthProtocolService.name);

  constructor(
    private readonly clientId: string,
    private readonly merchantPrivateKeyB64: string,
    private readonly openApiPublicKeyB64: string,
    private readonly encrypt: boolean,
    private readonly verifySign: boolean,
    private readonly aesLength: 128 | 192 | 256 = 256,
  ) {}

  buildSignContentForRequest(
    apiName: string,
    clientId: string,
    reqTime: string,
    reqBody: string,
  ) {
    const path = `/api/${apiName.replace(/\./g, '/')}`;
    return `POST ${path}\n${clientId}.${reqTime}.${reqBody}`;
  }

  private buildSignContentForResponse(
    apiName: string,
    clientId: string,
    respTime: string,
    respBody: string,
  ) {
    const path = `/api/${apiName.replace(/\./g, '/')}`;
    return `POST ${path}\n${clientId}.${respTime}.${respBody}`;
  }

  async buildRequest(context: OpenApiContext, rawReq: string) {
    const headers = context.requestHeaders ?? (context.requestHeaders = {});
    headers['Client-Id'] = this.clientId;

    let reqBody = rawReq;

    if (this.encrypt) {
      headers['Content-Type'] = 'text/plain; charset=UTF-8';
      const aesKey = aesGenerateKey(256); // ensure 256-bit
      const encryptedBody = aesEncryptBase64(aesKey, rawReq);
      reqBody = encryptedBody;

      const wrappedKeyB64 = rsaOaepEncryptBase64(
        this.openApiPublicKeyB64,
        aesKey,
      );
      headers['Encrypt'] =
        `algorithm=RSA_AES, symmetricKey=${encodeURIComponent(wrappedKeyB64)}`;
    } else {
      headers['Content-Type'] = 'application/json; charset=UTF-8';
    }

    const reqTime = formatReqTime(new Date()); // e.g. ...+0800
    context.requestBody = reqBody; // freeze the final body

    const toSign = this.buildSignContentForRequest(
      context.apiName,
      this.clientId,
      reqTime,
      context.requestBody,
    );

    this.logger.debug(
      `TO_SIGN(len=${toSign.length}): ${JSON.stringify(toSign)}`,
    );
    const signatureB64 = rsaSha256SignBase64(
      this.merchantPrivateKeyB64,
      toSign,
    );
    headers['Signature'] =
      `algorithm=RSA256, signature=${encodeURIComponent(signatureB64)}`;
    headers['Request-Time'] = reqTime;
  }

  async parseResponse(context: OpenApiContext): Promise<string> {
    const headersMap = toHeaderMap(context.responseHeaders || {});
    if (this.verifySign) {
      const sigHeader = headersMap['Signature']?.[0];
      const respTime = headersMap['Response-Time']?.[0];
      if (!sigHeader || !respTime) {
        throw new Error('Missing Signature/Response-Time headers');
      }
      const parsed = parseComposedHeaderValue(sigHeader);
      const signatureB64 = parsed?.signature ? urlDecode(parsed.signature) : '';
      const contentToVerify = this.buildSignContentForResponse(
        context.apiName,
        this.clientId,
        respTime,
        context.responseBody,
      );
      const ok = rsaSha256VerifyBase64(
        this.openApiPublicKeyB64,
        contentToVerify,
        signatureB64,
      );
      if (!ok) throw new Error('signature validation failed');
    }

    let result = context.responseBody;

    if (this.encrypt) {
      const encHeader = headersMap['Encrypt']?.[0];
      if (!encHeader)
        throw new Error('Missing Encrypt header for encrypted response');
      const parsed = parseComposedHeaderValue(encHeader);
      const symKeyEncoded = parsed?.symmetricKey;
      if (!symKeyEncoded)
        throw new Error('Missing symmetricKey in Encrypt header');
      const wrappedKeyB64 = urlDecode(symKeyEncoded);
      const aesKey = rsaOaepDecrypt(this.merchantPrivateKeyB64, wrappedKeyB64);
      result = aesDecryptBase64(aesKey, result);
    }

    return result;
  }
}
