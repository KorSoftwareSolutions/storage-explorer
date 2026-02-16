import { useCallback, useEffect, useMemo, useState } from "react";
import type { SavedProfile } from "../types/s3";

const PROFILES_KEY = "s3-explorer:profiles:v1";
const LAST_PROFILE_KEY = "s3-explorer:last-profile:v1";
const PROFILE_VIEW_KEY = "s3-explorer:profile-view:v1";

export type ProfileViewState = {
  bucket: string;
  prefix: string;
  manualBucketName: string;
};

const emptyView: ProfileViewState = {
  bucket: "",
  prefix: "",
  manualBucketName: "",
};

function parseStoredProfiles(raw: string | null): SavedProfile[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(item => typeof item === "object" && item !== null)
      .map(item => {
        const record = item as Record<string, unknown>;
        return {
          id: String(record.id ?? crypto.randomUUID()),
          name: String(record.name ?? ""),
          endpoint: String(record.endpoint ?? ""),
          region: String(record.region ?? "us-east-1"),
          accessKeyId: String(record.accessKeyId ?? ""),
          secretAccessKey: String(record.secretAccessKey ?? ""),
          forcePathStyle: record.forcePathStyle !== false,
        };
      })
      .filter(profile => profile.endpoint && profile.accessKeyId && profile.secretAccessKey);
  } catch {
    return [];
  }
}

function parseStoredViews(raw: string | null): Record<string, ProfileViewState> {
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) {
      return {};
    }

    const record = parsed as Record<string, unknown>;
    const next: Record<string, ProfileViewState> = {};

    for (const [profileId, value] of Object.entries(record)) {
      if (typeof value !== "object" || value === null) {
        continue;
      }

      const view = value as Record<string, unknown>;
      next[profileId] = {
        bucket: typeof view.bucket === "string" ? view.bucket : "",
        prefix: typeof view.prefix === "string" ? view.prefix : "",
        manualBucketName:
          typeof view.manualBucketName === "string" ? view.manualBucketName : "",
      };
    }

    return next;
  } catch {
    return {};
  }
}

export function useProfilesStorage() {
  const [profiles, setProfiles] = useState<SavedProfile[]>(() =>
    parseStoredProfiles(localStorage.getItem(PROFILES_KEY)),
  );
  const [profileViews, setProfileViews] = useState<Record<string, ProfileViewState>>(() =>
    parseStoredViews(localStorage.getItem(PROFILE_VIEW_KEY)),
  );
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(() => {
    const loadedProfiles = parseStoredProfiles(localStorage.getItem(PROFILES_KEY));
    const storedProfileId = localStorage.getItem(LAST_PROFILE_KEY);
    const fallbackProfile = loadedProfiles[0]?.id ?? null;

    return loadedProfiles.some(profile => profile.id === storedProfileId)
      ? storedProfileId
      : fallbackProfile;
  });

  useEffect(() => {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  }, [profiles]);

  useEffect(() => {
    localStorage.setItem(PROFILE_VIEW_KEY, JSON.stringify(profileViews));
  }, [profileViews]);

  useEffect(() => {
    if (selectedProfileId) {
      localStorage.setItem(LAST_PROFILE_KEY, selectedProfileId);
    } else {
      localStorage.removeItem(LAST_PROFILE_KEY);
    }
  }, [selectedProfileId]);

  const selectedProfile = useMemo(
    () => profiles.find(profile => profile.id === selectedProfileId) ?? null,
    [profiles, selectedProfileId],
  );

  const saveProfile = useCallback((profile: SavedProfile) => {
    setProfiles(prev => {
      const existing = prev.findIndex(entry => entry.id === profile.id);
      if (existing === -1) {
        return [profile, ...prev];
      }

      const next = [...prev];
      next[existing] = profile;
      return next;
    });
  }, []);

  const deleteProfile = useCallback((profileId: string) => {
    setProfiles(prev => prev.filter(profile => profile.id !== profileId));
    setProfileViews(prev => {
      const next = { ...prev };
      delete next[profileId];
      return next;
    });

    setSelectedProfileId(current => (current === profileId ? null : current));
  }, []);

  const updateProfileView = useCallback((profileId: string, patch: Partial<ProfileViewState>) => {
    setProfileViews(prev => ({
      ...prev,
      [profileId]: {
        ...(prev[profileId] ?? emptyView),
        ...patch,
      },
    }));
  }, []);

  const getProfileView = useCallback((profileId: string | null): ProfileViewState => {
    if (!profileId) {
      return emptyView;
    }

    return profileViews[profileId] ?? emptyView;
  }, [profileViews]);

  return {
    profiles,
    selectedProfileId,
    selectedProfile,
    setSelectedProfileId,
    saveProfile,
    deleteProfile,
    updateProfileView,
    getProfileView,
  };
}
