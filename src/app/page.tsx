import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/auth";

export default async function HomePage() {
  // If already signed in, go straight to dashboard
  const user = await getUser();
  if (user) {
    redirect("/dashboard");
  }

  // Otherwise show the login/guest choice
  redirect("/login");
}
