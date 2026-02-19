import "./index.css";
import { useEffect, useState, type FormEvent } from "react";
import { BucketPanel } from "./features/buckets/BucketPanel";
import { ObjectExplorer } from "./features/objects/ObjectExplorer";
import { ProfileSidebar } from "./features/profiles/ProfileSidebar";
import { downloadObject, listBuckets, listObjects, testConnection } from "./shared/api/s3Api";
import { useProfilesStorage } from "./shared/hooks/useProfilesStorage";
import type {
  BucketItem,
  EditableProfile,
  ObjectsPayload,
  S3ConnectionProfile,
  SavedProfile,
} from "./shared/types/s3";

const DEFAULT_MAX_KEYS = 200;

const emptyProfile: EditableProfile = {
  name: "",
  endpoint: "",
  region: "us-east-1",
  accessKeyId: "",
  secretAccessKey: "",
  forcePathStyle: true,
};

function toEditable(profile: SavedProfile): EditableProfile {
  return {
    name: profile.name,
    endpoint: profile.endpoint,
    region: profile.region,
    accessKeyId: profile.accessKeyId,
    secretAccessKey: profile.secretAccessKey,
    forcePathStyle: profile.forcePathStyle,
  };
}

function deriveName(endpoint: string): string {
  try {
    const normalized = endpoint.startsWith("http") ? endpoint : `https://${endpoint}`;
    const host = new URL(normalized).host;
    return host || endpoint;
  } catch {
    return endpoint;
  }
}

