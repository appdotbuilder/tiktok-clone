import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { trpc } from '@/utils/trpc';
// Using type-only imports
import type { User, VideoFeedItem } from '../../../server/src/schema';

interface UserProfileProps {
  user: User | null;
  videos: VideoFeedItem[];
  onUpdateProfile: (updatedUser: User) => void;
}

export function UserProfile({ user, videos, onUpdateProfile }: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    display_name: user?.display_name || '',
    bio: user?.bio || '',
    avatar_url: user?.avatar_url || ''
  });

  const handleSaveProfile = useCallback(async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const updatedUser = await trpc.updateUser.mutate({
        id: user.id,
        display_name: editForm.display_name || null,
        bio: editForm.bio || null,
        avatar_url: editForm.avatar_url || null
      });
      
      onUpdateProfile(updatedUser);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setSaving(false);
    }
  }, [user, editForm, onUpdateProfile]);

  const generateAvatar = useCallback(() => {
    const avatars = [
      'https://via.placeholder.com/100/6366f1/white?text=😎',
      'https://via.placeholder.com/100/8b5cf6/white?text=🎨',
      'https://via.placeholder.com/100/ec4899/white?text=✨',
      'https://via.placeholder.com/100/10b981/white?text=🚀',
      'https://via.placeholder.com/100/f59e0b/white?text=🎭'
    ];
    const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];
    setEditForm((prev) => ({ ...prev, avatar_url: randomAvatar }));
  }, []);

  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const totalViews = videos.reduce((sum: number, video: VideoFeedItem) => sum + video.view_count, 0);
  const totalLikes = videos.reduce((sum: number, video: VideoFeedItem) => sum + video.like_count, 0);

  if (!user) {
    return <div>Loading profile...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            <Avatar className="h-24 w-24 border-2 border-purple-500">
              <AvatarImage src={user.avatar_url || undefined} alt={user.username} />
              <AvatarFallback className="bg-purple-600 text-white text-2xl">
                {(user.display_name || user.username).charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-2">
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-white">
                  {user.display_name || user.username}
                </h1>
                <Dialog open={isEditing} onOpenChange={setIsEditing}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-800">
                      ✏️ Edit Profile
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md">
                    <DialogHeader>
                      <DialogTitle>Edit Profile</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-display-name">Display Name</Label>
                        <Input
                          id="edit-display-name"
                          value={editForm.display_name}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setEditForm((prev) => ({ ...prev, display_name: e.target.value }))
                          }
                          className="bg-gray-800 border-gray-700"
                          placeholder="Your display name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-bio">Bio</Label>
                        <Textarea
                          id="edit-bio"
                          value={editForm.bio}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                            setEditForm((prev) => ({ ...prev, bio: e.target.value }))
                          }
                          className="bg-gray-800 border-gray-700 resize-none"
                          placeholder="Tell the world about yourself..."
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-avatar">Avatar URL</Label>
                        <div className="flex space-x-2">
                          <Input
                            id="edit-avatar"
                            value={editForm.avatar_url}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setEditForm((prev) => ({ ...prev, avatar_url: e.target.value }))
                            }
                            className="bg-gray-800 border-gray-700"
                            placeholder="https://example.com/avatar.jpg"
                          />
                          <Button type="button" variant="outline" onClick={generateAvatar} size="sm">
                            🎨
                          </Button>
                        </div>
                        {editForm.avatar_url && (
                          <img
                            src={editForm.avatar_url}
                            alt="Avatar preview"
                            className="w-12 h-12 rounded-full border border-gray-700"
                          />
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={handleSaveProfile}
                          disabled={isSaving}
                          className="flex-1 bg-purple-600 hover:bg-purple-700"
                        >
                          {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setIsEditing(false)}
                          className="border-gray-600 text-gray-300 hover:bg-gray-800"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              <p className="text-gray-400">@{user.username}</p>
              
              {user.bio && (
                <p className="text-gray-300 max-w-md leading-relaxed">
                  {user.bio}
                </p>
              )}

              <div className="flex items-center space-x-4 text-sm">
                <span className="text-gray-400">
                  📅 Joined {user.created_at.toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-purple-900/20 border-purple-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">{videos.length}</div>
            <div className="text-xs text-gray-400">Videos</div>
          </CardContent>
        </Card>
        <Card className="bg-blue-900/20 border-blue-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{formatCount(totalViews)}</div>
            <div className="text-xs text-gray-400">Total Views</div>
          </CardContent>
        </Card>
        <Card className="bg-red-900/20 border-red-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-400">{formatCount(totalLikes)}</div>
            <div className="text-xs text-gray-400">Total Likes</div>
          </CardContent>
        </Card>
        <Card className="bg-green-900/20 border-green-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-400">
              {videos.length > 0 ? Math.round(totalViews / videos.length) : 0}
            </div>
            <div className="text-xs text-gray-400">Avg Views</div>
          </CardContent>
        </Card>
      </div>

      {/* Videos */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>🎬</span>
            <span>My Videos ({videos.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {videos.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎭</div>
              <p className="text-gray-400 text-lg mb-2">No videos uploaded yet</p>
              <p className="text-gray-500 text-sm">Start creating content to build your profile!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.map((video: VideoFeedItem) => (
                <Card key={video.id} className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors">
                  <div className="relative aspect-[9/16] bg-gray-700 rounded-t-lg overflow-hidden">
                    {video.thumbnail_url ? (
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">
                        🎬
                      </div>
                    )}
                    <div className="absolute bottom-2 right-2">
                      <Badge variant="secondary" className="bg-black/70 text-white text-xs">
                        {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-medium text-sm text-white mb-1 line-clamp-2">
                      {video.title}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center space-x-2">
                        <span>👁️ {formatCount(video.view_count)}</span>
                        <span>❤️ {formatCount(video.like_count)}</span>
                      </div>
                      <span>{video.created_at.toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}