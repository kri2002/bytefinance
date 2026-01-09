import { getUserSettings } from "@/lib/actions";
import SettingsList from "@/components/settings/SettingsList";
import { fetchUserAttributes } from "aws-amplify/auth/server";
import { runWithAmplifyServerContext } from "@/utils/amplify-server-utils";
import { cookies } from "next/headers";

export default async function SettingsPage() {
  const dbSettings = await getUserSettings();

  let initialProfile = {
    name: dbSettings?.name || "",
    email: dbSettings?.email || "",
    currency: dbSettings?.currency || "MXN",
    budgetLimit: dbSettings?.budgetLimit || "15000",
    notifications: dbSettings?.notifications ?? true,
    darkMode: true
  };

  if (!initialProfile.name) {
    try {
      const attributes = await runWithAmplifyServerContext({
        nextServerContext: { cookies },
        operation: (contextSpec) => fetchUserAttributes(contextSpec)
      });
      
      if (attributes) {
        initialProfile.name = attributes.name || "";
        initialProfile.email = attributes.email || "";
      }
    } catch (error) {
      console.log("No se pudo obtener atributos de Cognito o usuario no logueado");
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <SettingsList initialData={initialProfile} />
    </div>
  );
}