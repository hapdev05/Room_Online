import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Share2,
  Link2,
  Mail,
  Copy,
  Check,
  X,
  MessageSquare,
  Eye,
  MousePointer,
  UserPlus,
  Settings,
  Facebook,
  Twitter,
  Send,
  ExternalLink,
  Trash2,
} from "lucide-react"
import { useShareSystem } from "../hooks/useShareSystem"
import type { User } from "../types/user"

interface ShareModalProps {
  room: any
  user: User
  isOpen: boolean
  onClose: () => void
}

export default function ShareModal({ room, user, isOpen, onClose }: ShareModalProps) {
  const { 
    shareLinks, 
    shareStats, 
    loading, 
    generateShareLink, 
    createInvitation, 
    getSocialShareData,
    deactivateShareLink 
  } = useShareSystem(room?.id || room?.roomCode, user.id)
  
  const [activeTab, setActiveTab] = useState<'link' | 'invite' | 'stats'>('link')
  const [shareLink, setShareLink] = useState<any>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteMessage, setInviteMessage] = useState('')
  const [copied, setCopied] = useState(false)

  const handleGenerateLink = async () => {
    try {
      const link = await generateShareLink({
        expiryHours: 24,
        maxUses: 50,
        title: `Join ${room.roomName}`,
        description: `${user.name} invited you to join the meeting`
      })
      setShareLink(link)
    } catch (error) {
      console.error('Error generating share link:', error)
    }
  }

  const handleSocialShare = async (platform: string) => {
    if (!shareLink) return
    
    try {
      const socialData = await getSocialShareData(shareLink.shareToken, platform)
      
      let url = ''
      switch (platform) {
        case 'whatsapp':
          url = socialData.whatsappUrl || ''
          break
        case 'twitter':
          url = socialData.twitterUrl || ''
          break
        case 'facebook':
          url = socialData.facebookUrl || ''
          break
        case 'email':
          url = socialData.emailUrl || ''
          break
      }
      
      if (url) {
        window.open(url, '_blank')
      }
    } catch (error) {
      console.error('Error sharing:', error)
    }
  }

  const handleInviteByEmail = async () => {
    if (!inviteEmail.trim()) return
    
    try {
      await createInvitation(
        inviteEmail.trim(), 
        inviteMessage.trim() || `Join us in ${room.roomName}!`
      )
      setInviteEmail('')
      setInviteMessage('')
      
      // Show success feedback
      alert('Invitation sent successfully!')
    } catch (error) {
      console.error('Error sending invitation:', error)
      alert('Error sending invitation')
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handleDeactivateLink = async (shareToken: string) => {
    if (confirm('Deactivate this share link? It will no longer work.')) {
      try {
        await deactivateShareLink(shareToken)
      } catch (error) {
        console.error('Error deactivating link:', error)
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-blue-600" />
            Share {room?.roomName || 'Room'}
          </DialogTitle>
          <DialogDescription>
            Invite others to join your meeting room
          </DialogDescription>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'link'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('link')}
          >
            <Link2 className="w-4 h-4 mr-2 inline" />
            Share Link
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'invite'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('invite')}
          >
            <Mail className="w-4 h-4 mr-2 inline" />
            Email Invite
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'stats'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('stats')}
          >
            <Eye className="w-4 h-4 mr-2 inline" />
            Statistics
          </button>
        </div>

        <div className="mt-6">
          {/* Share Link Tab */}
          {activeTab === 'link' && (
            <div className="space-y-6">
              {!shareLink ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Link2 className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Generate Share Link</h3>
                  <p className="text-gray-600 mb-6">Create a shareable link for your room</p>
                  <Button 
                    onClick={handleGenerateLink} 
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? (
                      <>
                        <Settings className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Link2 className="w-4 h-4 mr-2" />
                        Generate Link
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Generated Link */}
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-gray-900">Share Link Generated</h3>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Active
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          value={shareLink.shareUrl}
                          readOnly
                          className="bg-white border-green-300 text-sm"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(shareLink.shareUrl)}
                          className="border-green-300"
                        >
                          {copied ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Social Share Buttons */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Share on Social Media</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        onClick={() => handleSocialShare('whatsapp')}
                        className="justify-start bg-green-50 border-green-200 hover:bg-green-100"
                      >
                        <MessageSquare className="w-4 h-4 mr-2 text-green-600" />
                        WhatsApp
                        <ExternalLink className="w-3 h-3 ml-auto text-gray-400" />
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleSocialShare('twitter')}
                        className="justify-start bg-blue-50 border-blue-200 hover:bg-blue-100"
                      >
                        <Twitter className="w-4 h-4 mr-2 text-blue-600" />
                        Twitter
                        <ExternalLink className="w-3 h-3 ml-auto text-gray-400" />
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleSocialShare('facebook')}
                        className="justify-start bg-blue-50 border-blue-200 hover:bg-blue-100"
                      >
                        <Facebook className="w-4 h-4 mr-2 text-blue-600" />
                        Facebook
                        <ExternalLink className="w-3 h-3 ml-auto text-gray-400" />
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleSocialShare('email')}
                        className="justify-start bg-gray-50 border-gray-200 hover:bg-gray-100"
                      >
                        <Mail className="w-4 h-4 mr-2 text-gray-600" />
                        Email
                        <ExternalLink className="w-3 h-3 ml-auto text-gray-400" />
                      </Button>
                    </div>
                  </div>

                  {/* Link Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <Eye className="w-5 h-5 text-gray-600 mx-auto mb-1" />
                      <div className="text-lg font-semibold text-gray-900">{shareLink.views}</div>
                      <div className="text-xs text-gray-600">Views</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <MousePointer className="w-5 h-5 text-gray-600 mx-auto mb-1" />
                      <div className="text-lg font-semibold text-gray-900">{shareLink.clicks}</div>
                      <div className="text-xs text-gray-600">Clicks</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <UserPlus className="w-5 h-5 text-gray-600 mx-auto mb-1" />
                      <div className="text-lg font-semibold text-gray-900">{shareLink.joins}</div>
                      <div className="text-xs text-gray-600">Joins</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Email Invite Tab */}
          {activeTab === 'invite' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Email Address *
                </label>
                <Input
                  type="email"
                  placeholder="friend@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Personal Message (Optional)
                </label>
                <Input
                  placeholder="Join us for our meeting!"
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  className="w-full"
                />
              </div>

              <Button
                onClick={handleInviteByEmail}
                disabled={!inviteEmail.trim() || loading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <Settings className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Invitation
                  </>
                )}
              </Button>

              <div className="text-xs text-gray-500 text-center">
                The recipient will receive an email with a link to join the room
              </div>
            </div>
          )}

          {/* Statistics Tab */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              {shareStats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Share2 className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <div className="text-xl font-semibold text-gray-900">{shareStats.totalShares}</div>
                    <div className="text-sm text-gray-600">Total Shares</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Eye className="w-6 h-6 text-green-600 mx-auto mb-2" />
                    <div className="text-xl font-semibold text-gray-900">{shareStats.totalViews}</div>
                    <div className="text-sm text-gray-600">Total Views</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <MousePointer className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                    <div className="text-xl font-semibold text-gray-900">{shareStats.totalClicks}</div>
                    <div className="text-sm text-gray-600">Total Clicks</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <UserPlus className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                    <div className="text-xl font-semibold text-gray-900">{shareStats.totalJoins}</div>
                    <div className="text-sm text-gray-600">Total Joins</div>
                  </div>
                </div>
              )}

              {/* Share Links List */}
              {shareLinks.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Share Links</h4>
                  <div className="space-y-3">
                    {shareLinks.map((link) => (
                      <Card key={link.shareToken} className="border">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-gray-900 truncate">
                                  {link.title}
                                </span>
                                <Badge variant={link.isActive ? "secondary" : "destructive"}>
                                  {link.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                              </div>
                              <div className="text-xs text-gray-500">
                                Created {new Date(link.createdAt).toLocaleDateString()}
                              </div>
                              <div className="flex gap-4 mt-2 text-xs text-gray-600">
                                <span>{link.views} views</span>
                                <span>{link.clicks} clicks</span>
                                <span>{link.joins} joins</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(link.shareUrl)}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                              {link.isActive && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeactivateLink(link.shareToken)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 