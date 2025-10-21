
import React, { useState } from 'react';
import Card from '../common/Card.tsx';
import Button from '../common/Button.tsx';
import Input from '../common/Input.tsx';
import Label from '../common/Label.tsx';
import { useToast } from '../../hooks/useToast.tsx';

interface MFAVerificationPageProps {
  onComplete: () => void;
}

const MFAVerificationPage: React.FC<MFAVerificationPageProps> = ({ onComplete }) => {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Mock verification
    setTimeout(() => {
        if (otp.length === 6 && /^\d+$/.test(otp)) {
            // In a real app, you would verify the OTP against the user's secret
            onComplete();
        } else {
            addToast({ type: 'error', message: 'Invalid OTP. Please try again.' });
            setOtp('');
        }
        setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card title="Two-Factor Verification" className="w-full max-w-sm">
        <p className="text-muted-foreground text-center mb-6">Enter the 6-digit code from your authenticator app.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="otp" className="sr-only">Verification Code</Label>
            <Input
              type="text"
              id="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="_ _ _ _ _ _"
              required
              maxLength={6}
              disabled={isLoading}
              className="text-center text-2xl tracking-[0.5em] font-mono"
              autoComplete="one-time-code"
            />
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
            {isLoading ? 'Verifying...' : 'Verify'}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default MFAVerificationPage;
