
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

const signupSchema = z.object({
  firstName: z.string().min(2, "First name is too short"),
  lastName: z.string().min(2, "Last name is too short"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(10, "Password must be at least 10 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[0-9]/, "Must contain a number"),
});

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    },
  });

  const nextStep = async () => {
    const fields = step === 1 ? ["firstName", "lastName"] : ["email"];
    const isValid = await form.trigger(fields as any);
    if (isValid) setStep(step + 1);
  };

  async function onSubmit(values: z.infer<typeof signupSchema>) {
    setIsLoading(true);
    // Simulate GHL contact creation + account setup
    setTimeout(() => {
      document.cookie = "koreauth_session=mock_token; path=/";
      toast({
        title: "Account Created",
        description: "Welcome to KoreAuth. Your CRM profile is synced.",
      });
      setIsLoading(false);
      router.push("/dashboard");
    }, 2000);
  }

  const progress = (step / 3) * 100;

  return (
    <div className="min-h-screen auth-gradient flex items-center justify-center p-4">
      <AuthCard 
        title="Get Started" 
        description="Join thousands of teams managing identity securely."
      >
        <div className="mb-8 space-y-2">
          <div className="flex justify-between text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <span>Step {step} of 3</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-1" />
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl><Input placeholder="Alex" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl><Input placeholder="Sterling" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="button" onClick={nextStep} className="w-full h-11">
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Work Email</FormLabel>
                      <FormControl><Input placeholder="alex@company.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-4">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1 h-11">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button type="button" onClick={nextStep} className="flex-[2] h-11">
                    Continue <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Create Password</FormLabel>
                      <FormControl><Input type="password" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-4">
                  <Button type="button" variant="outline" onClick={() => setStep(2)} className="h-11">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Button type="submit" className="flex-1 h-11" disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <>Create Account <CheckCircle2 className="ml-2 h-4 w-4" /></>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </Form>

        <div className="mt-8 pt-6 border-t border-border/50 text-center text-sm">
          <span className="text-muted-foreground">Already have an account? </span>
          <Link href="/login" className="text-primary hover:underline font-medium">
            Sign In
          </Link>
        </div>
      </AuthCard>
    </div>
  );
}
