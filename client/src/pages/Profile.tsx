import { useRoute } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Users, Calendar, Settings, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [, params] = useRoute("/profile/:username?");
  const targetUsername = params?.username;

  const profileUser = targetUsername ? { username: targetUsername } : user;
  const isOwnProfile = !targetUsername || targetUsername === user?.username;

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">User not found.</p>
      </div>
    );
  }

  const handleLogout = () => {
    logout.mutate();
    toast({ title: "Logged out", description: "You have been logged out." });
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Profile</h1>
          {isOwnProfile && (
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          )}
        </header>

        {/* Profile Card */}
        <Card className="bg-card/50 border-white/10">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20 border-4 border-primary/20">
                <AvatarFallback className="text-3xl bg-primary/20 text-primary">
                  {profileUser.username[0]?.toUpperCase()}
                </AvatarFallback>
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
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {profileUser.username[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <p className="text-xs text-muted-foreground mt-2">Default avatar generated from username.</p>
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
