import {
  deleteFolderHandler,
  deleteObjectHandler,
  downloadObjectHandler,
  listBucketsHandler,
  listObjectsHandler,
  testConnectionHandler,
} from "../s3/handlers";

export const s3Routes = {
  "/api/s3/test-connection": {
    POST: testConnectionHandler,
  },
  "/api/s3/list-buckets": {
    POST: listBucketsHandler,
  },
  "/api/s3/list-objects": {
    POST: listObjectsHandler,
  },
  "/api/s3/download-object": {
    POST: downloadObjectHandler,
  },
  "/api/s3/delete-object": {
    POST: deleteObjectHandler,
  },
  "/api/s3/delete-folder": {
    POST: deleteFolderHandler,
  },
};
