"use client";

import * as React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LogOut, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ProfileForm, ProfileFormValues } from "./profile-form";
import type { Session } from "@supabase/supabase-js";

type Profile = {
  first_name: string | null;
  last_name: string | null;
};

export function UserNav() {
  const [session, setSession] = React.useState<Session | null>(null);
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
    };
    getSession();
  }, []);

  const fetchProfile = React.useCallback(async () => {
    if (!session) return;
    const { data, error } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", session.user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116: no rows found, which is fine on first load
      toast.error("Failed to load profile.");
      console.error("Profile fetch error:", error.message);
    } else {
      setProfile(data);
    }
  }, [session]);

  React.useEffect(() => {
    if (session) {
      fetchProfile();
    }
  }, [session, fetchProfile]);

  const handleLogout = async () => {
    toast("Logging out...");
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleProfileUpdate = async (values: ProfileFormValues) => {
    if (!session) return;
    setIsSubmitting(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: values.first_name,
        last_name: values.last_name,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.user.id);

    setIsSubmitting(false);

    if (error) {
      toast.error(`Failed to update profile: ${error.message}`);
    } else {
      toast.success("Profile updated successfully!");
      fetchProfile(); // Re-fetch profile to update UI
      setIsProfileDialogOpen(false);
    }
  };

  const getInitials = () => {
    if (!profile && !session?.user.email) return "U";
    const { first_name, last_name } = profile || {};
    if (first_name && last_name) {
      return `${first_name[0]}${last_name[0]}`;
    }
    if (first_name) {
      return first_name.substring(0, 2);
    }
    if (session?.user.email) {
      return session.user.email.substring(0, 2);
    }
    return "U";
  };

  return (
    <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{getInitials().toUpperCase()}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {profile?.first_name || "User"} {profile?.last_name || ""}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {session?.user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DialogTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
            </DialogTrigger>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <ProfileForm
          onSubmit={handleProfileUpdate}
          initialData={profile ?? {}}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}