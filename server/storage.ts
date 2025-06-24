import { users, membershipPlans, payments, type User, type InsertUser, type MembershipPlan, type Payment, type InsertPayment } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getMembershipPlans(): Promise<MembershipPlan[]>;
  getMembershipPlan(id: number): Promise<MembershipPlan | undefined>;
  createPayment(payment: Omit<InsertPayment, 'cardNumber' | 'expiryDate' | 'cvv' | 'terms'> & { status?: string }): Promise<Payment>;
  getPayment(id: number): Promise<Payment | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private membershipPlans: Map<number, MembershipPlan>;
  private payments: Map<number, Payment>;
  private currentUserId: number;
  private currentPlanId: number;
  private currentPaymentId: number;

  constructor() {
    this.users = new Map();
    this.membershipPlans = new Map();
    this.payments = new Map();
    this.currentUserId = 1;
    this.currentPlanId = 1;
    this.currentPaymentId = 1;

    // Initialize membership plans
    this.initializePlans();
  }

  private initializePlans() {
    const monthlyPlan: MembershipPlan = {
      id: this.currentPlanId++,
      name: "Monthly Membership",
      type: "monthly",
      price: "9.99",
      description: "Basic Plan - Valid for 30 days",
      validityDays: 30,
      features: ["Luggage protection coverage", "24/7 customer support", "Travel assistance"]
    };

    const annualPlan: MembershipPlan = {
      id: this.currentPlanId++,
      name: "Annual Membership", 
      type: "annual",
      price: "99.99",
      description: "Premium Plan - Valid for 365 days",
      validityDays: 365,
      features: ["Everything in Basic Plan", "Priority customer support", "Extended coverage limits", "Exclusive travel perks"]
    };

    this.membershipPlans.set(monthlyPlan.id, monthlyPlan);
    this.membershipPlans.set(annualPlan.id, annualPlan);
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getMembershipPlans(): Promise<MembershipPlan[]> {
    return Array.from(this.membershipPlans.values());
  }

  async getMembershipPlan(id: number): Promise<MembershipPlan | undefined> {
    return this.membershipPlans.get(id);
  }

  async createPayment(payment: Omit<InsertPayment, 'cardNumber' | 'expiryDate' | 'cvv' | 'terms'> & { status?: string }): Promise<Payment> {
    const id = this.currentPaymentId++;
    const newPayment: Payment = {
      ...payment,
      id,
      userId: null,
      status: payment.status || "pending",
      createdAt: new Date(),
    };
    this.payments.set(id, newPayment);
    return newPayment;
  }

  async getPayment(id: number): Promise<Payment | undefined> {
    return this.payments.get(id);
  }
}

export const storage = new MemStorage();
