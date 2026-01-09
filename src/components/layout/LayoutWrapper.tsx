'use client';

import { usePathname } from 'next/navigation';
import ConfigureAmplify from '@/components/ConfigureAmplify';
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { useEffect, useState } from 'react';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';

import Sidebar from './Sidebar';
import LoginForm from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Authenticator.Provider>
      <ConfigureAmplify />
      <AuthCheck>
          {children}
      </AuthCheck>
    </Authenticator.Provider>
  );
}

function AuthCheck({ children }: { children: React.ReactNode }) {
    const { authStatus, user } = useAuthenticator(context => [context.authStatus, context.user]);
    const pathname = usePathname();
    
    const [userProfile, setUserProfile] = useState({ name: '', email: '' });

    const loadUserProfile = async () => {
        try {
            const attributes = await fetchUserAttributes();
            setUserProfile({
                name: attributes.name || '',
                email: attributes.email || user?.signInDetails?.loginId || ''
            });
        } catch (err) {
            console.log("Esperando datos...");
        }
    };

    useEffect(() => {
        if (authStatus === 'authenticated') {
            loadUserProfile();
        }

        // ESCUCHAMOS TANTO EL LOGIN COMO EL LOGOUT
        const hubListener = Hub.listen('auth', ({ payload }) => {
            if (payload.event === 'signedIn') {
                setTimeout(() => loadUserProfile(), 200);
            }
            // SI DETECTAMOS LOGOUT, LIMPIAMOS EL ESTADO
            if (payload.event === 'signedOut') {
                setUserProfile({ name: '', email: '' });
                // El authStatus cambiará automáticamente y re-renderizará el Login,
                // pero esto asegura que los datos viejos se borren.
            }
        });

        return () => hubListener();
    }, [authStatus]);

    if (authStatus === 'configuring') {
        return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">Cargando...</div>;
    }

    if (authStatus !== 'authenticated') {
        const AuthContainer = ({ form }: { form: React.ReactNode }) => (
            <main className="min-h-screen w-full bg-slate-950 flex items-center justify-center relative">
                {form}
            </main>
        );

        if (pathname === '/register') return <AuthContainer form={<RegisterForm />} />;
        return <AuthContainer form={<LoginForm />} />;
    }

    return (
        <div className="flex h-screen overflow-hidden bg-slate-950">
            <Sidebar userProfile={userProfile} />
            <main className="flex-1 md:ml-64 h-full overflow-y-auto p-4 md:p-8 relative">
                {children}
            </main>
        </div>
    );
}