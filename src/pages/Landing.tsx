import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import bg from "@/assets/landing-bg.png";

const waitlistSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name too long"),
  email: z.string().trim().email("Invalid email address").max(255, "Email too long"),
});

const LatelaIconLanding = () => (
  <svg
    viewBox="0 0 12487 7723"
    className="h-20 w-20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M8401.5 3557C9527.41 3557 10545.9 3790.66 11282.4 4167.68C12019.7 4545.14 12470 5063.71 12470 5632C12470 6200.29 12019.7 6718.86 11282.4 7096.32C10545.9 7473.34 9527.41 7707 8401.5 7707C7275.59 7707 6257.07 7473.34 5520.61 7096.32C4783.3 6718.86 4333 6200.29 4333 5632C4333 5063.71 4783.3 4545.14 5520.61 4167.68C6257.07 3790.66 7275.59 3557 8401.5 3557Z"
      fill="#000" stroke="#000" strokeWidth="32"
    />
    <rect x="4317" y="3726" width="8169" height="1912" fill="#000" />
    <path
      d="M8401.5 1668.5C9522.35 1668.5 10534.3 1901.2 11263.9 2274.73C11996.6 2649.81 12429.5 3157.82 12429.5 3703C12429.5 4248.18 11996.6 4756.19 11263.9 5131.27C10534.3 5504.8 9522.35 5737.5 8401.5 5737.5C7280.65 5737.5 6268.72 5504.8 5539.07 5131.27C4806.41 4756.19 4373.5 4248.18 4373.5 3703C4373.5 3157.82 4806.41 2649.81 5539.07 2274.73C6268.72 1901.2 7280.65 1668.5 8401.5 1668.5Z"
      fill="#fff" stroke="#000" strokeWidth="113"
    />
    <line x1="4333" y1="3726" x2="4333" y2="5638" stroke="#000" strokeWidth="32" />
    <path d="M12470.5 3749V5661" stroke="#000" strokeWidth="32" />
    <path
      d="M4360.19 2624.72C5468.99 2429.21 6512.62 2482.45 7303.36 2725.86C8095.01 2969.55 8628.52 3402.05 8727.2 3961.71C8825.89 4521.36 8472.48 5110.25 7811.91 5610C7152.11 6109.18 6189.63 6516.16 5080.83 6711.67C3972.03 6907.18 2928.41 6853.93 2137.67 6610.53C1346.02 6366.84 812.506 5934.33 713.824 5374.68C615.142 4815.03 968.553 4226.14 1629.12 3726.38C2288.92 3227.21 3251.39 2820.23 4360.19 2624.72Z"
      fill="#000" stroke="#000" strokeWidth="32"
    />
    <rect x="367.094" y="3500.41" width="8169" height="1912" transform="rotate(-10 367.094 3500.41)" fill="#000" />
    <path
      d="M4032.26 764.907C5136.08 570.274 6173.05 623.718 6956.47 864.873C7743.13 1107.02 8257.68 1532.14 8352.35 2069.04C8447.02 2605.94 8108.9 3181.41 7452.51 3678.01C6798.81 4172.57 5842.65 4577.46 4738.83 4772.09C3635.01 4966.72 2598.04 4913.28 1814.62 4672.12C1027.96 4429.97 513.41 4004.85 418.74 3467.95C324.07 2931.05 662.187 2355.59 1318.59 1858.99C1972.29 1364.43 2928.44 959.54 4032.26 764.907Z"
      fill="#fff" stroke="#000" strokeWidth="113"
    />
    <line x1="382.851" y1="3497.64" x2="714.866" y2="5380.59" stroke="#000" strokeWidth="32" />
    <path d="M8400.72 2107.23L8732.73 3990.18" stroke="#000" strokeWidth="32" />
  </svg>
);

