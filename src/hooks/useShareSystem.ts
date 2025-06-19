import { useState, useEffect } from 'react';
import api from '../services/api';

interface ShareLink {
  shareToken: string;
  shareUrl: string;
  title: string;
  description: string;
  views: number;
  clicks: number;
  joins: number;
  expiryHours: number;
  maxUses: number;
  isActive: boolean;
  createdAt: string;
}

interface Invitation {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toUserEmail: string;
  message: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

interface ShareStats {
  totalShares: number;
  totalViews: number;
  totalClicks: number;
  totalJoins: number;
  activeLinks: number;
}

interface SocialShareData {
  whatsappUrl?: string;
  twitterUrl?: string;
  facebookUrl?: string;
  emailUrl?: string;
}

export const useShareSystem = (roomId: string | null, userId: string) => {
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [shareStats, setShareStats] = useState<ShareStats | null>(null);
  const [loading, setLoading] = useState(false);

  // Generate share link
  const generateShareLink = async (options: {
    expiryHours?: number;
    maxUses?: number;
    title?: string;
    description?: string;
  } = {}): Promise<ShareLink> => {
    setLoading(true);
    try {
      console.log('🚀 Generating share link via server API...');
      
      const response = await api.post(`/api/share/rooms/${roomId}/links`, {
        userId,
        ...options
      });
      
      const newLink = response.data.data || response.data;
      setShareLinks(prev => [newLink, ...prev]);
      
      console.log('✅ Share link generated:', newLink.shareUrl);
      return newLink;
    } catch (error) {
      console.error('❌ Error generating share link:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Create invitation
  const createInvitation = async (toUserEmail: string, message: string = ''): Promise<Invitation> => {
    setLoading(true);
    try {
      console.log('🚀 Creating invitation via server API...');
      
      const response = await api.post(`/api/share/rooms/${roomId}/invitations`, {
        fromUserId: userId,
        toUserEmail,
        message
      });
      
      const newInvitation = response.data.data || response.data;
      setInvitations(prev => [newInvitation, ...prev]);
      
      console.log('✅ Invitation created for:', toUserEmail);
      return newInvitation;
    } catch (error) {
      console.error('❌ Error creating invitation:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Get social share data
  const getSocialShareData = async (shareToken: string, platform: string): Promise<SocialShareData> => {
    try {
      console.log('🚀 Getting social share data via server API...');
      
      const response = await api.get(`/api/share/links/${shareToken}/social`, {
        params: { platform }
      });
      
      console.log('✅ Social share data retrieved');
      return response.data.data || response.data;
    } catch (error) {
      console.error('❌ Error getting social share data:', error);
      throw error;
    }
  };

  // Update share link stats
  const updateShareLinkStats = async (shareToken: string, type: 'views' | 'clicks' | 'joins'): Promise<void> => {
    try {
      console.log(`🚀 Updating share link stats: ${type}`);
      
      await api.post(`/api/share/links/${shareToken}/stats`, {
        type,
        userId
      });
      
      console.log('✅ Share link stats updated');
      
      // Refresh local data
      await loadShareStats();
    } catch (error) {
      console.error('❌ Error updating share link stats:', error);
    }
  };

  // Load share statistics
  const loadShareStats = async (): Promise<void> => {
    try {
      console.log('🚀 Loading share statistics from server...');
      
      const response = await api.get(`/api/share/rooms/${roomId}/stats`, {
        params: { userId }
      });
      
      setShareStats(response.data.data || response.data);
      console.log('✅ Share statistics loaded');
    } catch (error) {
      console.error('❌ Error loading share stats:', error);
    }
  };

  // Deactivate share link
  const deactivateShareLink = async (shareToken: string): Promise<void> => {
    try {
      console.log('🚀 Deactivating share link...');
      
      await api.delete(`/api/share/links/${shareToken}`, {
        data: { userId }
      });
      
      setShareLinks(prev => 
        prev.map(link => 
          link.shareToken === shareToken 
            ? { ...link, isActive: false }
            : link
        )
      );

      console.log('✅ Share link deactivated:', shareToken);
    } catch (error) {
      console.error('❌ Error deactivating share link:', error);
      throw error;
    }
  };

  // Load existing data from server
  const loadExistingData = async (): Promise<void> => {
    if (!roomId) return;

    try {
      console.log('🚀 Loading existing share data from server...');
      
      // Load share links
      const shareResponse = await api.get(`/api/share/rooms/${roomId}/links`, {
        params: { userId }
      });
      setShareLinks(shareResponse.data.data || shareResponse.data || []);

      // Load invitations
      const inviteResponse = await api.get(`/api/share/rooms/${roomId}/invitations`, {
        params: { userId }
      });
      setInvitations(inviteResponse.data.data || inviteResponse.data || []);
      
      console.log('✅ Existing share data loaded');
    } catch (error) {
      console.error('❌ Error loading existing share data:', error);
      // Set empty arrays on error
      setShareLinks([]);
      setInvitations([]);
    }
  };

  // Load data on mount
  useEffect(() => {
    if (roomId && userId) {
      loadExistingData();
      loadShareStats();
    }
  }, [roomId, userId]);

  return {
    shareLinks,
    invitations,
    shareStats,
    loading,
    generateShareLink,
    createInvitation,
    getSocialShareData,
    loadShareStats,
    deactivateShareLink,
    updateShareLinkStats
  };
}; 