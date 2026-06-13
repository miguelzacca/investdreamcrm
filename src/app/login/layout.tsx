import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LoginLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  
  if (session?.user) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
