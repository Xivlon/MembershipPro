import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertPaymentSchema, MembershipPlan } from "@shared/schema";
import { CreditCard, Shield, Lock, CheckCircle, Loader2 } from "lucide-react";
import { z } from "zod";

interface PaymentFormProps {
  selectedPlan: MembershipPlan | null;
  onPaymentSuccess: () => void;
}

type PaymentData = z.infer<typeof insertPaymentSchema>;

export default function PaymentForm({ selectedPlan, onPaymentSuccess }: PaymentFormProps) {
  const { toast } = useToast();
  const [showSuccess, setShowSuccess] = useState(false);

  const form = useForm<PaymentData>({
    resolver: zodResolver(insertPaymentSchema),
    defaultValues: {
      planId: selectedPlan?.id || 0,
      amount: selectedPlan?.price || "0",
      cardholderName: "",
      email: "",
      cardNumber: "",
      expiryDate: "",
      cvv: "",
      terms: false,
    },
  });

  const paymentMutation = useMutation({
    mutationFn: async (data: PaymentData) => {
      const response = await apiRequest("POST", "/api/payments", data);
      return response.json();
    },
    onSuccess: (data) => {
      setShowSuccess(true);
      toast({
        title: "Payment Successful!",
        description: "Welcome to Luggsters! Your membership is now active.",
      });
      setTimeout(() => {
        onPaymentSuccess();
      }, 3000);
    },
    onError: (error: any) => {
      toast({
        title: "Payment Failed",
        description: error.message || "Please check your card details and try again.",
        variant: "destructive",
      });
    },
  });

  const formatCardNumber = (value: string) => {
    return value
      .replace(/\s/g, '')
      .replace(/(.{4})/g, '$1 ')
      .trim()
      .slice(0, 19);
  };

  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  const onSubmit = (data: PaymentData) => {
    if (!selectedPlan) {
      toast({
        title: "No Plan Selected",
        description: "Please select a membership plan first.",
        variant: "destructive",
      });
      return;
    }

    // Update form data with selected plan details
    const paymentData = {
      ...data,
      planId: selectedPlan.id,
      amount: selectedPlan.price,
    };

    paymentMutation.mutate(paymentData);
  };

  if (showSuccess) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-luggsters-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-4">Payment Successful!</h3>
          <p className="text-slate-600 mb-6">
            Welcome to Luggsters! Your membership is now active and you're ready for worry-free travel.
          </p>
          <Button 
            className="w-full bg-gradient-to-r from-luggsters-green-500 to-luggsters-green-600 hover:from-luggsters-green-600 hover:to-luggsters-green-700"
            onClick={onPaymentSuccess}
          >
            Get Started
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-8">
        <h3 className="text-2xl font-semibold text-slate-800 mb-6">Payment Details</h3>
        
        {/* Plan Summary */}
        <div className="bg-slate-50 rounded-xl p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-semibold text-slate-800">
                {selectedPlan?.name || "Select a plan"}
              </h4>
              <p className="text-slate-600 text-sm">
                {selectedPlan?.description || "Choose your membership plan first"}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-luggsters-green-600">
                ${selectedPlan?.price || "0.00"}
              </div>
              <div className="text-slate-500 text-sm">
                {selectedPlan?.type === 'monthly' ? 'per month' : selectedPlan?.type === 'annual' ? 'per year' : '-'}
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Card Number */}
          <div>
            <Label htmlFor="cardNumber">Card Number</Label>
            <div className="relative">
              <Input
                id="cardNumber"
                placeholder="1234 5678 9012 3456"
                className="pl-12"
                {...form.register("cardNumber")}
                onChange={(e) => {
                  const formatted = formatCardNumber(e.target.value);
                  form.setValue("cardNumber", formatted);
                }}
              />
              <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            </div>
            {form.formState.errors.cardNumber && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.cardNumber.message}</p>
            )}
          </div>

          {/* Expiry and CVV */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input
                id="expiryDate"
                placeholder="MM/YY"
                maxLength={5}
                {...form.register("expiryDate")}
                onChange={(e) => {
                  const formatted = formatExpiryDate(e.target.value);
                  form.setValue("expiryDate", formatted);
                }}
              />
              {form.formState.errors.expiryDate && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.expiryDate.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="cvv">CVV</Label>
              <Input
                id="cvv"
                placeholder="123"
                maxLength={4}
                {...form.register("cvv")}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  form.setValue("cvv", value);
                }}
              />
              {form.formState.errors.cvv && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.cvv.message}</p>
              )}
            </div>
          </div>

          {/* Cardholder Name */}
          <div>
            <Label htmlFor="cardholderName">Cardholder Name</Label>
            <Input
              id="cardholderName"
              placeholder="John Doe"
              {...form.register("cardholderName")}
            />
            {form.formState.errors.cardholderName && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.cardholderName.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.email.message}</p>
            )}
          </div>

          {/* Security Notice */}
          <div className="bg-slate-50 rounded-lg p-4 flex items-center space-x-3">
            <Shield className="w-5 h-5 text-luggsters-green-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-slate-800">Secure Payment</p>
              <p className="text-xs text-slate-600">Your payment information is encrypted and secure</p>
            </div>
            <div className="flex items-center space-x-2 ml-auto">
              <Lock className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-500">SSL</span>
            </div>
          </div>

          {/* Terms */}
          <div className="flex items-start space-x-3">
            <Checkbox
              id="terms"
              checked={form.watch("terms")}
              onCheckedChange={(checked) => form.setValue("terms", !!checked)}
            />
            <Label htmlFor="terms" className="text-sm text-slate-600 leading-relaxed">
              I agree to the{" "}
              <span className="text-luggsters-green-600 hover:text-luggsters-green-700 underline cursor-pointer">
                Terms of Service
              </span>{" "}
              and{" "}
              <span className="text-luggsters-green-600 hover:text-luggsters-green-700 underline cursor-pointer">
                Privacy Policy
              </span>
            </Label>
          </div>
          {form.formState.errors.terms && (
            <p className="text-red-500 text-sm">{form.formState.errors.terms.message}</p>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={paymentMutation.isPending || !selectedPlan}
            className="w-full bg-gradient-to-r from-luggsters-green-500 to-luggsters-green-600 hover:from-luggsters-green-600 hover:to-luggsters-green-700 text-white font-semibold py-4 h-auto"
          >
            {paymentMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              "Complete Payment"
            )}
          </Button>
        </form>

        {/* Trust Badges */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <div className="flex justify-center items-center space-x-6 opacity-70">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-500">256-bit SSL</span>
            </div>
            <div className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-500">Secure Processing</span>
            </div>
            <div className="flex items-center space-x-2">
              <Lock className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-500">PCI Compliant</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
