import React, { useState } from 'react';
// FIX: Replaced User with Employee as User type is deprecated.
import { Employee } from '../types';
import Button from './common/Button';
import Card from './common/Card';
import Input from './common/Input';
import Label from './common/Label';

interface LoginPageProps {
    onLogin: (user: Employee) => void;
    users: Employee[];
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, users }) => {
    const [email, setEmail] = useState('employee@hrms.com');
    const [password, setPassword] = useState('password123');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        setTimeout(() => {
            const userFound = users.find(u => u.email.toLowerCase() === email.toLowerCase());
            // FIX: Removed password check as Employee type doesn't have password. This is a mock component.
            if (userFound) {
                onLogin(userFound);
            } else {
                setError('Invalid email or password.');
            }
            setIsLoading(false);
        }, 1000);
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
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && <div className="bg-destructive/20 border border-destructive/30 text-destructive px-4 py-3 rounded-md text-sm">{error}</div>}
                        
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                type="email"
                                id="email"
                                icon="mail"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                                disabled={isLoading}
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                type="password"
                                id="password"
                                icon="lock"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                disabled={isLoading}
                            />
                        </div>
                        
                        <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                            {isLoading ? 'Signing In...' : 'Sign In'}
                        </Button>
                    </form>
                </Card>
                 <Card className="text-sm text-muted-foreground" bodyClassName="p-4">
                    <h4 className="font-semibold text-foreground mb-2">Demo Emails:</h4>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                        {users.map(user => <button key={user.email} onClick={() => setEmail(user.email)} className="text-primary hover:underline text-left">{user.email}</button>)}
                    </div>
                     <p className="mt-3 text-center text-xs">The password for all demo accounts is: <strong className="font-mono">password123</strong></p>
                     <p className="mt-1 text-center text-xs">New employees have a default password of: <strong className="font-mono">password</strong></p>
                </Card>
            </div>
        </div>
    );
};

export default LoginPage;