import type { FormEvent } from "react";
import type { EditableProfile, SavedProfile } from "../../shared/types/s3";

type ProfileSidebarProps = {
  profiles: SavedProfile[];
  selectedProfileId: string | null;
  isEditingExisting: boolean;
  form: EditableProfile;
  showSecret: boolean;
  statusMessage: string;
  statusError: string;
  testingConnection: boolean;
  onCreateNewProfile: () => void;
  onSelectProfile: (profile: SavedProfile) => void;
  onDeleteProfile: (profileId: string) => void;
  onSaveProfile: (event: FormEvent<HTMLFormElement>) => void;
  onTestConnection: () => void;
  onToggleSecret: () => void;
  onFormChange: <K extends keyof EditableProfile>(field: K, value: EditableProfile[K]) => void;
};

export function ProfileSidebar(props: ProfileSidebarProps) {
  const {
    profiles,
    selectedProfileId,
    isEditingExisting,
    form,
    showSecret,
    statusMessage,
    statusError,
    testingConnection,
    onCreateNewProfile,
    onSelectProfile,
    onDeleteProfile,
    onSaveProfile,
    onTestConnection,
    onToggleSecret,
    onFormChange,
  } = props;

  return (
    <aside className="panel profile-panel">
      <div className="panel-step">Step 1</div>
      <div className="panel-header">
        <h1>Connection Profile</h1>
        <p>Save and reuse credentials in your browser.</p>
      </div>

      <div className="profiles-toolbar">
        <strong>Saved Profiles</strong>
        <button type="button" className="ghost-button" onClick={onCreateNewProfile}>
          New
        </button>
      </div>

      <div className="profiles-list" role="list" aria-label="Saved profiles">
        {profiles.length === 0 && <p className="empty-copy">No saved profiles yet.</p>}
        {profiles.map(profile => (
          <div
            key={profile.id}
            className={`profile-card ${profile.id === selectedProfileId ? "active" : ""}`}
            role="listitem"
          >
            <button type="button" className="profile-select" onClick={() => onSelectProfile(profile)}>
              <span className="profile-name">{profile.name || "Unnamed profile"}</span>
              <span className="profile-endpoint">{profile.endpoint}</span>
            </button>
            <button
              type="button"
              className="delete-button"
              onClick={() => onDeleteProfile(profile.id)}
              aria-label={`Delete ${profile.name || "profile"}`}
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      <form className="profile-form" onSubmit={onSaveProfile}>
        <label>
          Profile Name
          <input
            type="text"
            value={form.name}
            onChange={event => onFormChange("name", event.target.value)}
            placeholder="MinIO dev, staging S3"
          />
        </label>

        <label>
          Endpoint URL *
          <input
            type="url"
            value={form.endpoint}
            onChange={event => onFormChange("endpoint", event.target.value)}
            placeholder="https://s3.amazonaws.com"
            required
          />
        </label>

        <label>
          Region
          <input
            type="text"
            value={form.region}
            onChange={event => onFormChange("region", event.target.value)}
            placeholder="us-east-1"
          />
        </label>

        <label>
          Access Key ID *
          <input
            type="text"
            value={form.accessKeyId}
            onChange={event => onFormChange("accessKeyId", event.target.value)}
            autoComplete="off"
            required
          />
        </label>

        <label>
          Secret Access Key *
          <div className="secret-row">
            <input
              type={showSecret ? "text" : "password"}
              value={form.secretAccessKey}
              onChange={event => onFormChange("secretAccessKey", event.target.value)}
              autoComplete="off"
              required
            />
            <button type="button" className="ghost-button" onClick={onToggleSecret}>
              {showSecret ? "Hide" : "Show"}
            </button>
          </div>
        </label>

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={form.forcePathStyle}
            onChange={event => onFormChange("forcePathStyle", event.target.checked)}
          />
          Force path style
        </label>

        <div className="form-actions">
          <button type="submit" className="primary-button">
            {isEditingExisting ? "Update Profile" : "Save Profile"}
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={onTestConnection}
            disabled={testingConnection}
          >
            {testingConnection ? "Testing..." : "Test Connection"}
          </button>
        </div>
      </form>

      {statusMessage && <p className="status-ok">{statusMessage}</p>}
      {statusError && <p className="status-error">{statusError}</p>}
    </aside>
  );
}
