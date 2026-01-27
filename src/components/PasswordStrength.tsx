import { useState, useEffect } from 'react';
import zxcvbn from 'zxcvbn';

interface PasswordStrengthProps {
  password: string;
  minScore?: number;
  onStrengthChange?: (isStrong: boolean) => void;
}

export function PasswordStrength({ 
  password, 
  minScore = 2,
  onStrengthChange 
}: PasswordStrengthProps) {
  const [result, setResult] = useState<zxcvbn.ZXCVBNResult | null>(null);

  useEffect(() => {
    if (password) {
      const evaluation = zxcvbn(password);
      setResult(evaluation);
      onStrengthChange?.(evaluation.score >= minScore);
    } else {
      setResult(null);
      onStrengthChange?.(false);
    }
  }, [password, minScore, onStrengthChange]);

  if (!password || !result) return null;

  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
  const strengthColors = ['#ef4444', '#f85f00', '#eab308', '#22c55e', '#10b981'];

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[0, 1, 2, 3, 4].map((index) => (
          <div
            key={index}
            className="h-1 flex-1 rounded"
            style={{
              backgroundColor: index <= result.score 
                ? strengthColors[result.score] 
                : '#e5e7eb'
            }}
          />
        ))}
      </div>
      <p className="text-sm" style={{ color: strengthColors[result.score] }}>
        {strengthLabels[result.score]}
      </p>
      {result.feedback.warning && (
        <p className="text-sm text-muted-foreground">{result.feedback.warning}</p>
      )}
    </div>
  );
}