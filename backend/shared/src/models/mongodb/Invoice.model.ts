import { Schema, model } from "mongoose";
import { IInvoice, IInvoiceModel } from "../../types";

// Invoice schema
const invoiceSchema = new Schema<IInvoice>(
  {
    stripeInvoiceId: {
      type: String,
      sparse: true,
      index: true,
    },
    subscriptionId: {
      type: Schema.Types.ObjectId,
      ref: "Subscription",
      index: true,
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: [true, "Workspace ID is required"],
      index: true,
    },
    amountDue: {
      type: Number,
      required: [true, "Amount due is required"],
      min: [0, "Amount due cannot be negative"],
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: [0, "Amount paid cannot be negative"],
    },
    currency: {
      type: String,
      required: [true, "Currency is required"],
      uppercase: true,
      default: "USD",
    },
    status: {
      type: String,
      required: [true, "Status is required"],
      enum: ["draft", "open", "paid", "void", "uncollectible"],
      default: "draft",
      index: true,
    },
    periodStart: {
      type: Date,
      index: true,
    },
    periodEnd: {
      type: Date,
      index: true,
    },
    lines: [
      {
        description: {
          type: String,
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
        quantity: {
          type: Number,
          default: 1,
        },
        period: {
          start: Date,
          end: Date,
        },
      },
    ],
    pdfUrl: {
      type: String,
    },
    hostedInvoiceUrl: {
      type: String,
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
invoiceSchema.index({ workspaceId: 1, status: 1 });
invoiceSchema.index({ subscriptionId: 1, status: 1 });
invoiceSchema.index({ stripeInvoiceId: 1 });
invoiceSchema.index({ status: 1, createdAt: -1 });
invoiceSchema.index({ createdAt: -1 });

// Static methods
invoiceSchema.statics.findByWorkspace = function (
  workspaceId: string,
  limit = 50
) {
  return this.find({ workspaceId }).sort({ createdAt: -1 }).limit(limit);
};

invoiceSchema.statics.findBySubscription = function (subscriptionId: string) {
  return this.find({ subscriptionId }).sort({ createdAt: -1 });
};

// Virtual for checking if invoice is paid
invoiceSchema.virtual("isPaid").get(function () {
  return this.status === "paid";
});

// Virtual for checking if invoice is open
invoiceSchema.virtual("isOpen").get(function () {
  return this.status === "open";
});

// Export the model
export const Invoice = model<IInvoice, IInvoiceModel>("Invoice", invoiceSchema);
export default Invoice;
