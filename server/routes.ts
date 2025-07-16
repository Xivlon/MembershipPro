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
