import { createServerRunner } from "@aws-amplify/adapter-nextjs";
import { fetchAuthSession } from "aws-amplify/auth/server";
import { cookies } from "next/headers";

export const { runWithAmplifyServerContext } = createServerRunner({
  config: {
    Auth: {
      Cognito: {
        userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
        userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
      },
    },
  },
});

export interface AuthUser {
  id: string;
  email?: string;
}

export async function getAuthenticatedUser(): Promise<AuthUser | null> {
  try {
    const sessionPayload = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: async (contextSpec) => {
        try {
          const session = await fetchAuthSession(contextSpec);
          return session.tokens?.idToken?.payload;
        } catch { 
          return null;
        }
      },
    });

    if (!sessionPayload || !sessionPayload.sub) {
      return null;
    }

    return {
      id: sessionPayload.sub,
      email: typeof sessionPayload.email === "string" ? sessionPayload.email : undefined,
    };
  } catch (error) {
    console.error("Auth error in getAuthenticatedUser:", error);
    return null;
  }
}