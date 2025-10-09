import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import welcomeIllustration from "@/assets/onboarding-welcome.png";
import valueIllustration from "@/assets/onboarding-value.png";

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    username: "",
    mobile: "",
    email: "",
    idPassport: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    }

    if (!formData.mobile.trim()) {
      newErrors.mobile = "Mobile number is required";
    } else if (!validateMobile(formData.mobile)) {
      newErrors.mobile = "Invalid mobile number format (+27 XX XXX XXXX)";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Invalid email address";
    }

    if (!formData.idPassport.trim()) {
      newErrors.idPassport = "ID/Passport number is required";
    } else if (!validateIdNumber(formData.idPassport)) {
      newErrors.idPassport = "Invalid ID number (13 digits required)";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            username: formData.username,
            mobile: formData.mobile,
            id_passport: formData.idPassport,
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

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
            <ProgressDots current={1} total={3} />
          </div>
        )}

        {/* Screen 2: Value Proposition */}
        {step === 2 && (
          <div className="flex flex-col items-center text-center space-y-8 animate-fade-in">
            <div className="w-full max-w-xs">
              <img
                src={valueIllustration}
                alt="Value proposition illustration"
                className="w-full h-auto"
              />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">
                sign up for a new level of insight
              </h2>
              <p className="text-muted-foreground">financial freedom awaits</p>
            </div>
            <Button
              onClick={() => setStep(3)}
              className="w-full bg-foreground text-background hover:bg-foreground/90"
            >
              sign up
            </Button>
            <ProgressDots current={2} total={3} />
          </div>
        )}

        {/* Screen 3: Sign Up Form */}
        {step === 3 && (
          <div className="animate-fade-in">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="font-bold text-sm">
                  Username
                </Label>
                <Input
                  id="username"
                  placeholder="Tumiso Makena"
                  value={formData.username}
                  onChange={(e) => handleInputChange("username", e.target.value)}
                  className="border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary"
                />
                {errors.username && (
                  <p className="text-sm text-destructive">{errors.username}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile" className="font-bold text-sm">
                  Mobile Number
                </Label>
                <Input
                  id="mobile"
                  placeholder="+27 XX XXX 4044"
                  value={formData.mobile}
                  onChange={(e) => handleInputChange("mobile", e.target.value)}
                  className="border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary"
                />
                {errors.mobile && (
                  <p className="text-sm text-destructive">{errors.mobile}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="font-bold text-sm">
                  E-mail address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tumisomakena@gmail.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="idPassport" className="font-bold text-sm">
                  ID/Passport Number
                </Label>
                <Input
                  id="idPassport"
                  placeholder="030720xxxxxxx"
                  value={formData.idPassport}
                  onChange={(e) =>
                    handleInputChange("idPassport", e.target.value)
                  }
                  className="border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary"
                />
                {errors.idPassport && (
                  <p className="text-sm text-destructive">{errors.idPassport}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="font-bold text-sm">
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="GodIsGoodAllTheTime"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
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
                <Label htmlFor="confirmPassword" className="font-bold text-sm">
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="GodIsGoodAllTheTime"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      handleInputChange("confirmPassword", e.target.value)
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

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-foreground text-background hover:bg-foreground/90"
              >
                {isLoading ? "Creating account..." : "sign in"}
              </Button>
              <ProgressDots current={3} total={3} />
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

export default Onboarding;
