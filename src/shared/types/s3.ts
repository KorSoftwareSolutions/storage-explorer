export type S3ConnectionProfile = {
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle: boolean;
};

export type SavedProfile = S3ConnectionProfile & {
  id: string;
  name: string;
};

export type EditableProfile = Omit<SavedProfile, "id">;

export type BucketItem = {
  name: string;
  creationDate: string | null;
};

export type ObjectFile = {
  key: string;
  size: number;
  lastModified: string | null;
  eTag: string | null;
  storageClass: string | null;
};

export type ObjectsPayload = {
  bucket: string;
  prefix: string;
  folders: string[];
  files: ObjectFile[];
  isTruncated: boolean;
  nextContinuationToken: string | null;
};

export type TestConnectionPayload = {
  connected: boolean;
  limitedPermissions?: boolean;
  message: string;
};
