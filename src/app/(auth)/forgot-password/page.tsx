
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { AuthCard } from "@/components/auth/auth-card";
import { Loader2, ArrowLeft, Send } from "lucide-react";
import Link from "next/link";

const forgotSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export default function ForgotPasswordPage() {
  const [isSent, setIsSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof forgotSchema>>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: z.infer<typeof forgotSchema>) {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSent(true);
    }, 1500);
  }

  return (
    <div className="min-h-screen auth-gradient flex items-center justify-center p-4">
      <AuthCard 
        title={isSent ? "Check your email" : "Reset password"} 
        description={isSent 
          ? "We have sent password recovery instructions to your email." 
          : "Enter your email address and we'll send you a link to reset your password."}
      >
        {!isSent ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl><Input placeholder="name@company.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full h-11" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <>Send Reset Link <Send className="ml-2 h-4 w-4" /></>
                )}
              </Button>
            </form>
          </Form>
        ) : (
          <Button variant="outline" className="w-full h-11" asChild>
            <Link href="/login">Back to Sign In</Link>
          </Button>
        )}
        
        {!isSent && (
          <div className="mt-8 pt-6 border-t border-border/50 text-center text-sm">
            <Link href="/login" className="text-muted-foreground hover:text-primary flex items-center justify-center font-medium">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
            </Link>
          </div>
        )}
      </AuthCard>
    </div>
  );
}
