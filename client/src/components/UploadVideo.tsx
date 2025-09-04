import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
// Using type-only imports
import type { User, VideoFeedItem } from '../../../server/src/schema';

interface UploadVideoProps {
  currentUser: User | null;
  onVideoUploaded: (video: VideoFeedItem) => void;
}

export function UploadVideo({ currentUser, onVideoUploaded }: UploadVideoProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    videoUrl: '',
    thumbnailUrl: '',
    duration: 30
  });

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsUploading(true);
    setUploadSuccess(false);

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const newVideo: VideoFeedItem = {
        id: Date.now(),
        user_id: currentUser.id,
        title: formData.title,
        description: formData.description || null,
        video_url: formData.videoUrl,
        thumbnail_url: formData.thumbnailUrl || null,
        duration: formData.duration,
        view_count: 0,
        like_count: 0,
        created_at: new Date(),
        updated_at: new Date(),
        username: currentUser.username,
        display_name: currentUser.display_name,
        avatar_url: currentUser.avatar_url
      };

      onVideoUploaded(newVideo);
      setUploadSuccess(true);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        videoUrl: '',
        thumbnailUrl: '',
        duration: 30
      });
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  }, [currentUser, formData, onVideoUploaded]);

  const generateThumbnail = useCallback(() => {
    const thumbnails = [
      'https://via.placeholder.com/300x400/6366f1/white?text=🎬+New+Video',
      'https://via.placeholder.com/300x400/8b5cf6/white?text=✨+Amazing',
      'https://via.placeholder.com/300x400/ec4899/white?text=🔥+Hot+Content',
      'https://via.placeholder.com/300x400/10b981/white?text=💫+Creative',
      'https://via.placeholder.com/300x400/f59e0b/white?text=🎭+Fun+Video'
    ];
    const randomThumbnail = thumbnails[Math.floor(Math.random() * thumbnails.length)];
    setFormData((prev) => ({ ...prev, thumbnailUrl: randomThumbnail }));
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">🎬 Upload Your Video</h2>
        <p className="text-gray-400">Share your creativity with the world</p>
      </div>

      {uploadSuccess && (
        <Alert className="border-green-800 bg-green-900/20">
          <AlertDescription className="text-green-400">
            ✅ Video uploaded successfully! Check it out in your profile or the main feed.
          </AlertDescription>
        </Alert>
      )}

      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>📹</span>
            <span>Video Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="What's your video about? 🎭"
                value={formData.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                required
                maxLength={200}
                className="bg-gray-800 border-gray-700 focus:border-purple-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Tell us more about your video... Add hashtags! #creative #fun"
                value={formData.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                rows={3}
                className="bg-gray-800 border-gray-700 focus:border-purple-500 resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="video-url">Video URL *</Label>
              <Input
                id="video-url"
                type="url"
                placeholder="https://example.com/your-video.mp4"
                value={formData.videoUrl}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev) => ({ ...prev, videoUrl: e.target.value }))
                }
                required
                className="bg-gray-800 border-gray-700 focus:border-purple-500"
              />
              <p className="text-xs text-gray-500">
                💡 In a real app, you'd upload a file here instead of providing a URL
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="thumbnail-url">Thumbnail URL</Label>
              <div className="flex space-x-2">
                <Input
                  id="thumbnail-url"
                  type="url"
                  placeholder="https://example.com/thumbnail.jpg"
                  value={formData.thumbnailUrl}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev) => ({ ...prev, thumbnailUrl: e.target.value }))
                  }
                  className="bg-gray-800 border-gray-700 focus:border-purple-500"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateThumbnail}
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  🎨 Generate
                </Button>
              </div>
              {formData.thumbnailUrl && (
                <div className="mt-2">
                  <img
                    src={formData.thumbnailUrl}
                    alt="Thumbnail preview"
                    className="w-32 h-40 object-cover rounded border border-gray-700"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (seconds) *</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                max="300"
                value={formData.duration}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev) => ({ ...prev, duration: parseInt(e.target.value) || 30 }))
                }
                required
                className="bg-gray-800 border-gray-700 focus:border-purple-500"
              />
              <p className="text-xs text-gray-500">
                ⏱️ Most engaging videos are between 15-60 seconds
              </p>
            </div>

            <Button
              type="submit"
              disabled={isUploading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3"
            >
              {isUploading ? (
                <>
                  <span className="animate-spin mr-2">🔄</span>
                  Uploading... This might take a moment
                </>
              ) : (
                <>
                  🚀 Upload Video
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="bg-gray-900/30 border border-gray-800 rounded-lg p-4">
        <h3 className="font-semibold mb-2 text-yellow-400">📋 Upload Tips</h3>
        <ul className="text-sm text-gray-400 space-y-1">
          <li>• Keep titles catchy and descriptive</li>
          <li>• Use relevant hashtags in your description</li>
          <li>• Videos under 60 seconds get better engagement</li>
          <li>• Add a compelling thumbnail to attract viewers</li>
        </ul>
      </div>
    </div>
  );
}