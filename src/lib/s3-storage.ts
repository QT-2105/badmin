import crypto from 'node:crypto';

import { AppError } from '@/lib/app-error';

type S3Config = {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicBaseUrl: string;
};

type UploadInput = {
  key: string;
  body: Buffer;
  contentType: string;
  publicRead?: boolean;
};

function getS3Config(): S3Config {
  const endpoint = process.env.S3_ENDPOINT;
  const region = process.env.S3_REGION;
  const bucket = process.env.S3_BUCKET;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  const publicBaseUrl = process.env.S3_PUBLIC_BASE_URL;

  if (!endpoint || !region || !bucket || !accessKeyId || !secretAccessKey || !publicBaseUrl) {
    throw new AppError('Chưa cấu hình đầy đủ S3/Spaces cho lưu trữ hình ảnh.', 500);
  }

  return {
    endpoint: endpoint.replace(/\/$/, ''),
    region,
    bucket,
    accessKeyId,
    secretAccessKey,
    publicBaseUrl: publicBaseUrl.replace(/\/$/, '')
  };
}

function hmac(key: Buffer | string, value: string): Buffer {
  return crypto.createHmac('sha256', key).update(value).digest();
}

function sha256(value: Buffer | string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function amzDate(date = new Date()): { amzDate: string; dateStamp: string } {
  const iso = date.toISOString().replace(/[:-]|\.\d{3}/g, '');
  return {
    amzDate: iso,
    dateStamp: iso.slice(0, 8)
  };
}

function encodeKey(key: string): string {
  return key.split('/').map(encodeURIComponent).join('/');
}

function encodeQueryValue(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
}

function canonicalQueryString(query: Record<string, string | undefined> = {}): string {
  return Object.entries(query)
    .filter((entry): entry is [string, string] => entry[1] !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${encodeQueryValue(key)}=${encodeQueryValue(value)}`)
    .join('&');
}

function signingKey(secretAccessKey: string, dateStamp: string, region: string): Buffer {
  const kDate = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, 's3');
  return hmac(kService, 'aws4_request');
}

function signedHeaders(input: {
  method: 'PUT' | 'DELETE' | 'GET';
  key: string;
  body?: Buffer;
  contentType?: string;
  publicRead?: boolean;
  query?: Record<string, string | undefined>;
  config: S3Config;
}): { url: string; headers: Headers } {
  const { method, key, body = Buffer.alloc(0), contentType, publicRead, query, config } = input;
  const { amzDate: xAmzDate, dateStamp } = amzDate();
  const host = new URL(config.endpoint).host;
  const encodedKey = encodeKey(key);
  const canonicalUri = encodedKey ? `/${config.bucket}/${encodedKey}` : `/${config.bucket}`;
  const canonicalQuery = canonicalQueryString(query);
  const payloadHash = sha256(body);
  const headers = new Headers({
    host,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': xAmzDate
  });

  if (contentType) {
    headers.set('content-type', contentType);
  }

  if (method === 'PUT' && publicRead) {
    headers.set('x-amz-acl', 'public-read');
  }

  const signedHeaderNames = [...headers.keys()].sort();
  const canonicalHeaders = signedHeaderNames.map((name) => `${name}:${headers.get(name)}`).join('\n');
  const signedHeadersValue = signedHeaderNames.join(';');
  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQuery,
    `${canonicalHeaders}\n`,
    signedHeadersValue,
    payloadHash
  ].join('\n');
  const credentialScope = `${dateStamp}/${config.region}/s3/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    xAmzDate,
    credentialScope,
    sha256(canonicalRequest)
  ].join('\n');
  const signature = crypto
    .createHmac('sha256', signingKey(config.secretAccessKey, dateStamp, config.region))
    .update(stringToSign)
    .digest('hex');

  headers.set(
    'authorization',
    `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeadersValue}, Signature=${signature}`
  );

  return {
    url: `${config.endpoint}${canonicalUri}${canonicalQuery ? `?${canonicalQuery}` : ''}`,
    headers
  };
}

export function publicUrlForS3Key(key: string): string {
  const config = getS3Config();
  return `${config.publicBaseUrl}/${encodeKey(key)}`;
}

export async function uploadS3Object(input: UploadInput): Promise<{ key: string; publicUrl: string }> {
  const config = getS3Config();
  const signed = signedHeaders({
    method: 'PUT',
    key: input.key,
    body: input.body,
    contentType: input.contentType,
    publicRead: input.publicRead ?? true,
    config
  });

  const response = await fetch(signed.url, {
    method: 'PUT',
    headers: signed.headers,
    body: new Uint8Array(input.body)
  });

  if (!response.ok) {
    throw new AppError(`Không thể upload hình ảnh lên S3 (${response.status}).`, 502);
  }

  return {
    key: input.key,
    publicUrl: `${config.publicBaseUrl}/${encodeKey(input.key)}`
  };
}

export async function deleteS3Object(key: string | null | undefined): Promise<void> {
  if (!key) return;

  const config = getS3Config();
  const signed = signedHeaders({
    method: 'DELETE',
    key,
    config
  });

  const response = await fetch(signed.url, {
    method: 'DELETE',
    headers: signed.headers
  });

  if (!response.ok && response.status !== 404) {
    throw new AppError(`Không thể xóa hình ảnh trên S3 (${response.status}).`, 502);
  }
}

function decodeXmlValue(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

export async function listS3ObjectKeysByPrefix(prefix: string): Promise<string[]> {
  const config = getS3Config();
  const keys: string[] = [];
  let continuationToken: string | undefined;

  do {
    const query = {
      'list-type': '2',
      prefix,
      'continuation-token': continuationToken
    };
    const signed = signedHeaders({
      method: 'GET',
      key: '',
      query,
      config
    });
    const response = await fetch(signed.url, {
      method: 'GET',
      headers: signed.headers
    });

    if (!response.ok) {
      throw new AppError(`Không thể đọc danh sách hình ảnh trên S3 (${response.status}).`, 502);
    }

    const xml = await response.text();
    for (const match of xml.matchAll(/<Key>(.*?)<\/Key>/g)) {
      keys.push(decodeXmlValue(match[1]));
    }
    const truncated = /<IsTruncated>true<\/IsTruncated>/i.test(xml);
    const tokenMatch = xml.match(/<NextContinuationToken>(.*?)<\/NextContinuationToken>/);
    continuationToken = truncated && tokenMatch ? decodeXmlValue(tokenMatch[1]) : undefined;
  } while (continuationToken);

  return keys;
}

export function createImageKey(folder: string, fileName: string): string {
  const extension = fileName.toLowerCase().match(/\.(jpe?g|png|webp)$/)?.[0] ?? '.webp';
  return `${folder.replace(/^\/|\/$/g, '')}/${crypto.randomUUID()}${extension}`;
}
