import { z } from 'zod';

// Product schemas
export const PaypalProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  type: z.enum(['SERVICE', 'PHYSICAL'], "Type must be SERVICE or PHYSICAL"),
  category: z.string().min(1, "Category is required"),
  image_url: z.string().url("Invalid image URL"),
  home_url: z.string().url("Invalid home URL")
});

export const PaypalProductPatchSchema = z.array(z.object({
  op: z.enum(['add', 'remove', 'replace']),
  path: z.string(),
  value: z.union([z.string(), z.number(), z.boolean(), z.object({})])
}));

// Plan schemas
export const PaypalPlanFrequencySchema = z.object({
  interval_unit: z.enum(['DAY', 'WEEK', 'MONTH', 'YEAR']),
  interval_count: z.number().int().min(1)
});

export const PaypalPlanPricingSchemeSchema = z.object({
  fixed_price: z.object({
    value: z.string(),
    currency_code: z.string().length(3)
  }).optional(),
  pricing_model: z.enum(['VOLUME', 'TIERED']).optional(),
  tiers: z.array(z.object({
    starting_quantity: z.string(),
    ending_quantity: z.string().optional(),
    amount: z.object({
      value: z.string(),
      currency_code: z.string().length(3)
    })
  })).optional()
});

export const PaypalPlanBillingCycleSchema = z.object({
  frequency: PaypalPlanFrequencySchema,
  tenure_type: z.enum(['TRIAL', 'REGULAR']),
  sequence: z.number().int().min(1),
  total_cycles: z.number().int().min(0),
  pricing_scheme: PaypalPlanPricingSchemeSchema
});

export const PaypalPlanPaymentPreferencesSchema = z.object({
  auto_bill_outstanding: z.boolean(),
  setup_fee: z.object({
    value: z.string(),
    currency_code: z.string().length(3)
  }).optional(),
  setup_fee_failure_action: z.enum(['CONTINUE', 'CANCEL']),
  payment_failure_threshold: z.number().int().min(0)
});

export const PaypalPlanTaxesSchema = z.object({
  percentage: z.string(),
  inclusive: z.boolean()
});

export const PaypalPlanSchema = z.object({
  product_id: z.string(),
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  status: z.enum(['CREATED', 'INACTIVE', 'ACTIVE']),
  billing_cycles: z.array(PaypalPlanBillingCycleSchema).min(1),
  payment_preferences: PaypalPlanPaymentPreferencesSchema,
  taxes: PaypalPlanTaxesSchema.optional()
});

export const PaypalPlanPatchSchema = z.array(z.object({
  op: z.enum(['add', 'remove', 'replace']),
  path: z.string(),
  value: z.union([z.string(), z.number(), z.boolean(), z.object({})])
}));

export const PaypalPlanPricingUpdateSchema = z.object({
  pricing_schemes: z.array(z.object({
    billing_cycle_sequence: z.number().int().min(1),
    pricing_scheme: PaypalPlanPricingSchemeSchema
  }))
});



// Subscription schemas
export const PaypalSubscriptionNameSchema = z.object({
  given_name: z.string(),
  surname: z.string()
});

export const PaypalSubscriptionAddressSchema = z.object({
  address_line_1: z.string(),
  address_line_2: z.string().optional(),
  admin_area_2: z.string(),
  admin_area_1: z.string(),
  postal_code: z.string(),
  country_code: z.string().length(2)
});

export const PaypalSubscriptionShippingAddressSchema = z.object({
  name: z.object({
    full_name: z.string()
  }),
  address: PaypalSubscriptionAddressSchema
});

export const PaypalSubscriptionSubscriberSchema = z.object({
  name: PaypalSubscriptionNameSchema,
  email_address: z.string().email(),
  shipping_address: PaypalSubscriptionShippingAddressSchema.optional()
});

export const PaypalSubscriptionApplicationContextSchema = z.object({
  brand_name: z.string().optional(),
  locale: z.string().optional(),
  shipping_preference: z.enum(['GET_FROM_FILE', 'NO_SHIPPING', 'SET_PROVIDED_ADDRESS']).optional(),
  user_action: z.enum(['CONTINUE', 'SUBSCRIBE_NOW']).optional(),
  payment_method: z.object({
    payer_selected: z.enum(['PAYPAL', 'PAYPAL_CREDIT']).optional(),
    payee_preferred: z.enum(['UNRESTRICTED', 'IMMEDIATE_PAYMENT_REQUIRED']).optional()
  }).optional(),
  return_url: z.string().url().optional(),
  cancel_url: z.string().url().optional()
});

export const PaypalSubscriptionAmountSchema = z.object({
  currency_code: z.string().length(3),
  value: z.string()
});

export const PaypalSubscriptionSchema = z.object({
  plan_id: z.string(),
  start_time: z.string().datetime().optional(),
  quantity: z.string().optional(),
  shipping_amount: PaypalSubscriptionAmountSchema.optional(),
  subscriber: PaypalSubscriptionSubscriberSchema,
  application_context: PaypalSubscriptionApplicationContextSchema.optional()
});

export const PaypalSubscriptionPatchSchema = z.array(z.object({
  op: z.enum(['add', 'remove', 'replace']),
  path: z.string(),
  value: z.union([z.string(), z.number(), z.boolean(), z.object({})])
}));

export const PaypalSubscriptionReviseSchema = z.object({
  plan_id: z.string().optional(),
  shipping_amount: PaypalSubscriptionAmountSchema.optional(),
  shipping_address: PaypalSubscriptionShippingAddressSchema.optional(),
  application_context: PaypalSubscriptionApplicationContextSchema.optional()
});

export const PaypalSubscriptionActionSchema = z.object({
  reason: z.string().optional()
});

export const PaypalSubscriptionCaptureSchema = z.object({
  note: z.string().optional(),
  capture_type: z.enum(['OUTSTANDING_BALANCE']),
  amount: PaypalSubscriptionAmountSchema
});

// Types
export type CreatePaypalProductInput = z.infer<typeof PaypalProductSchema>;
export type UpdatePaypalProductInput = z.infer<typeof PaypalProductPatchSchema>;

export type CreatePaypalPlanInput = z.infer<typeof PaypalPlanSchema>;
export type UpdatePaypalPlanInput = z.infer<typeof PaypalPlanPatchSchema>;
export type UpdatePaypalPlanPricingInput = z.infer<typeof PaypalPlanPricingUpdateSchema>;

export type CreatePaypalSubscriptionInput = z.infer<typeof PaypalSubscriptionSchema>;
export type UpdatePaypalSubscriptionInput = z.infer<typeof PaypalSubscriptionPatchSchema>;
export type RevisePaypalSubscriptionInput = z.infer<typeof PaypalSubscriptionReviseSchema>;
export type PaypalSubscriptionActionInput = z.infer<typeof PaypalSubscriptionActionSchema>;
export type CapturePaypalSubscriptionInput = z.infer<typeof PaypalSubscriptionCaptureSchema>;