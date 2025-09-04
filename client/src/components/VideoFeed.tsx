import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
// Using type-only import
import type { VideoFeedItem } from '../../../server/src/schema';

interface VideoFeedProps {
  videos: VideoFeedItem[];
  currentUserId: number;
}

export function VideoFeed({ videos }: VideoFeedProps) {
  const [likedVideos, setLikedVideos] = useState<Set<number>>(new Set());

  const handleLike = useCallback((videoId: number) => {
    setLikedVideos((prev: Set<number>) => {
      const newLikes = new Set(prev);
      if (newLikes.has(videoId)) {
        newLikes.delete(videoId);
      } else {
        newLikes.add(videoId);
      }
      return newLikes;
    });
  }, []);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  if (videos.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🎬</div>
        <p className="text-gray-400 text-lg mb-2">No videos in feed yet</p>
        <p className="text-gray-500 text-sm">Upload your first video to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <h2 className="text-2xl font-bold mb-2">✨ Discover Amazing Videos</h2>
        <p className="text-gray-400">Scroll through the latest content from creators</p>
      </div>

      <div className="grid gap-6">
        {videos.map((video: VideoFeedItem) => {
          const isLiked = likedVideos.has(video.id);
          const displayLikes = video.like_count + (isLiked ? 1 : 0);

          return (
            <Card key={video.id} className="bg-gray-900/50 border-gray-800 hover:bg-gray-900/70 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage 
                      src={video.avatar_url || undefined} 
                      alt={video.username}
                    />
                    <AvatarFallback className="bg-purple-600 text-white">
                      {(video.display_name || video.username).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {video.display_name || video.username}
                    </p>
                    <p className="text-xs text-gray-400">@{video.username}</p>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-400">
                    <span>⏱️ {formatDuration(video.duration)}</span>
                    <Badge variant="secondary" className="bg-purple-900/30 text-purple-300 border-purple-800">
                      {video.created_at.toLocaleDateString()}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Video Thumbnail */}
                <div className="relative aspect-[9/16] max-h-[400px] bg-gray-800 rounded-lg overflow-hidden group">
                  {video.thumbnail_url ? (
                    <img
                      src={video.thumbnail_url}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl">
                      🎬
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="lg"
                      className="bg-white/20 backdrop-blur-sm hover:bg-white/30 border border-white/30"
                    >
                      ▶️ Play
                    </Button>
                  </div>
                </div>

                {/* Video Info */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-white leading-tight">
                    {video.title}
                  </h3>
                  
                  {video.description && (
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {video.description}
                    </p>
                  )}

                  {/* Stats and Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span className="flex items-center space-x-1">
                        <span>👁️</span>
                        <span>{formatCount(video.view_count)} views</span>
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLike(video.id)}
                        className={`flex items-center space-x-1 transition-colors ${
                          isLiked 
                            ? 'text-red-500 hover:text-red-400' 
                            : 'text-gray-400 hover:text-red-400'
                        }`}
                      >
                        <span className={isLiked ? '❤️' : '🤍'} />
                        <span className="text-xs">{formatCount(displayLikes)}</span>
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-blue-400"
                      >
                        💬 Comment
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-green-400"
                      >
                        📤 Share
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}