export function App() {
  const {
    profiles,
    selectedProfileId,
    selectedProfile,
    setSelectedProfileId,
    saveProfile,
    deleteProfile,
    updateProfileView,
    getProfileView,
  } = useProfilesStorage();

  const [form, setForm] = useState<EditableProfile>(emptyProfile);
  const [showSecret, setShowSecret] = useState(false);

  const [statusMessage, setStatusMessage] = useState("");
  const [statusError, setStatusError] = useState("");

  const [testingConnection, setTestingConnection] = useState(false);
  const [loadingBuckets, setLoadingBuckets] = useState(false);
  const [loadingObjects, setLoadingObjects] = useState(false);

  const [buckets, setBuckets] = useState<BucketItem[]>([]);
  const [manualBucketName, setManualBucketName] = useState("");
  const [selectedBucket, setSelectedBucket] = useState("");
  const [prefix, setPrefix] = useState("");
  const [objects, setObjects] = useState<ObjectsPayload | null>(null);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [isNextPage, setIsNextPage] = useState(false);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedProfile) {
      setForm(emptyProfile);
      setManualBucketName("");
      setSelectedBucket("");
      setPrefix("");
      setObjects(null);
      setNextToken(null);
      setIsNextPage(false);
      return;
    }

    const profileView = getProfileView(selectedProfile.id);
    setForm(toEditable(selectedProfile));
    setManualBucketName(profileView.manualBucketName || profileView.bucket);
    setSelectedBucket(profileView.bucket);
    setPrefix(profileView.prefix);
    setObjects(null);
    setNextToken(null);
    setIsNextPage(false);
  }, [selectedProfileId, selectedProfile]);

  const profileValid =
    Boolean(form.endpoint.trim()) &&
    Boolean(form.accessKeyId.trim()) &&
    Boolean(form.secretAccessKey.trim());

  const profilePayload = (value: EditableProfile = form): S3ConnectionProfile => ({
    endpoint: value.endpoint.trim(),
    region: value.region.trim() || "us-east-1",
    accessKeyId: value.accessKeyId.trim(),
    secretAccessKey: value.secretAccessKey.trim(),
    forcePathStyle: value.forcePathStyle,
  });

  const onFormChange = <K extends keyof EditableProfile>(field: K, value: EditableProfile[K]) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const onCreateNewProfile = () => {
    setSelectedProfileId(null);
    setForm(emptyProfile);
    setShowSecret(false);
    setStatusMessage("");
    setStatusError("");
    setBuckets([]);
    setManualBucketName("");
    setSelectedBucket("");
    setPrefix("");
    setObjects(null);
    setNextToken(null);
    setIsNextPage(false);
  };

  const onSelectProfile = (profile: SavedProfile) => {
    setSelectedProfileId(profile.id);
    setStatusMessage("");
    setStatusError("");
  };

  const onSaveProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!profileValid) {
      setStatusError("Endpoint, access key ID, and secret key are required.");
      setStatusMessage("");
      return;
    }

    const normalized: SavedProfile = {
      id: selectedProfile?.id ?? crypto.randomUUID(),
      name: form.name.trim() || deriveName(form.endpoint.trim()),
      ...profilePayload(form),
    };

    saveProfile(normalized);
    setSelectedProfileId(normalized.id);
    setStatusError("");
    setStatusMessage(selectedProfile ? "Profile updated." : "Profile saved.");
  };

  const onDeleteProfile = (profileId: string) => {
    deleteProfile(profileId);

    if (selectedProfileId === profileId) {
      setForm(emptyProfile);
      setManualBucketName("");
      setSelectedBucket("");
      setPrefix("");
      setObjects(null);
      setNextToken(null);
      setIsNextPage(false);
    }

    setStatusMessage("Profile deleted.");
    setStatusError("");
  };

  const onTestConnection = async () => {
    if (!profileValid) {
      setStatusError("Fill in endpoint, access key ID, and secret key first.");
      setStatusMessage("");
      return;
    }

    setTestingConnection(true);
    setStatusError("");
    setStatusMessage("");

    try {
      const result = await testConnection(profilePayload());
      setStatusMessage(result.message || "Connection successful.");
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : "Connection failed.");
    } finally {
      setTestingConnection(false);
    }
  };

  const onLoadBuckets = async () => {
    if (!profileValid) {
      setStatusError("Fill in endpoint, access key ID, and secret key first.");
      setStatusMessage("");
      return;
    }

    setLoadingBuckets(true);
    setStatusError("");

    try {
      const result = await listBuckets(profilePayload());
      setBuckets(result.buckets.filter(bucket => Boolean(bucket.name)));
      setStatusMessage(`Loaded ${result.buckets.length} bucket(s).`);
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : "Failed to load buckets.");
      setStatusMessage("");
    } finally {
      setLoadingBuckets(false);
    }
  };

  const loadObjects = async (options: {
    bucket: string;
    targetPrefix?: string;
    continuationToken?: string | null;
    profileOverride?: EditableProfile;
  }) => {
    const { bucket, targetPrefix = "", continuationToken = null, profileOverride } = options;

    setLoadingObjects(true);
    setStatusError("");

    try {
      const data = await listObjects({
        profile: profilePayload(profileOverride ?? form),
        bucket,
        prefix: targetPrefix,
        continuationToken,
        maxKeys: DEFAULT_MAX_KEYS,
      });

      setSelectedBucket(bucket);
      setPrefix(targetPrefix);
      setObjects(data);
      setNextToken(data.nextContinuationToken);
      setIsNextPage(Boolean(continuationToken));
      setStatusMessage(`Loaded ${data.folders.length + data.files.length} item(s) from ${bucket}.`);

      if (selectedProfileId) {
        updateProfileView(selectedProfileId, {
          bucket,
          prefix: targetPrefix,
          manualBucketName: manualBucketName.trim() || bucket,
        });
      }
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : "Failed to load objects.");
      setStatusMessage("");
    } finally {
      setLoadingObjects(false);
    }
  };

  const onOpenBucket = async (bucket: string) => {
    setManualBucketName(bucket);
    await loadObjects({ bucket, targetPrefix: "", continuationToken: null });
  };

  const onOpenManualBucket = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!profileValid) {
      setStatusError("Fill in endpoint, access key ID, and secret key first.");
      setStatusMessage("");
      return;
    }

    const bucket = manualBucketName.trim();
    if (!bucket) {
      setStatusError("Enter a bucket name to open.");
      setStatusMessage("");
      return;
    }

    await onOpenBucket(bucket);
  };

  const onOpenFolder = async (folderPrefix: string) => {
    if (!selectedBucket) {
      return;
    }

    await loadObjects({ bucket: selectedBucket, targetPrefix: folderPrefix, continuationToken: null });
  };

  const onUpOneLevel = async () => {
    if (!selectedBucket) {
      return;
    }

    if (!prefix) {
      await loadObjects({ bucket: selectedBucket, targetPrefix: "", continuationToken: null });
      return;
    }

    const trimmed = prefix.replace(/\/$/, "");
    const segments = trimmed.split("/").filter(Boolean);
    const parentPrefix = segments.length > 1 ? `${segments.slice(0, -1).join("/")}/` : "";

    await loadObjects({ bucket: selectedBucket, targetPrefix: parentPrefix, continuationToken: null });
  };

  const onNavigatePrefix = async (targetPrefix: string) => {
    if (!selectedBucket) {
      return;
    }

    await loadObjects({ bucket: selectedBucket, targetPrefix, continuationToken: null });
  };

  const onLoadNextPage = async () => {
    if (!selectedBucket || !nextToken) {
      return;
    }

    await loadObjects({
      bucket: selectedBucket,
      targetPrefix: prefix,
      continuationToken: nextToken,
    });
  };

  const onLoadFirstPage = async () => {
    if (!selectedBucket) {
      return;
    }

    await loadObjects({ bucket: selectedBucket, targetPrefix: prefix, continuationToken: null });
  };

  const onDownloadFile = async (key: string) => {
    if (!selectedBucket || !profileValid) {
      return;
    }

    setDownloadingKey(key);
    setStatusError("");

    try {
      await downloadObject({
        profile: profilePayload(),
        bucket: selectedBucket,
        key,
      });
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : "Download failed.");
    } finally {
      setDownloadingKey(null);
    }
  };

  return (
    <div className="app-shell">
      <ProfileSidebar
        profiles={profiles}
        selectedProfileId={selectedProfileId}
        isEditingExisting={Boolean(selectedProfile)}
        form={form}
        showSecret={showSecret}
        statusMessage={statusMessage}
        statusError={statusError}
        testingConnection={testingConnection}
        onCreateNewProfile={onCreateNewProfile}
        onSelectProfile={onSelectProfile}
        onDeleteProfile={onDeleteProfile}
        onSaveProfile={onSaveProfile}
        onTestConnection={onTestConnection}
        onToggleSecret={() => setShowSecret(prev => !prev)}
        onFormChange={onFormChange}
      />

      <main className="main-column">
        <BucketPanel
          profileValid={profileValid}
          loadingBuckets={loadingBuckets}
          loadingObjects={loadingObjects}
          buckets={buckets}
          selectedBucket={selectedBucket}
          manualBucketName={manualBucketName}
          onManualBucketNameChange={setManualBucketName}
          onLoadBuckets={onLoadBuckets}
          onOpenBucket={onOpenBucket}
          onOpenManualBucket={onOpenManualBucket}
        />

        <ObjectExplorer
          selectedBucket={selectedBucket}
          prefix={prefix}
          objects={objects}
          loadingObjects={loadingObjects}
          isNextPage={isNextPage}
          nextToken={nextToken}
          onUpOneLevel={onUpOneLevel}
          onLoadFirstPage={onLoadFirstPage}
          onLoadNextPage={onLoadNextPage}
          onOpenFolder={onOpenFolder}
          onNavigatePrefix={onNavigatePrefix}
          onDownloadFile={onDownloadFile}
          downloadingKey={downloadingKey}
        />
      </main>
    </div>
  );
}

export default App;
