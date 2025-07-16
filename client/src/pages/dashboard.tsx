import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Calendar, CreditCard, TrendingUp, TrendingDown, User, Mail } from "lucide-react";
import LuggstersLogo from "@/components/LuggstersLogo";

interface MembershipData {
  membership: {
    id: number;
    planId: number;
    status: string;
    startDate: string;
    endDate: string;
  };
  plan: {
    id: number;
    name: string;
    type: string;
    price: string;
    description: string;
    validityDays: number;
    features: string[];
  };
}

interface PlanChangeData {
  success: boolean;
  membership: any;
  plan: any;
  proratedAmount: number;
  paymentIntentId?: string;
  clientSecret?: string;
}

export default function Dashboard() {
  const [email, setEmail] = useState("");
  const [membershipData, setMembershipData] = useState<MembershipData | null>(null);
  const [showPlanChange, setShowPlanChange] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch membership plans
  const { data: plans = [] } = useQuery({
    queryKey: ["/api/membership-plans"],
    enabled: !!membershipData,
  });

  // Fetch membership by email
  const fetchMembership = async () => {
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await apiRequest("GET", `/api/membership/${email}`);
      const data = await response.json();
      setMembershipData(data);
      toast({
        title: "Membership Found",
        description: `Welcome back! Your ${data.plan.name} is active.`,
      });
    } catch (error: any) {
      toast({
        title: "Membership Not Found",
        description: "No active membership found for this email address.",
        variant: "destructive",
      });
    }
  };

  // Plan change mutation
  const planChangeMutation = useMutation({
    mutationFn: async ({ membershipId, newPlanId }: { membershipId: number; newPlanId: number }) => {
      const response = await apiRequest("POST", `/api/membership/${membershipId}/change-plan`, {
        newPlanId,
      });
      return response.json();
    },
    onSuccess: (data: PlanChangeData) => {
      if (data.proratedAmount > 0) {
        toast({
          title: "Upgrade Processing",
          description: `Additional charge of $${data.proratedAmount.toFixed(2)} for plan upgrade.`,
        });
      } else {
        toast({
          title: "Plan Changed Successfully",
          description: "Your membership plan has been updated.",
        });
      }
      
      // Refresh membership data
      fetchMembership();
      setShowPlanChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Plan Change Failed",
        description: error.message || "Failed to change plan. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePlanChange = (newPlanId: number) => {
    if (!membershipData) return;
    
    planChangeMutation.mutate({
      membershipId: membershipData.membership.id,
      newPlanId,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  if (!membershipData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-md mx-auto pt-20">
          <Card className="bg-white border-slate-200 shadow-lg">
            <CardHeader className="text-center pb-6">
              <LuggstersLogo className="mx-auto mb-4" size="lg" />
              <CardTitle className="text-2xl font-bold text-slate-800">
                Member Dashboard
              </CardTitle>
              <p className="text-slate-600">
                Enter your email to access your membership
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="email" className="text-slate-700 font-medium mb-2 block">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full"
                />
              </div>
              <Button
                onClick={fetchMembership}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <Mail className="w-4 h-4 mr-2" />
                Access Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto pt-8">
        <div className="mb-8">
          <LuggstersLogo className="mb-4" size="lg" />
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Member Dashboard</h1>
          <p className="text-slate-600">Manage your Luggsters membership</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Current Membership */}
          <Card className="bg-white border-slate-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Current Membership
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg text-slate-800">
                    {membershipData.plan.name}
                  </h3>
                  <p className="text-slate-600">{membershipData.plan.description}</p>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {membershipData.membership.status}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Price</p>
                  <p className="font-semibold text-lg text-green-600">
                    ${membershipData.plan.price}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Days Remaining</p>
                  <p className="font-semibold text-lg text-slate-800">
                    {getDaysRemaining(membershipData.membership.endDate)}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span className="text-sm text-slate-600">Membership Period</span>
                </div>
                <p className="text-sm text-slate-800">
                  {formatDate(membershipData.membership.startDate)} - {formatDate(membershipData.membership.endDate)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Plan Management */}
          <Card className="bg-white border-slate-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Plan Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Button
                  onClick={() => setShowPlanChange(!showPlanChange)}
                  className="w-full bg-slate-600 hover:bg-slate-700 text-white"
                >
                  {showPlanChange ? "Cancel" : "Change Plan"}
                </Button>
                
                {showPlanChange && (
                  <div className="space-y-3 p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600 mb-3">
                      Select a new plan:
                    </p>
                    {plans.map((plan: any) => (
                      <div
                        key={plan.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          plan.id === membershipData.plan.id
                            ? "border-green-500 bg-green-50"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                        onClick={() => plan.id !== membershipData.plan.id && handlePlanChange(plan.id)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-slate-800">{plan.name}</p>
                            <p className="text-sm text-slate-600">{plan.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-green-600">${plan.price}</p>
                            {plan.id === membershipData.plan.id && (
                              <Badge variant="secondary" className="mt-1">Current</Badge>
                            )}
                            {parseFloat(plan.price) > parseFloat(membershipData.plan.price) && (
                              <div className="flex items-center gap-1 mt-1">
                                <TrendingUp className="w-3 h-3 text-green-600" />
                                <span className="text-xs text-green-600">Upgrade</span>
                              </div>
                            )}
                            {parseFloat(plan.price) < parseFloat(membershipData.plan.price) && (
                              <div className="flex items-center gap-1 mt-1">
                                <TrendingDown className="w-3 h-3 text-orange-600" />
                                <span className="text-xs text-orange-600">Downgrade</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <Card className="bg-white border-slate-200 shadow-lg mt-6">
          <CardHeader>
            <CardTitle>Plan Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {membershipData.plan.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-slate-700">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}