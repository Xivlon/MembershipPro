import { Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MembershipPlan } from "@shared/schema";

interface PlanCardProps {
  plan: MembershipPlan;
  isSelected: boolean;
  onSelect: (plan: MembershipPlan) => void;
  isPopular?: boolean;
}

export default function PlanCard({ plan, isSelected, onSelect, isPopular = false }: PlanCardProps) {
  return (
    <div className="relative">
      {isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-gradient-to-r from-luggsters-green-500 to-luggsters-green-600 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
            Most Popular
          </div>
        </div>
      )}
      
      <Card 
        className={`cursor-pointer transition-all hover:border-luggsters-green-400 ${
          isSelected 
            ? 'border-luggsters-green-500 bg-luggsters-green-50 border-2' 
            : 'border-transparent border-2'
        }`}
        onClick={() => onSelect(plan)}
      >
        <CardContent className="p-8">
          <div className="text-center">
            <h4 className="text-2xl font-bold text-slate-800 mb-2">{plan.name}</h4>
            <div className="mb-4">
              <span className="text-5xl font-bold text-luggsters-green-500">${plan.price}</span>
              <span className="text-slate-500 text-lg ml-2">
                per {plan.type === 'monthly' ? 'month' : 'year'}
              </span>
            </div>
            <p className="text-luggsters-green-600 font-semibold text-lg mb-2">
              {plan.type === 'monthly' ? 'Basic Plan' : 'Premium Plan'}
            </p>
            <p className="text-slate-500 mb-6">Valid for {plan.validityDays} days</p>
            
            <div className="space-y-3 mb-8 text-left">
              {plan.features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-luggsters-green-500 flex-shrink-0" />
                  <span className="text-slate-700">{feature}</span>
                </div>
              ))}
            </div>
            
            <Button 
              className="w-full bg-gradient-to-r from-luggsters-green-500 to-luggsters-green-600 hover:from-luggsters-green-600 hover:to-luggsters-green-700 text-white font-semibold py-4 h-auto"
              onClick={() => onSelect(plan)}
            >
              Select Plan
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
