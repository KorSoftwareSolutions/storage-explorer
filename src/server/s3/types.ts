export type S3ProfileInput = {
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle: boolean;
};

export type ParsedListObjectsInput = {
  profile: S3ProfileInput;
  bucket: string;
  prefix?: string;
  continuationToken?: string;
  maxKeys: number;
};

export type ParsedDownloadInput = {
  profile: S3ProfileInput;
  bucket: string;
  key: string;
};
