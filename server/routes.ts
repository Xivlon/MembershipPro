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

  // Process subscription payment
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

      // Create or retrieve customer
      let customer;
      try {
        const existingCustomers = await stripe.customers.list({
          email: paymentData.email,
          limit: 1,
        });
        
        if (existingCustomers.data.length > 0) {
          customer = existingCustomers.data[0];
        } else {
          customer = await stripe.customers.create({
            email: paymentData.email,
            name: paymentData.cardholderName,
          });
        }
      } catch (customerError) {
        console.error("Customer creation error:", customerError);
        return res.status(400).json({ message: "Failed to create customer" });
      }

      // Create Stripe product and price for subscription
      const product = await stripe.products.create({
        name: plan.name,
        description: plan.description,
      });

      const price = await stripe.prices.create({
        unit_amount: Math.round(paymentData.amount * 100), // Convert to cents
        currency: 'usd',
        recurring: {
          interval: plan.type === 'monthly' ? 'month' : 'year',
        },
        product: product.id,
      });

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: price.id }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });

      // Create payment record (excluding sensitive card data)
      const payment = await storage.createPayment({
        planId: paymentData.planId,
        amount: paymentForStorage.amount,
        cardholderName: paymentData.cardholderName,
        email: paymentData.email,
        status: "active",
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: customer.id
      });

      res.json({
        success: true,
        payment: {
          id: payment.id,
          planId: payment.planId,
          amount: payment.amount,
          status: payment.status,
          createdAt: payment.createdAt,
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: customer.id
        },
        plan: {
          name: plan.name,
          type: plan.type,
          validityDays: plan.validityDays
        },
        subscription: {
          id: subscription.id,
          status: subscription.status,
          clientSecret: subscription.latest_invoice.payment_intent.client_secret
        }
      });
    } catch (error) {
      console.error("Subscription processing error:", error);
      if (error instanceof Stripe.errors.StripeError) {
        return res.status(400).json({ 
          message: `Subscription failed: ${error.message}` 
        });
      }
      res.status(500).json({ message: "Subscription processing failed. Please try again." });
    }
  });

  // Create subscription for Stripe
  app.post("/api/create-subscription", async (req, res) => {
    try {
      const { planId, email, cardholderName } = req.body;
      
      // Verify plan exists
      const plan = await storage.getMembershipPlan(planId);
      if (!plan) {
        return res.status(404).json({ message: "Selected plan not found" });
      }

      // Create or retrieve customer
      let customer;
      try {
        const existingCustomers = await stripe.customers.list({
          email: email,
          limit: 1,
        });
        
        if (existingCustomers.data.length > 0) {
          customer = existingCustomers.data[0];
        } else {
          customer = await stripe.customers.create({
            email: email,
            name: cardholderName,
          });
        }
      } catch (customerError) {
        console.error("Customer creation error:", customerError);
        return res.status(400).json({ message: "Failed to create customer" });
      }

      // Create Stripe product and price for subscription
      const product = await stripe.products.create({
        name: plan.name,
        description: plan.description,
      });

      const price = await stripe.prices.create({
        unit_amount: Math.round(parseFloat(plan.price) * 100), // Convert to cents
        currency: 'usd',
        recurring: {
          interval: plan.type === 'monthly' ? 'month' : 'year',
        },
        product: product.id,
      });

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: price.id }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });

      res.json({
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice.payment_intent.client_secret,
        customerId: customer.id,
        priceId: price.id,
        amount: plan.price,
        planName: plan.name
      });
    } catch (error) {
      console.error("Subscription creation error:", error);
      if (error instanceof Stripe.errors.StripeError) {
        return res.status(400).json({ 
          message: `Subscription creation failed: ${error.message}` 
        });
      }
      res.status(500).json({ message: "Subscription creation failed. Please try again." });
    }
  });

  // Stripe webhook endpoint for subscription events
  app.post("/api/webhook", async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (err) {
      console.log(`Webhook signature verification failed.`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
        console.log('Subscription created:', event.data.object);
        break;
      case 'customer.subscription.updated':
        console.log('Subscription updated:', event.data.object);
        break;
      case 'customer.subscription.deleted':
        console.log('Subscription cancelled:', event.data.object);
        // Update payment status to cancelled
        break;
      case 'invoice.payment_succeeded':
        console.log('Payment succeeded:', event.data.object);
        break;
      case 'invoice.payment_failed':
        console.log('Payment failed:', event.data.object);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
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
