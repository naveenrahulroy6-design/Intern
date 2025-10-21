import React, { useState } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import Label from '../common/Label';
import { useToast } from '../../hooks/useToast';
import * as api from '../../services/api';
import { handleApiError } from '../../utils/errorHandler';
import { Employee } from '../../types';

interface MFAVerificationPageProps {
  user: Employee;
  onComplete: () => void;
}

const MFAVerificationPage: React.FC<MFAVerificationPageProps> = ({ user, onComplete }) => {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
        addToast({ type: 'error', message: 'Invalid OTP. Please enter a 6-digit code.' });
        return;
    }
    setIsLoading(true);

    try {
        await api.verifyMfa({ token: otp });
        onComplete();
    } catch (error) {
        handleApiError(error, addToast, { context: 'MFA Verification' });
        setOtp('');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card title="Two-Factor Verification" className="w-full max-w-sm">
        <p className="text-muted-foreground text-center mb-6">Enter the 6-digit code from your authenticator app for <strong className="text-foreground">{user.email}</strong>.</p>
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
