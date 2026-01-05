import { Schema, model } from "mongoose";
import { ICustomer, ICustomerModel } from "../../types/billing.types";

// Customer schema
const customerSchema = new Schema<ICustomer>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: [true, "Workspace ID is required"],
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    stripeCustomerId: {
      type: String,
      required: [true, "Stripe customer ID is required"],
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  }
);

// Indexes
customerSchema.index({ workspaceId: 1 });
customerSchema.index({ userId: 1 });
customerSchema.index({ stripeCustomerId: 1 });
customerSchema.index({ email: 1 });
customerSchema.index({ createdAt: -1 });

// Static methods
customerSchema.statics.findByWorkspace = function (workspaceId: string) {
  return this.findOne({ workspaceId });
};

customerSchema.statics.findByStripeCustomerId = function (
  stripeCustomerId: string
) {
  return this.findOne({ stripeCustomerId });
};

// Export the model
export const Customer = model<ICustomer, ICustomerModel>(
  "Customer",
  customerSchema
);
export default Customer;
