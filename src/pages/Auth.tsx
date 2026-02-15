import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import welcomeIllustration from "@/assets/onboarding-welcome.png";
import valueIllustration from "@/assets/onboarding-value.png";

const Auth = () => {
  // Steps: 1=Welcome, 2=Choose, 3=Login, 4=Signup, 5=Forgot Password, 6=Reset Password
  const [step, setStep] = useState(1);
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
    mobile: "",
    email: "",
    idPassport: "",
    password: "",
    confirmPassword: "",
  });

  // Forgot/Reset password state
  const [resetEmail, setResetEmail] = useState("");
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });

    // Listen for password recovery event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setStep(6); // Go to reset password form
      } else if (session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Validation functions
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateMobile = (mobile: string) => {
    const mobileRegex = /^\+27\s?\d{2}\s?\d{3}\s?\d{4}$/;
    return mobileRegex.test(mobile);
  };

  const validateIdNumber = (id: string) => {
    // South African ID: 13 digits
    const idRegex = /^\d{13}$/;
    return idRegex.test(id.replace(/\s/g, ""));
  };

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

    if (!signupData.mobile.trim()) {
      newErrors.mobile = "Mobile number is required";
    } else if (!validateMobile(signupData.mobile)) {
      newErrors.mobile = "Invalid mobile number format (+27 XX XXX XXXX)";
    }

    if (!signupData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(signupData.email)) {
      newErrors.email = "Invalid email address";
    }

    if (!signupData.idPassport.trim()) {
      newErrors.idPassport = "ID/Passport number is required";
    } else if (!validateIdNumber(signupData.idPassport)) {
      newErrors.idPassport = "Invalid ID number (13 digits required)";
    }

    if (!signupData.password) {
      newErrors.password = "Password is required";
    } else if (signupData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (!signupData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (signupData.password !== signupData.confirmPassword) {
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
            mobile: signupData.mobile,
            id_passport: signupData.idPassport,
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

      if (data.user && !data.session) {
        // Email confirmation required
        toast({
          title: "Check your email",
          description: "Please confirm your email address to continue",
        });
      } else if (data.session) {
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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    if (!resetEmail.trim() || !validateEmail(resetEmail)) {
      setErrors({ resetEmail: "Please enter a valid email address" });
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setResetEmailSent(true);
        toast({
          title: "Email sent!",
          description: "Check your inbox for the password reset link.",
        });
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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    const newErrors: Record<string, string> = {};

    if (!newPassword) {
      newErrors.newPassword = "Password is required";
    } else if (newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters";
    }

    if (newPassword !== confirmNewPassword) {
      newErrors.confirmNewPassword = "Passwords do not match";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Password updated!",
          description: "Your password has been successfully reset.",
        });
        setStep(3); // Go back to login
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
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
              <h2 className="text-2xl font-bold">Welcome to latela</h2>
            </div>
            <div className="w-full max-w-xs">
              <img
                src={valueIllustration}
                alt="Financial insights illustration"
                className="w-full h-auto"
              />
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

              <button
                type="button"
                onClick={() => {
                  setResetEmail("");
                  setResetEmailSent(false);
                  setStep(5);
                }}
                className="text-sm text-muted-foreground hover:text-primary underline self-start"
              >
                Forgot Password?
              </button>

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
                  placeholder="Tumiso Makena"
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
                <Label htmlFor="signup-mobile" className="font-bold text-sm">
                  Mobile Number
                </Label>
                <Input
                  id="signup-mobile"
                  placeholder="+27 XX XXX 4044"
                  value={signupData.mobile}
                  onChange={(e) =>
                    handleInputChange("mobile", e.target.value, "signup")
                  }
                  className="border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary"
                />
                {errors.mobile && (
                  <p className="text-sm text-destructive">{errors.mobile}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email" className="font-bold text-sm">
                  E-mail address
                </Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="tumisomakena@gmail.com"
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
                <Label htmlFor="signup-idPassport" className="font-bold text-sm">
                  ID/Passport Number
                </Label>
                <Input
                  id="signup-idPassport"
                  placeholder="030720xxxxxxx"
                  value={signupData.idPassport}
                  onChange={(e) =>
                    handleInputChange("idPassport", e.target.value, "signup")
                  }
                  className="border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary"
                />
                {errors.idPassport && (
                  <p className="text-sm text-destructive">{errors.idPassport}</p>
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

        {/* Screen 5: Forgot Password */}
        {step === 5 && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold">Forgot Password</h2>
              <p className="text-muted-foreground mt-2">
                {resetEmailSent
                  ? "Check your email for the reset link"
                  : "Enter your email to receive a reset link"}
              </p>
            </div>

            {!resetEmailSent ? (
              <form onSubmit={handleForgotPassword} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="reset-email" className="font-bold text-sm">
                    Email
                  </Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="you@example.com"
                    value={resetEmail}
                    onChange={(e) => {
                      setResetEmail(e.target.value);
                      if (errors.resetEmail) {
                        setErrors((prev) => ({ ...prev, resetEmail: "" }));
                      }
                    }}
                    className="border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary"
                  />
                  {errors.resetEmail && (
                    <p className="text-sm text-destructive">{errors.resetEmail}</p>
                  )}
                </div>

                <div className="space-y-4">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-foreground text-background hover:bg-foreground/90"
                  >
                    {isLoading ? "Sending..." : "Send Reset Link"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep(3)}
                    className="w-full"
                  >
                    Back to Login
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-6 text-center">
                <p className="text-muted-foreground">
                  We've sent a password reset link to <strong>{resetEmail}</strong>
                </p>
                <Button
                  onClick={() => setStep(3)}
                  className="w-full bg-foreground text-background hover:bg-foreground/90"
                >
                  Back to Login
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Screen 6: Reset Password */}
        {step === 6 && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold">Reset Password</h2>
              <p className="text-muted-foreground mt-2">Enter your new password</p>
            </div>
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="new-password" className="font-bold text-sm">
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
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
                {errors.newPassword && (
                  <p className="text-sm text-destructive">{errors.newPassword}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-new-password" className="font-bold text-sm">
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirm-new-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
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
                {errors.confirmNewPassword && (
                  <p className="text-sm text-destructive">{errors.confirmNewPassword}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-foreground text-background hover:bg-foreground/90"
              >
                {isLoading ? "Updating..." : "Update Password"}
              </Button>
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
