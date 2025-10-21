
import React, { useState } from 'react';
import { Employee } from '../types.ts';
import Button from './common/Button.tsx';
import Card from './common/Card.tsx';
import Input from './common/Input.tsx';
import Label from './common/Label.tsx';
import * as api from '../services/api.ts';
import { useToast } from '../hooks/useToast.tsx';
import { getApiErrorMessage } from '../utils/errorHandler.ts';

interface LoginPageProps {
    onLoginSuccess: (user: Employee, token: string) => void;
}

type LoginView = 'login' | 'forgot' | 'reset';

const DEMO_USERS = [
    { email: 'admin@hrms.com', password: 'password123' },
    { email: 'hr@hrms.com', password: 'password123' },
    { email: 'manager@hrms.com', password: 'password123' },
    { email: 'employee@hrms.com', password: 'password123' },
];

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
    const [view, setView] = useState<LoginView>('login');
    
    // Login state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    // Reset state
    const [emailForReset, setEmailForReset] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { addToast } = useToast();

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await api.login({ email, password });
            const { user, token } = response.data;
            onLoginSuccess(user, token);
        } catch (err: any) {
            const message = getApiErrorMessage(err, 'Invalid email or password.');
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleForgotSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await api.forgotPassword(emailForReset);
            addToast({ type: 'success', message: 'If an account exists for that email, a reset link has been sent.' });
            setView('reset'); // Simulate user clicking link in email
        } catch (err: any) {
             // Per security best practice, don't reveal if the email exists.
             // Log the real error for debugging but show a generic success message.
             console.error("Forgot Password Error:", err);
             addToast({ type: 'success', message: 'If an account exists for that email, a reset link has been sent.' });
             setView('reset');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleResetSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters long.');
            return;
        }
        
        setError('');
        setIsLoading(true);
        try {
            await api.resetPassword({ email: emailForReset, newPassword });
            addToast({ type: 'success', message: 'Password has been reset successfully. Please sign in.' });
            setView('login');
            setEmail(emailForReset); // Pre-fill email for convenience
            setPassword('');
            setEmailForReset('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
             const message = getApiErrorMessage(err, 'Failed to reset password.');
             setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const fillDemoCredentials = (user: {email: string, password: string}) => {
        setEmail(user.email);
        setPassword(user.password);
    };

    const renderView = () => {
        switch (view) {
            case 'forgot':
                return (
                    <>
                        <h2 className="text-2xl font-bold text-center">Forgot Password</h2>
                        <p className="text-muted-foreground text-center text-sm mb-6">Enter your email to receive a reset link.</p>
                        <form onSubmit={handleForgotSubmit} className="space-y-6">
                            {error && <div className="bg-destructive/20 border border-destructive/30 text-destructive px-4 py-3 rounded-md text-sm">{error}</div>}
                            <div className="space-y-2">
                                <Label htmlFor="email-forgot">Email Address</Label>
                                <Input type="email" id="email-forgot" icon="mail" value={emailForReset} onChange={(e) => setEmailForReset(e.target.value)} placeholder="you@example.com" required disabled={isLoading} />
                            </div>
                            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                                {isLoading ? 'Sending...' : 'Send Reset Link'}
                            </Button>
                        </form>
                        <div className="mt-4 text-center">
                            <button onClick={() => setView('login')} className="text-sm text-primary hover:underline">Back to Sign In</button>
                        </div>
                    </>
                );
            case 'reset':
                return (
                     <>
                        <h2 className="text-2xl font-bold text-center">Create New Password</h2>
                        <p className="text-muted-foreground text-center text-sm mb-6">Enter a new password for <strong className="text-foreground">{emailForReset}</strong>.</p>
                        <form onSubmit={handleResetSubmit} className="space-y-6">
                             {error && <div className="bg-destructive/20 border border-destructive/30 text-destructive px-4 py-3 rounded-md text-sm">{error}</div>}
                             <div className="space-y-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <Input type="password" id="new-password" icon="lock" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" required disabled={isLoading} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirm New Password</Label>
                                <Input type="password" id="confirm-password" icon="lock" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required disabled={isLoading} />
                            </div>
                            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                                {isLoading ? 'Resetting...' : 'Set New Password'}
                            </Button>
                        </form>
                         <div className="mt-4 text-center">
                            <button onClick={() => setView('login')} className="text-sm text-primary hover:underline">Back to Sign In</button>
                        </div>
                    </>
                );
            case 'login':
            default:
                return (
                    <form onSubmit={handleLoginSubmit} className="space-y-6">
                        {error && <div className="bg-destructive/20 border border-destructive/30 text-destructive px-4 py-3 rounded-md text-sm">{error}</div>}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input type="email" id="email" icon="mail" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required disabled={isLoading} autoComplete="email" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="password">Password</Label>
                                <button type="button" onClick={() => { setView('forgot'); setError(''); }} className="text-sm font-medium text-primary hover:underline">Forgot Password?</button>
                            </div>
                            <Input type="password" id="password" icon="lock" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required disabled={isLoading} autoComplete="current-password" />
                        </div>
                        <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                            {isLoading ? 'Signing In...' : 'Sign In'}
                        </Button>
                    </form>
                );
        }
    };


    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <div className="w-full max-w-md space-y-8">
                 <div className="flex flex-col items-center justify-center text-center">
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 p-3 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl shadow-lg flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="text-white w-full h-full">
                                <path d="M2.5 7.5L5 15h14l2.5-7.5L19 10l-4-6.5-3 4.5-3-4.5L5 10l-2.5-2.5zM5 17h14v2H5v-2z"/>
                            </svg>
                        </div>
                        <h1 className="text-5xl font-extrabold text-foreground tracking-tight">
                            WEintegrity
                        </h1>
                    </div>
                     <p className="text-muted-foreground mt-3 text-lg">Sign in to the future of HR management</p>
                </div>
                <Card bodyClassName="p-8">
                   {renderView()}
                </Card>
                 <Card className="text-sm text-muted-foreground" bodyClassName="p-4">
                    <h4 className="font-semibold text-foreground mb-2">Demo Accounts (Click to fill):</h4>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                        {DEMO_USERS.map(user => (
                          <button key={user.email} onClick={() => fillDemoCredentials(user)} className="text-primary hover:underline text-left truncate">
                            {user.email}
                          </button>
                        ))}
                    </div>
                     <p className="mt-3 text-center text-xs">Password for demo accounts is: <strong className="font-mono">password123</strong></p>
                     <p className="mt-1 text-center text-xs">New employees have a default password of: <strong className="font-mono">password</strong></p>
                </Card>
            </div>
        </div>
    );
};

export default LoginPage;
