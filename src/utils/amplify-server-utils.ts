import { createServerRunner } from '@aws-amplify/adapter-nextjs';
import { fetchAuthSession } from 'aws-amplify/auth/server';

export const { runWithAmplifyServerContext } = createServerRunner({
  config: {
    Auth: {
      Cognito: {
        userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
        userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!
      }
    }
  }
});

export async function getAuthenticatedUser() {
  try {
    const user = await runWithAmplifyServerContext({
      nextServerContext: { cookies: require('next/headers').cookies },
      operation: async (contextSpec) => {
        const session = await fetchAuthSession(contextSpec);
        return session.tokens?.idToken?.payload;
      }
    });
    
    if (!user || !user.sub) return null;
    
    // 'sub' es el ID único e inmutable del usuario en Cognito
    return { id: user.sub, email: user.email };
  } catch (error) {
    console.error("Auth error:", error);
    return null;
  }
}