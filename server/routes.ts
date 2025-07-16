import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPaymentSchema } from "@shared/schema";
import { z } from "zod";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Get membership plans
  app.get("/api/membership-plans", async (req, res) => {
    try {
      const plans = await storage.getMembershipPlans();
      res.json(plans);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch membership plans" });
    }
  });

  // Get specific membership plan
  app.get("/api/membership-plans/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid plan ID" });
      }

      const plan = await storage.getMembershipPlan(id);
      if (!plan) {
        return res.status(404).json({ message: "Plan not found" });
      }

      res.json(plan);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch membership plan" });
    }
  });

  // Process payment
  app.post("/api/payments", async (req, res) => {
    try {
      // Validate request body
      const validationResult = insertPaymentSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid payment data",
          errors: validationResult.error.errors
        });
      }

      const paymentData = validationResult.data;
      
      // Convert amount to string for storage (Drizzle decimal type expects string)
      const paymentForStorage = {
        ...paymentData,
        amount: paymentData.amount.toString()
      };
      
      // Verify plan exists
      const plan = await storage.getMembershipPlan(paymentData.planId);
      if (!plan) {
        return res.status(404).json({ message: "Selected plan not found" });
      }

      // Create Stripe payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(paymentData.amount * 100), // Convert to cents
        currency: 'usd',
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          planId: paymentData.planId.toString(),
          email: paymentData.email,
          cardholderName: paymentData.cardholderName,
        },
      });

      // For demo purposes, we'll simulate card processing
      // In a real app, you'd handle the payment intent on the frontend with Stripe Elements
      const isPaymentSuccessful = Math.random() > 0.1; // 90% success rate for demo

      if (!isPaymentSuccessful) {
        return res.status(400).json({ 
          message: "Payment failed. Please check your card details and try again." 
        });
      }

      // Create payment record (excluding sensitive card data)
      const payment = await storage.createPayment({
        planId: paymentData.planId,
        amount: paymentForStorage.amount,
        cardholderName: paymentData.cardholderName,
        email: paymentData.email,
        status: "completed"
      });

      // Create user membership
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + plan.validityDays);
      
      await storage.createUserMembership({
        userId: 1, // For demo purposes, using user ID 1
        planId: paymentData.planId,
        status: "active",
        endDate: endDate,
        stripeSubscriptionId: paymentIntent.id
      });

      res.json({
        success: true,
        payment: {
          id: payment.id,
          planId: payment.planId,
          amount: payment.amount,
          status: payment.status,
          createdAt: payment.createdAt,
          stripePaymentIntentId: paymentIntent.id
        },
        plan: {
          name: plan.name,
          type: plan.type,
          validityDays: plan.validityDays
        }
      });
    } catch (error) {
      console.error("Payment processing error:", error);
      if (error instanceof Stripe.errors.StripeError) {
        return res.status(400).json({ 
          message: `Payment failed: ${error.message}` 
        });
      }
      res.status(500).json({ message: "Payment processing failed. Please try again." });
    }
  });

  // Create payment intent for Stripe
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { planId, email, cardholderName } = req.body;
      
      // Verify plan exists
      const plan = await storage.getMembershipPlan(planId);
      if (!plan) {
        return res.status(404).json({ message: "Selected plan not found" });
      }

      // Create Stripe payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(plan.price * 100), // Convert to cents
        currency: 'usd',
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          planId: planId.toString(),
          email: email,
          cardholderName: cardholderName,
        },
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: plan.price,
        planName: plan.name
      });
    } catch (error) {
      console.error("Payment intent creation error:", error);
      if (error instanceof Stripe.errors.StripeError) {
        return res.status(400).json({ 
          message: `Payment intent creation failed: ${error.message}` 
        });
      }
      res.status(500).json({ message: "Payment intent creation failed. Please try again." });
    }
  });

  // Get user membership by email
  app.get("/api/membership/:email", async (req, res) => {
    try {
      const email = req.params.email;
      const membership = await storage.getUserMembershipByEmail(email);
      
      if (!membership) {
        return res.status(404).json({ message: "No active membership found" });
      }

      const plan = await storage.getMembershipPlan(membership.planId);
      if (!plan) {
        return res.status(404).json({ message: "Plan not found" });
      }

      res.json({
        membership: {
          id: membership.id,
          planId: membership.planId,
          status: membership.status,
          startDate: membership.startDate,
          endDate: membership.endDate,
        },
        plan: {
          id: plan.id,
          name: plan.name,
          type: plan.type,
          price: plan.price,
          description: plan.description,
          validityDays: plan.validityDays,
          features: plan.features,
        }
      });
    } catch (error) {
      console.error("Get membership error:", error);
      res.status(500).json({ message: "Failed to fetch membership" });
    }
  });

  // Upgrade/downgrade membership
  app.post("/api/membership/:membershipId/change-plan", async (req, res) => {
    try {
      const membershipId = parseInt(req.params.membershipId);
      const { newPlanId } = req.body;

      if (isNaN(membershipId) || !newPlanId) {
        return res.status(400).json({ message: "Invalid membership ID or plan ID" });
      }

      // Get current membership
      const currentMembership = await storage.getUserMembership(membershipId);
      if (!currentMembership) {
        return res.status(404).json({ message: "Membership not found" });
      }

      // Get current and new plans
      const currentPlan = await storage.getMembershipPlan(currentMembership.planId);
      const newPlan = await storage.getMembershipPlan(newPlanId);
      
      if (!currentPlan || !newPlan) {
        return res.status(404).json({ message: "Plan not found" });
      }

      // Calculate proration
      const currentPrice = parseFloat(currentPlan.price);
      const newPrice = parseFloat(newPlan.price);
      const daysRemaining = currentMembership.endDate 
        ? Math.ceil((new Date(currentMembership.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      let proratedAmount = 0;
      if (newPrice > currentPrice) {
        // Upgrade: charge difference
        const dailyCurrentRate = currentPrice / currentPlan.validityDays;
        const dailyNewRate = newPrice / newPlan.validityDays;
        proratedAmount = (dailyNewRate - dailyCurrentRate) * daysRemaining;
      } else {
        // Downgrade: credit difference (for demo, we'll just set to 0)
        proratedAmount = 0;
      }

      // Create Stripe payment intent for the prorated amount if needed
      let paymentIntent = null;
      if (proratedAmount > 0) {
        paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(proratedAmount * 100),
          currency: 'usd',
          automatic_payment_methods: { enabled: true },
          metadata: {
            membershipId: membershipId.toString(),
            planChange: 'upgrade',
            originalPlanId: currentPlan.id.toString(),
            newPlanId: newPlan.id.toString(),
          },
        });
      }

      // Update membership
      const newEndDate = new Date();
      newEndDate.setDate(newEndDate.getDate() + newPlan.validityDays);
      
      const updatedMembership = await storage.updateUserMembership(membershipId, {
        planId: newPlanId,
        endDate: newEndDate,
        stripeSubscriptionId: paymentIntent?.id || currentMembership.stripeSubscriptionId,
      });

      res.json({
        success: true,
        membership: updatedMembership,
        plan: newPlan,
        proratedAmount: proratedAmount,
        paymentIntentId: paymentIntent?.id,
        clientSecret: paymentIntent?.client_secret,
      });
    } catch (error) {
      console.error("Plan change error:", error);
      if (error instanceof Stripe.errors.StripeError) {
        return res.status(400).json({ 
          message: `Plan change failed: ${error.message}` 
        });
      }
      res.status(500).json({ message: "Plan change failed. Please try again." });
    }
  });

  // Get payment status
  app.get("/api/payments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid payment ID" });
      }

      const payment = await storage.getPayment(id);
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      // Don't return sensitive data
      res.json({
        id: payment.id,
        planId: payment.planId,
        amount: payment.amount,
        status: payment.status,
        createdAt: payment.createdAt
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payment" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
