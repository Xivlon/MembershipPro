import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import LuggstersLogo from "@/components/LuggstersLogo";
import PlanCard from "@/components/PlanCard";
import PaymentForm from "@/components/PaymentForm";
import { MembershipPlan } from "@shared/schema";

export default function MembershipPage() {
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null);

  const { data: plans = [], isLoading } = useQuery<MembershipPlan[]>({
    queryKey: ["/api/membership-plans"],
  });

  const handlePlanSelect = (plan: MembershipPlan) => {
    setSelectedPlan(plan);
  };

  const handlePaymentSuccess = () => {
    // In a real app, redirect to dashboard or success page
    window.location.href = "/";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-sm border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <LuggstersLogo />
            
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-slate-300 hover:text-white transition-colors">Home</a>
              <a href="#" className="text-slate-300 hover:text-white transition-colors">About</a>
              <a href="#" className="text-slate-300 hover:text-white transition-colors">Pricing</a>
              <a href="#" className="text-slate-300 hover:text-white transition-colors">Contact</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">Complete Your Membership</h2>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Choose your plan and enter your payment details to start your worry-free travel journey
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Plan Selection Section */}
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold text-white mb-6">Select Your Plan</h3>
            
            <div className="space-y-6">
              {plans.map((plan, index) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  isSelected={selectedPlan?.id === plan.id}
                  onSelect={handlePlanSelect}
                  isPopular={plan.type === 'annual'}
                />
              ))}
            </div>
          </div>

          {/* Payment Form Section */}
          <div>
            <PaymentForm 
              selectedPlan={selectedPlan}
              onPaymentSuccess={handlePaymentSuccess}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
