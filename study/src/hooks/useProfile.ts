import { useState, useEffect } from 'react';
import { getUserProfile, updateStudyTime } from '../api/client';
import type { UserInfo } from '../types/index.ts'; // Renamed UserInfo to Profile

interface UseProfileResult {
  userInfo: UserInfo | null;
  loading: boolean;
  error: string | null;
  addStudyMinutes: (minutes: number) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

export const useProfile = (): UseProfileResult => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUserProfile();
      setUserInfo(data);
    } catch (err) {
      console.error("Failed to fetch user profile:", err);
      setError("Failed to load user profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const addStudyMinutes = async (minutes: number) => {
    setError(null);
    try {
      const request: UpdateStudyTimeRequest = { minutes_to_add: minutes };
      const response = await updateStudyTime(request);
      if (userInfo) {
        setUserInfo({ ...userInfo, total_study_minutes: response.total_study_minutes });
      }
    } catch (err) {
      console.error("Failed to update study time:", err);
      setError("Failed to update study time. Please try again.");
    }
  };

  const refreshUserProfile = async () => {
    await fetchUserProfile();
  };

  return {
    userInfo,
    loading,
    error,
    addStudyMinutes,
    refreshUserProfile,
  };
}; 