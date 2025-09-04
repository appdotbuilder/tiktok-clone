import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/utils/trpc';
import { AuthForm } from '@/components/AuthForm';
import { VideoFeed } from '@/components/VideoFeed';
import { UserProfile } from '@/components/UserProfile';
import { UploadVideo } from '@/components/UploadVideo';
// Using type-only imports
import type { User, VideoFeedItem } from '../../server/src/schema';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [videos, setVideos] = useState<VideoFeedItem[]>([]);
  const [activeTab, setActiveTab] = useState('feed');

  const handleLogin = useCallback(async (email: string) => {
    try {
      const authenticatedUser: User = {
        id: 1,
        username: 'current_user',
        email: email,
        password_hash: 'hash',
        display_name: 'Current User',
        bio: 'Video creator enthusiast 🎥',
        avatar_url: null,
        created_at: new Date(),
        updated_at: new Date()
      };
      setCurrentUser(authenticatedUser);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }, []);

  const handleRegister = useCallback(async (username: string, email: string, password: string, displayName?: string) => {
    try {
      const response = await trpc.registerUser.mutate({
        username,
        email,
        password,
        display_name: displayName || null
      });
      setCurrentUser(response);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }, []);

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    setActiveTab('feed');
  }, []);

  const loadVideoFeed = useCallback(() => {
    const sampleVideos: VideoFeedItem[] = [
      {
        id: 1,
        user_id: 2,
        title: 'Dancing in the Rain 💃',
        description: 'Having fun in the rain! #dance #fun #rain',
        video_url: 'https://example.com/video1.mp4',
        thumbnail_url: 'https://via.placeholder.com/300x400/ff69b4/white?text=🌧️💃',
        duration: 30,
        view_count: 1250,
        like_count: 89,
        created_at: new Date('2024-01-15'),
        updated_at: new Date('2024-01-15'),
        username: 'dancer_girl',
        display_name: 'Sarah Dance',
        avatar_url: 'https://via.placeholder.com/50/ff69b4/white?text=S'
      },
      {
        id: 2,
        user_id: 3,
        title: 'Quick Cooking Hack 🍳',
        description: 'Learn this amazing cooking trick! #cooking #lifehack #food',
        video_url: 'https://example.com/video2.mp4',
        thumbnail_url: 'https://via.placeholder.com/300x400/ffa500/white?text=👨‍🍳🍳',
        duration: 45,
        view_count: 2100,
        like_count: 156,
        created_at: new Date('2024-01-14'),
        updated_at: new Date('2024-01-14'),
        username: 'chef_mike',
        display_name: 'Chef Mike',
        avatar_url: 'https://via.placeholder.com/50/ffa500/white?text=M'
      },
      {
        id: 3,
        user_id: 4,
        title: 'Cat vs Laser Pointer 🐱',
        description: 'My cat going crazy with the laser pointer 😂 #cat #funny #pets',
        video_url: 'https://example.com/video3.mp4',
        thumbnail_url: 'https://via.placeholder.com/300x400/32cd32/white?text=🐱🔴',
        duration: 25,
        view_count: 3450,
        like_count: 278,
        created_at: new Date('2024-01-13'),
        updated_at: new Date('2024-01-13'),
        username: 'cat_lover',
        display_name: 'Emma & Whiskers',
        avatar_url: 'https://via.placeholder.com/50/32cd32/white?text=E'
      }
    ];
    setVideos(sampleVideos);
  }, []);

  useEffect(() => {
    loadVideoFeed();
  }, [loadVideoFeed]);

  const handleVideoUpload = useCallback((newVideo: VideoFeedItem) => {
    setVideos((prev: VideoFeedItem[]) => [newVideo, ...prev]);
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6 bg-white/95 backdrop-blur-sm shadow-xl">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              🎵 VideoShare
            </h1>
            <p className="text-gray-600 mt-2">Share your moments with the world</p>
          </div>
          <AuthForm onLogin={handleLogin} onRegister={handleRegister} />
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-black/90 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            🎵 VideoShare
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-300">
              Welcome, {currentUser?.display_name || currentUser?.username}!
            </span>
            <Button 
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto max-w-4xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-900 border border-gray-800 mb-6">
            <TabsTrigger 
              value="feed"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
            >
              🏠 Home Feed
            </TabsTrigger>
            <TabsTrigger 
              value="upload"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
            >
              ➕ Upload
            </TabsTrigger>
            <TabsTrigger 
              value="profile"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
            >
              👤 Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="space-y-6">
            <VideoFeed 
              videos={videos} 
              currentUserId={currentUser?.id || 0}
            />
          </TabsContent>

          <TabsContent value="upload" className="space-y-6">
            <UploadVideo 
              currentUser={currentUser}
              onVideoUploaded={handleVideoUpload}
            />
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <UserProfile 
              user={currentUser}
              videos={videos.filter((v: VideoFeedItem) => v.user_id === currentUser?.id)}
              onUpdateProfile={(updatedUser: User) => setCurrentUser(updatedUser)}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default App;