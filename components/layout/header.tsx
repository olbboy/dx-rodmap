"use client";

import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/supabase/auth";
import { useRouter } from "next/navigation";
import { User } from "lucide-react";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/auth/sign-in");
    router.refresh();
  };

  // Get the current page title from the pathname
  const getPageTitle = () => {
    const path = pathname.split("/")[1];
    if (!path) return "Home";
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  return (
    <header className="h-16 border-b border-border flex items-center justify-between px-4 md:px-6">
      <h1 className="text-lg font-semibold">{getPageTitle()}</h1>
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={handleSignOut}
        >
          <User className="h-4 w-4" />
          <span className="hidden md:inline">Sign out</span>
        </Button>
      </div>
    </header>
  );
} 