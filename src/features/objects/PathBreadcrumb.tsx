type PathBreadcrumbProps = {
  bucket: string;
  prefix: string;
  loading: boolean;
  onNavigatePrefix: (prefix: string) => void;
};

export function PathBreadcrumb(props: PathBreadcrumbProps) {
  const { bucket, prefix, loading, onNavigatePrefix } = props;

  if (!bucket) {
    return (
      <div className="path-breadcrumb muted">
        <span>Bucket path will appear here.</span>
      </div>
    );
  }

  const segments = prefix.split("/").filter(Boolean);

  return (
    <div className="path-breadcrumb">
      <button
        type="button"
        className="breadcrumb-link"
        onClick={() => onNavigatePrefix("")}
        disabled={loading}
      >
        {bucket}
      </button>

      {segments.map((segment, index) => {
        const targetPrefix = `${segments.slice(0, index + 1).join("/")}/`;
        return (
          <span key={targetPrefix} className="breadcrumb-segment">
            <span className="breadcrumb-separator">/</span>
            <button
              type="button"
              className="breadcrumb-link"
              onClick={() => onNavigatePrefix(targetPrefix)}
              disabled={loading}
            >
              {segment}
            </button>
          </span>
        );
      })}
    </div>
  );
}
