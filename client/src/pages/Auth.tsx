import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gamepad2, Sparkles } from "lucide-react";

export default function AuthPage() {
  const { login, register, user } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("login");
  
  // Form States
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ username: "", password: "", confirmPassword: "" });

  if (user) {
    setLocation("/lobby");
    return null;
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate(loginForm);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (registerForm.password !== registerForm.confirmPassword) {
      // Add toast error here ideally
      return;
    }
    register.mutate({ username: registerForm.username, password: registerForm.password });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />
      <div className="absolute top-10 left-10 w-64 h-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent/10 rounded-full blur-[120px] pointer-events-none" />

      <Card className="w-full max-w-md border-white/10 bg-card/60 backdrop-blur-xl shadow-2xl relative z-10">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto bg-primary/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border border-primary/30">
            <Gamepad2 className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-br from-white to-white/60">
            Brain Spin
          </CardTitle>
          <CardDescription className="text-muted-foreground/80">
            The ultimate competitive trivia challenge
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-black/20">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input 
                    id="username" 
                    placeholder="Enter your username"
                    className="bg-black/20 border-white/10"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="Enter your password"
                    className="bg-black/20 border-white/10"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90 mt-4 h-11 text-base font-semibold"
                  disabled={login.isPending}
                >
                  {login.isPending ? "Logging in..." : "Start Playing"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-username">Username</Label>
                  <Input 
                    id="reg-username" 
                    placeholder="Choose a username"
                    className="bg-black/20 border-white/10"
                    value={registerForm.username}
                    onChange={(e) => setRegisterForm({...registerForm, username: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-pass">Password</Label>
                  <Input 
                    id="reg-pass" 
                    type="password" 
                    placeholder="Choose a password"
                    className="bg-black/20 border-white/10"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-pass">Confirm Password</Label>
                  <Input 
                    id="confirm-pass" 
                    type="password" 
                    placeholder="Confirm password"
                    className="bg-black/20 border-white/10"
                    value={registerForm.confirmPassword}
                    onChange={(e) => setRegisterForm({...registerForm, confirmPassword: e.target.value})}
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-accent hover:bg-accent/90 mt-4 h-11 text-base font-semibold"
                  disabled={register.isPending}
                >
                  {register.isPending ? "Creating Account..." : (
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" /> Create Account
                    </span>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-center pb-6">
          <p className="text-xs text-muted-foreground text-center">
            By continuing, you agree to play fair and have fun!
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