export default function Landing() {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSubmitError("");

    const result = waitlistSchema.safeParse({ name, email });
    if (!result.success) {
      const fieldErrors: { name?: string; email?: string } = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as "name" | "email";
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("waitlist")
        .insert({ name: result.data.name, email: result.data.email });

      if (error) {
        if (error.code === "23505") {
          setSubmitError("You're already on the waitlist! We'll be in touch.");
        } else {
          setSubmitError("Something went wrong. Please try again.");
        }
      } else {
        setSuccess(true);
      }
    } catch {
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-screen overflow-hidden flex flex-col items-center justify-start"
      style={{
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "center top",
      }}
    >
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-md px-4 py-10 gap-5">
        {/* Logo */}
        <LatelaIconLanding />

        {/* Heading */}
        <div className="text-center">
          <h1 className="leading-tight" style={{ fontSize: "52px" }}>
            <span className="font-garet font-normal text-black block">Welcome to</span>
            <span className="font-brand font-light text-black block">Latela</span>
          </h1>
        </div>

        {/* About us card */}
        <div
          className="w-full rounded-2xl border-2 border-black p-5"
          style={{
            background: "#fde047",
            boxShadow: "4px 4px 0 #000",
          }}
        >
          <h2 className="font-garet font-bold text-black text-2xl mb-2">About us</h2>
          <p className="font-garet font-normal text-black text-base leading-relaxed">
            We are an AI-powered budgeting app on a mission to transform the
            relationship millions of South Africans have with their money.
          </p>
        </div>

        {/* Waitlist incentive card */}
        <div
          className="w-full rounded-2xl border-2 border-black p-5"
          style={{
            background: "#60a5fa",
            boxShadow: "4px 4px 0 #000",
          }}
        >
          <p className="font-garet font-normal text-black text-base leading-relaxed">
            If you would like to be notified when we launch our mobile app,
            please join our waitlist. The first 1 000 people on our waitlist
            will get <strong>three months of our premium tier, for free.</strong>
          </p>
        </div>

        {/* CTA Button */}
        <button
          onClick={() => setShowForm(true)}
          className="w-full rounded-2xl bg-black text-white font-brand font-bold text-lg py-4 hover:opacity-90 active:scale-[0.98] transition-transform"
          style={{ boxShadow: "6px 6px 0 #000000" }}
        >
          Join Waitlist
        </button>
      </div>

      {/* Waitlist modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 px-4 pb-0">
          <div
            className="w-full max-w-sm rounded-t-3xl bg-white border-t-2 border-x-2 border-black p-6 pb-10 animate-in slide-in-from-bottom-4 duration-300"
          >
            {success ? (
              <div className="flex flex-col items-center gap-4 py-6 text-center">
                <span className="text-5xl">🎉</span>
                <h2 className="font-brand font-bold text-2xl text-black">
                  You're on the list!
                </h2>
                <p className="font-garet font-normal text-gray-600 text-sm">
                  We'll let you know when Latela launches. Get ready!
                </p>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setSuccess(false);
                    setName("");
                    setEmail("");
                  }}
                  className="mt-2 w-full rounded-xl bg-black text-white font-brand font-bold py-3"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-brand font-bold text-xl text-black">Join the waitlist</h2>
                  <button
                    onClick={() => setShowForm(false)}
                    className="text-gray-500 hover:text-black text-2xl leading-none"
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
                  <div>
                    <label className="font-garet font-semibold block text-sm text-black mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      maxLength={100}
                      className="font-garet font-normal w-full rounded-xl border-2 border-black px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black/20"
                    />
                    {errors.name && (
                      <p className="text-red-600 text-xs mt-1">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="font-garet font-semibold block text-sm text-black mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      maxLength={255}
                      className="font-garet font-normal w-full rounded-xl border-2 border-black px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black/20"
                    />
                    {errors.email && (
                      <p className="text-red-600 text-xs mt-1">{errors.email}</p>
                    )}
                  </div>

                  {submitError && (
                    <p className="text-red-600 text-xs text-center">{submitError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-black text-white font-brand font-bold py-3 disabled:opacity-60 mt-1"
                  >
                    {loading ? "Joining..." : "Join Waitlist"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
