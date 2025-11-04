import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import welcomeIllustration from "@/assets/onboarding-welcome.png";

const Auth = () => {
  const [step, setStep] = useState(1); // 1: Welcome, 2: Choose (Login/Signup), 3: Login Form, 4: Signup Form
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [signupData, setSignupData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      if (error) {
        toast({
          title: "Login failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      if (data.session) {
        toast({
          title: "Welcome back!",
          description: "You've successfully logged in",
        });
        navigate("/");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    
    if (!signupData.username.trim()) {
      newErrors.username = "Username is required";
    }
    if (!signupData.email.trim()) {
      newErrors.email = "Email is required";
    }
    if (!signupData.password) {
      newErrors.password = "Password is required";
    } else if (signupData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    if (signupData.password !== signupData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            username: signupData.username,
          },
        },
      });

      if (error) {
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      if (data.user) {
        toast({
          title: "Account created!",
          description: "Welcome to Latela",
        });
        navigate("/");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    field: string,
    value: string,
    formType: "login" | "signup"
  ) => {
    if (formType === "login") {
      setLoginData((prev) => ({ ...prev, [field]: value }));
    } else {
      setSignupData((prev) => ({ ...prev, [field]: value }));
    }
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold font-georama">latela</h1>
        </div>

        {/* Screen 1: Welcome */}
        {step === 1 && (
          <div className="flex flex-col items-center text-center space-y-8 animate-fade-in">
            <div className="w-full max-w-xs">
              <img
                src={welcomeIllustration}
                alt="Welcome illustration"
                className="w-full h-auto"
              />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">your personal budget buddy</h2>
              <p className="text-muted-foreground">
                Manage all of your money in one place!
              </p>
            </div>
            <Button
              onClick={() => setStep(2)}
              className="w-full bg-foreground text-background hover:bg-foreground/90"
            >
              Continue
            </Button>
            <ProgressDots current={1} total={2} />
          </div>
        )}

        {/* Screen 2: Choose Login or Sign Up */}
        {step === 2 && (
          <div className="flex flex-col items-center text-center space-y-8 animate-fade-in">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Welcome to Latela</h2>
              <p className="text-muted-foreground">
                Choose how you'd like to continue
              </p>
            </div>
            <div className="w-full space-y-4">
              <Button
                onClick={() => setStep(3)}
                className="w-full bg-foreground text-background hover:bg-foreground/90"
              >
                Login
              </Button>
              <Button
                onClick={() => setStep(4)}
                variant="outline"
                className="w-full"
              >
                Sign Up
              </Button>
            </div>
            <ProgressDots current={2} total={2} />
          </div>
        )}

        {/* Screen 3: Login Form */}
        {step === 3 && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold">Login</h2>
              <p className="text-muted-foreground mt-2">Welcome back!</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="font-bold text-sm">
                  Email
                </Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  value={loginData.email}
                  onChange={(e) =>
                    handleInputChange("email", e.target.value, "login")
                  }
                  className="border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password" className="font-bold text-sm">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={loginData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value, "login")
                    }
                    className="border-0 border-b rounded-none px-0 pr-10 focus-visible:ring-0 focus-visible:border-primary"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-foreground text-background hover:bg-foreground/90"
                >
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep(2)}
                  className="w-full"
                >
                  Back
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Screen 4: Signup Form */}
        {step === 4 && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold">Sign Up</h2>
              <p className="text-muted-foreground mt-2">
                Create your account
              </p>
            </div>
            <form onSubmit={handleSignup} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="signup-username" className="font-bold text-sm">
                  Username
                </Label>
                <Input
                  id="signup-username"
                  placeholder="Your name"
                  value={signupData.username}
                  onChange={(e) =>
                    handleInputChange("username", e.target.value, "signup")
                  }
                  className="border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary"
                />
                {errors.username && (
                  <p className="text-sm text-destructive">{errors.username}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email" className="font-bold text-sm">
                  Email
                </Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="you@example.com"
                  value={signupData.email}
                  onChange={(e) =>
                    handleInputChange("email", e.target.value, "signup")
                  }
                  className="border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password" className="font-bold text-sm">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={signupData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value, "signup")
                    }
                    className="border-0 border-b rounded-none px-0 pr-10 focus-visible:ring-0 focus-visible:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-confirm" className="font-bold text-sm">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="signup-confirm"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={signupData.confirmPassword}
                    onChange={(e) =>
                      handleInputChange(
                        "confirmPassword",
                        e.target.value,
                        "signup"
                      )
                    }
                    className="border-0 border-b rounded-none px-0 pr-10 focus-visible:ring-0 focus-visible:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-0 top-1/2 -translate-y-1/2"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-foreground text-background hover:bg-foreground/90"
                >
                  {isLoading ? "Creating account..." : "Sign Up"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep(2)}
                  className="w-full"
                >
                  Back
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

const ProgressDots = ({ current, total }: { current: number; total: number }) => {
  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-2 w-2 rounded-full transition-colors ${
            i + 1 === current ? "bg-foreground" : "bg-muted"
          }`}
        />
      ))}
    </div>
  );
};

export default Auth;
