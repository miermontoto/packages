import { __MetadataBearer } from '@aws-sdk/client-s3';

export const getKeysFromEvent = (event: any): string[] | null => {
  if (!event.Records || !Array.isArray(event.Records)) {
    return null;
  }

  try {
    return event.Records.map((record: any) => record.s3?.object?.key).filter((key: any) => key);
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const getKeyFromEvent = (event: any): string | null => {
  const keys = getKeysFromEvent(event);
  return keys?.[0] ?? null;
};

export const wasSuccessful = (output: __MetadataBearer): boolean => {
  return (
    output.$metadata.httpStatusCode !== undefined &&
    typeof output.$metadata.httpStatusCode === 'number' &&
    output.$metadata.httpStatusCode >= 200 &&
    output.$metadata.httpStatusCode < 300
  );
};
