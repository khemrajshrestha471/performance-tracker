"use client";

import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-6 bg-background p-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/20 text-destructive">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Unauthorized Access
        </h1>
        <p className="max-w-md text-muted-foreground">
          You don&apos;t have permission to view this page. Please contact your
          administrator if you believe this is an error.
        </p>
      </div>
      <div className="flex gap-4">
        <Button asChild variant="outline">
          <Link href="/dashboard">Return to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}