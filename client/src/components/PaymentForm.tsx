import { useState, useEffect } from "react";
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
import { insertPaymentSchema, type MembershipPlan } from "@shared/index";
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
      amount: selectedPlan ? parseFloat(selectedPlan.price) : 0,
      cardholderName: "",
      email: "",
      cardNumber: "",
      expiryDate: "",
      cvv: "",
      terms: false,
    },
  });

  // Update form values when selectedPlan changes
  useEffect(() => {
    if (selectedPlan) {
      form.setValue("planId", selectedPlan.id);
      form.setValue("amount", parseFloat(selectedPlan.price));
    }
  }, [selectedPlan, form]);

  const paymentMutation = useMutation({
    mutationFn: async (data: PaymentData) => {
      const response = await apiRequest("POST", "/api/payments", data);
      return response.json();
    },
    onSuccess: (data) => {
      setShowSuccess(true);
      toast({
        title: "Subscription Activated!",
        description: "Welcome to Luggsters! Your subscription is now active and will auto-renew.",
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
    console.log('Form submitted with data:', data);
    console.log('Selected plan:', selectedPlan);
    
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
      amount: parseFloat(selectedPlan.price),
    };

    console.log('Submitting payment data:', paymentData);
    paymentMutation.mutate(paymentData);
  };

  if (showSuccess) {
    return (
      <Card className="bg-white border-slate-200 shadow-lg">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-4">Subscription Activated!</h3>
          <p className="text-slate-600 mb-6">
            Welcome to Luggsters! Your subscription is now active and will automatically renew. You're all set for worry-free travel protection.
          </p>
          <Button 
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold"
            onClick={onPaymentSuccess}
          >
            Get Started
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-slate-200 shadow-lg">
      <CardContent className="p-8">
        <h3 className="text-2xl font-semibold text-slate-800 mb-6">Payment Details</h3>
        
        {/* Plan Summary */}
        <div className="bg-slate-50 rounded-xl p-6 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold text-slate-700 text-lg">
                {selectedPlan?.name || "Select a plan"}
              </h4>
              <p className="text-slate-500 text-sm mt-1">
                {selectedPlan?.description || "Choose your membership plan first"}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">
                ${selectedPlan?.price || "0.00"}
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Card Number */}
          <div>
            <Label htmlFor="cardNumber" className="text-slate-700 font-medium mb-2 block">Card Number</Label>
            <div className="relative">
              <Input
                id="cardNumber"
                placeholder="1234 5678 9012 3456"
                className="pl-12 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:ring-slate-500 py-3"
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
              <Label htmlFor="expiryDate" className="text-slate-700 font-medium mb-2 block">Expiry Date</Label>
              <Input
                id="expiryDate"
                placeholder="MM/YY"
                maxLength={5}
                className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:ring-slate-500 py-3"
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
              <Label htmlFor="cvv" className="text-slate-700 font-medium mb-2 block">CVV</Label>
              <Input
                id="cvv"
                placeholder="123"
                maxLength={4}
                className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:ring-slate-500 py-3"
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
            <Label htmlFor="cardholderName" className="text-slate-700 font-medium mb-2 block">Cardholder Name</Label>
            <Input
              id="cardholderName"
              placeholder="John Doe"
              className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:ring-slate-500 py-3"
              {...form.register("cardholderName")}
            />
            {form.formState.errors.cardholderName && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.cardholderName.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email" className="text-slate-700 font-medium mb-2 block">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:ring-slate-500 py-3"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.email.message}</p>
            )}
          </div>

          {/* Security Notice */}
          <div className="bg-slate-50 rounded-lg p-4 flex items-start space-x-3">
            <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-800">Secure Payment</p>
              <p className="text-xs text-slate-600">Your payment information is encrypted and secure</p>
            </div>
            <div className="flex items-center space-x-2">
              <Lock className="w-4 h-4 text-slate-500" />
              <span className="text-xs text-slate-500">SSL</span>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="terms"
              checked={form.watch("terms")}
              onChange={(e) => form.setValue("terms", e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-green-600 focus:ring-green-500 focus:ring-2"
            />
            <label htmlFor="terms" className="text-sm text-slate-600 leading-relaxed cursor-pointer">
              I agree to the{" "}
              <span className="text-slate-600 hover:text-slate-800 underline cursor-pointer">
                Terms of Service
              </span>{" "}
              and{" "}
              <span className="text-slate-600 hover:text-slate-800 underline cursor-pointer">
                Privacy Policy
              </span>
            </label>
          </div>
          {form.formState.errors.terms && (
            <p className="text-red-500 text-sm mt-1">{form.formState.errors.terms.message}</p>
          )}

          {/* Complete Payment Button */}
          <Button
            type="submit"
            disabled={paymentMutation.isPending || !selectedPlan}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 text-base rounded-lg transition-colors"
            onClick={() => {
              console.log('Payment button clicked');
              console.log('Form errors:', form.formState.errors);
              console.log('Form values:', form.getValues());
              console.log('Form is valid:', form.formState.isValid);
            }}
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
              <Shield className="w-4 h-4 text-slate-500" />
              <span className="text-xs text-slate-500">256-bit SSL</span>
            </div>
            <div className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-slate-500" />
              <span className="text-xs text-slate-500">Secure Processing</span>
            </div>
            <div className="flex items-center space-x-2">
              <Lock className="w-4 h-4 text-slate-500" />
              <span className="text-xs text-slate-500">PCI Compliant</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
