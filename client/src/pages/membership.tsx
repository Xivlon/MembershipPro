import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import LuggstersLogo from "@/components/LuggstersLogo";
import PlanCard from "@/components/PlanCard";
import PaymentForm from "@/components/PaymentForm";
import type { MembershipPlan } from "@shared/index";

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
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 to-gray-800">
      {/* Header */}
      <header className="w-full bg-black/50 backdrop-blur-sm border-b border-slate-700/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
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
      <main className="w-full">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Page Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Complete Your Membership</h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Choose your plan and enter your payment details to start your worry-free travel journey
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            {/* Plan Selection Section */}
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold text-white mb-8">Select Your Plan</h3>
              
              <div className="space-y-6">
                {plans.map((plan, index) => (
                  <div
                    key={plan.id}
                    className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedPlan?.id === plan.id
                        ? 'border-amber-500 bg-amber-500/10'
                        : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                    }`}
                    onClick={() => handlePlanSelect(plan)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-lg font-semibold text-white">{plan.name}</h4>
                        <p className="text-slate-400 text-sm mt-1">{plan.description}</p>
                        <ul className="text-sm text-slate-300 mt-3 space-y-1">
                          {plan.features.slice(0, 3).map((feature, idx) => (
                            <li key={idx}>• {feature}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-amber-400">${plan.price}</span>
                        <p className="text-slate-400 text-sm">per {plan.type === 'monthly' ? 'month' : 'year'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Form Section */}
            <div className="flex items-start">
              <div className="w-full">
                <PaymentForm 
                  selectedPlan={selectedPlan}
                  onPaymentSuccess={handlePaymentSuccess}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
