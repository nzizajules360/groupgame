import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useGame } from "@/hooks/use-game";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Users, Calendar, Settings, LogOut, RefreshCw, Trash2, Home, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { createRoom } = useGame();
  const { toast } = useToast();
  const [, params] = useRoute("/profile/:username?");
  const [, setLocation] = useLocation();
  const targetUsername = params?.username;

  const profileUser = targetUsername ? { username: targetUsername } : user;
  const isOwnProfile = !targetUsername || targetUsername === user?.username;
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Fetch a random avatar on mount and allow refresh
  const fetchRandomAvatar = async () => {
    try {
      const res = await fetch("https://avatar.iran.liara.run/public");
      if (res.ok) {
        const url = res.url;
        setAvatarUrl(url);
      } else {
        // Fallback to default
        setAvatarUrl(null);
      }
    } catch {
      setAvatarUrl(null);
    }
  };

  useEffect(() => {
    fetchRandomAvatar();
  }, []);

  const handleRefreshAvatar = () => {
    setAvatarUrl(null);
    fetchRandomAvatar();
    toast({ title: "Avatar refreshed", description: "A new random avatar has been loaded." });
  };

  const handleLogout = () => {
    logout.mutate();
    toast({ title: "Logged out", description: "You have been logged out." });
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to delete your account? This cannot be undone.")) return;
    try {
      const res = await fetch("/api/user/delete", { method: "DELETE", credentials: "include" });
      if (res.ok) {
        toast({ title: "Account deleted", description: "Your account has been permanently deleted." });
        logout.mutate();
        setLocation("/");
      } else {
        toast({ title: "Failed to delete", description: "Please try again.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
    }
  };

  const handleHostGame = () => {
    createRoom.mutate({ name: `${user?.username}'s Room` });
  };

  const handleGoHome = () => {
    setLocation("/lobby");
  };

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">User not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Profile</h1>
          {isOwnProfile && (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleHostGame} disabled={createRoom.isPending}>
                <Plus className="w-4 h-4 mr-2" /> {createRoom.isPending ? "Creating..." : "Host Game"}
              </Button>
              <Button variant="outline" onClick={handleGoHome}>
                <Home className="w-4 h-4 mr-2" /> Home
              </Button>
              <Button variant="destructive" onClick={handleDeleteAccount}>
                <Trash2 className="w-4 h-4 mr-2" /> Delete Account
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" /> Logout
              </Button>
            </div>
          )}
        </header>

        {/* Profile Card */}
        <Card className="bg-card/50 border-white/10">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20 border-4 border-primary/20">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt="Avatar" />
                ) : (
                  <AvatarFallback className="text-3xl bg-primary/20 text-primary animate-pulse">
                    {profileUser.username[0]?.toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              <div>
                <CardTitle className="text-2xl">{profileUser.username}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {isOwnProfile ? "This is you" : "Player"}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-black/20 rounded-lg">
                <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                <p className="text-2xl font-bold">{user?.wins || 0}</p>
                <p className="text-xs text-muted-foreground">Wins</p>
              </div>
              <div className="text-center p-4 bg-black/20 rounded-lg">
                <Users className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                <p className="text-2xl font-bold">{user?.totalGames || 0}</p>
                <p className="text-xs text-muted-foreground">Games Played</p>
              </div>
              <div className="text-center p-4 bg-black/20 rounded-lg">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <p className="text-2xl font-bold">{user?.wins || 0}</p>
                <p className="text-xs text-muted-foreground">Games Hosted</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-card/50 border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No recent activity to show.</p>
          </CardContent>
        </Card>

        {/* Settings (only own profile) */}
        {isOwnProfile && (
          <Card className="bg-card/50 border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Avatar</p>
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    {avatarUrl ? (
                      <AvatarImage src={avatarUrl} alt="Avatar" />
                    ) : (
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {profileUser.username[0]?.toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <Button variant="outline" size="sm" onClick={handleRefreshAvatar}>
                    <RefreshCw className="w-4 h-4 mr-2" /> Random Avatar
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Random avatar from external service.</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Account</p>
                <p className="text-xs text-muted-foreground">Username: {profileUser.username}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
