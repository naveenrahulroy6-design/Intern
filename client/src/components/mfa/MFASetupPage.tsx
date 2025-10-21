import React, { useState } from 'react';
import { Employee } from '../../types';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import Label from '../common/Label';
import { useToast } from '../../hooks/useToast';
import * as api from '../../services/api';
import { handleApiError } from '../../utils/errorHandler';

interface MFASetupPageProps {
  user: Employee;
  onComplete: () => void;
}

const MFASetupPage: React.FC<MFASetupPageProps> = ({ user, onComplete }) => {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();

  const otpAuthUrl = `otpauth://totp/WEintegrityHRMS:${user.email}?secret=${user.mfaSecret}&issuer=WEintegrityHRMS`;
  const qrCodeUrl = `https://chart.googleapis.com/chart?chs=200x200&chld=M|0&cht=qr&chl=${encodeURIComponent(otpAuthUrl)}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
        addToast({ type: 'error', message: 'Invalid OTP. Please enter a 6-digit code.' });
        return;
    }
    setIsLoading(true);

    try {
        await api.setupMfa({ token: otp });
        addToast({ type: 'success', message: 'MFA setup complete!' });
        onComplete();
    } catch (error) {
        handleApiError(error, addToast, { context: 'MFA Setup' });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card title="Set Up Two-Factor Authentication" className="w-full max-w-md">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Scan the QR code with your authenticator app (e.g., Google Authenticator).</p>
          <div className="flex justify-center p-4 bg-white rounded-lg">
            <img src={qrCodeUrl} alt="MFA QR Code" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Can't scan? Enter this secret key manually: <br />
            <strong className="font-mono">{user.mfaSecret}</strong>
          </p>
        </div>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="otp">Verification Code</Label>
            <Input
              type="text"
              id="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter 6-digit code"
              required
              maxLength={6}
              disabled={isLoading}
              className="text-center tracking-[0.5em]"
              autoComplete="one-time-code"
            />
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
            {isLoading ? 'Verifying...' : 'Verify & Complete Setup'}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default MFASetupPage;
