import type { FormEvent } from "react";
import type { BucketItem } from "../../shared/types/s3";

type BucketPanelProps = {
  profileValid: boolean;
  loadingBuckets: boolean;
  loadingObjects: boolean;
  buckets: BucketItem[];
  selectedBucket: string;
  manualBucketName: string;
  onManualBucketNameChange: (value: string) => void;
  onLoadBuckets: () => void;
  onOpenBucket: (bucket: string) => void;
  onOpenManualBucket: (event: FormEvent<HTMLFormElement>) => void;
};

export function BucketPanel(props: BucketPanelProps) {
  const {
    profileValid,
    loadingBuckets,
    loadingObjects,
    buckets,
    selectedBucket,
    manualBucketName,
    onManualBucketNameChange,
    onLoadBuckets,
    onOpenBucket,
    onOpenManualBucket,
  } = props;

  return (
    <section className="panel explorer-panel">
      <div className="panel-step">Step 2</div>
      <div className="explorer-header">
        <div>
          <h2>Buckets</h2>
          <p>Load visible buckets or open one directly by name.</p>
        </div>
        <button
          type="button"
          className="primary-button"
          onClick={onLoadBuckets}
          disabled={loadingBuckets || !profileValid}
        >
          {loadingBuckets ? "Loading..." : "Load Buckets"}
        </button>
      </div>

      <form className="manual-bucket-form" onSubmit={onOpenManualBucket}>
        <label htmlFor="manual-bucket-input">Known bucket name</label>
        <div className="manual-bucket-row">
          <input
            id="manual-bucket-input"
            type="text"
            value={manualBucketName}
            onChange={event => onManualBucketNameChange(event.target.value)}
            placeholder="my-private-bucket"
            autoComplete="off"
          />
          <button
            type="submit"
            className="secondary-button"
            disabled={loadingObjects || !profileValid}
          >
            Open Bucket
          </button>
        </div>
        <p className="helper-copy">
          Useful when your key can access a bucket but cannot list all buckets.
        </p>
      </form>

      <div className="buckets-grid">
        {buckets.length === 0 ? (
          <p className="empty-copy">No buckets loaded yet.</p>
        ) : (
          buckets.map(bucket => (
            <button
              key={bucket.name}
              type="button"
              className={`bucket-item ${bucket.name === selectedBucket ? "active" : ""}`}
              onClick={() => onOpenBucket(bucket.name)}
              disabled={loadingObjects}
            >
              <span>{bucket.name}</span>
              {bucket.creationDate && <small>{new Date(bucket.creationDate).toLocaleString()}</small>}
            </button>
          ))
        )}
      </div>
    </section>
  );
}
