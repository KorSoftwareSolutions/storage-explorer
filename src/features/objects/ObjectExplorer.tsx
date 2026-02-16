import type { ObjectsPayload } from "../../shared/types/s3";
import { PathBreadcrumb } from "./PathBreadcrumb";

type ObjectExplorerProps = {
  selectedBucket: string;
  prefix: string;
  objects: ObjectsPayload | null;
  loadingObjects: boolean;
  isNextPage: boolean;
  nextToken: string | null;
  onUpOneLevel: () => void;
  onLoadFirstPage: () => void;
  onLoadNextPage: () => void;
  onOpenFolder: (folderPrefix: string) => void;
  onNavigatePrefix: (prefix: string) => void;
};

function formatObjectName(key: string, prefix: string): string {
  if (!prefix) {
    return key;
  }

  return key.startsWith(prefix) ? key.slice(prefix.length) : key;
}

function formatFolderName(prefixValue: string, currentPrefix: string): string {
  const clean = prefixValue.replace(/\/$/, "");
  const withoutCurrent =
    currentPrefix && clean.startsWith(currentPrefix) ? clean.slice(currentPrefix.length) : clean;
  const parts = withoutCurrent.split("/").filter(Boolean);
  return parts.at(-1) ?? clean;
}

export function ObjectExplorer(props: ObjectExplorerProps) {
  const {
    selectedBucket,
    prefix,
    objects,
    loadingObjects,
    isNextPage,
    nextToken,
    onUpOneLevel,
    onLoadFirstPage,
    onLoadNextPage,
    onOpenFolder,
    onNavigatePrefix,
  } = props;

  return (
    <section className="panel object-panel">
      <div className="panel-step">Step 3</div>
      <div className="objects-header">
        <div>
          <h3>Objects</h3>
          <p>Read-only view of folders and files.</p>
        </div>
        <div className="objects-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={onUpOneLevel}
            disabled={!selectedBucket || loadingObjects}
          >
            Up One Level
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={onLoadFirstPage}
            disabled={!selectedBucket || loadingObjects || !isNextPage}
          >
            First Page
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={onLoadNextPage}
            disabled={!nextToken || loadingObjects}
          >
            {loadingObjects ? "Loading..." : "Next Page"}
          </button>
        </div>
      </div>

      <PathBreadcrumb
        bucket={selectedBucket}
        prefix={prefix}
        loading={loadingObjects}
        onNavigatePrefix={onNavigatePrefix}
      />

      <div className="objects-list">
        {!objects && <p className="empty-copy">Open a bucket to browse objects.</p>}

        {objects && (
          <>
            {objects.folders.length === 0 && objects.files.length === 0 && (
              <p className="empty-copy">This path is empty.</p>
            )}

            {objects.folders.map(folder => (
              <button
                key={folder}
                type="button"
                className="object-row folder"
                onClick={() => onOpenFolder(folder)}
                disabled={loadingObjects}
              >
                <span className="object-name">{formatFolderName(folder, prefix)}/</span>
                <span className="object-meta">folder</span>
                <span className="object-meta">-</span>
              </button>
            ))}

            {objects.files.map(file => (
              <div key={file.key} className="object-row">
                <span className="object-name">{formatObjectName(file.key, prefix)}</span>
                <span className="object-meta">{file.size.toLocaleString()} bytes</span>
                <span className="object-meta">
                  {file.lastModified ? new Date(file.lastModified).toLocaleString() : "-"}
                </span>
              </div>
            ))}
          </>
        )}
      </div>
    </section>
  );
}
