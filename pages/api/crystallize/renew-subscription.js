import cors from "../../../lib/cors";
import createOrder from "../../../src/services/crystallize/orders/create-order";
import setPipelineStage from "../../../src/services/crystallize/orders/set-pipeline-stage";
import getCustomer from "../../../src/services/crystallize/customers/get-customer";
import generateInvoiceAndChargePayment from "../../../src/services/payment-providers/stripe/generate-invoice-and-charge";

const STRIPE_CUSTOMER_ID_KEY = "stripeCustomerId";
const STRIPE_ZERO_TAX_RATE_ID = process.env.STRIPE_ZERO_TAX_RATE_ID;
const STRIPE_NORWAY_TAX_RATE_ID = process.env.STRIPE_NORWAY_TAX_RATE_ID;

async function AfterSubscriptionRenewal(req, res) {
  const { customerIdentifier, item, id } = req.body.productSubscription.get;
  const crystallizeCustomer = await getCustomer({
    identifier: customerIdentifier,
  });
  const {
    identifier,
    firstName,
    lastName,
    externalReferences,
    addresses,
  } = crystallizeCustomer;
  const stripeCustomerId = externalReferences.filter(
    (ext) => ext.key === STRIPE_CUSTOMER_ID_KEY
  )[0].value;

  const billingAddress = addresses.filter(
    (addr) => addr?.type?.toLowerCase() === "billing" && addr?.country
  )[0];

  const defaultTaxRateId =
    billingAddress && billingAddress.country.toLowerCase() === "norway"
      ? STRIPE_NORWAY_TAX_RATE_ID
      : STRIPE_ZERO_TAX_RATE_ID;

  const orderPayload = {
    customer: {
      identifier,
      firstName,
      lastName,
    },
    cart: [
      {
        quantity: item.quantity,
        name: item.name,
        sku: item.sku,
        price: {
          gross: 100,
          net: 80,
          currency: "USD",
          tax: { name: "VAT", percent: 25 },
        },
      },
    ],
    total: {
      tax: { name: "VAT", percent: 25 },
      currency: "USD",
      net: 100,
      gross: 120,
    },
    payment: {
      provider: "stripe",
      stripe: {
        customerId: stripeCustomerId,
        paymentMethodId: "pm_abcggjadg7jdhgd",
      },
    },
  };

  const orderResponse = await createOrder(orderPayload);
  const orderId = orderResponse.id;
  const setPipelineStageResponse = await setPipelineStage({
    orderId: orderId,
    stageName: "new",
  });

  console.log("setPipelineStageResponse -> ", setPipelineStageResponse);
  const usage = {
    orders: { unit_amount: 50, quantity: 97 },
    bandwidth: { unit_amount: 5, quantity: 100 },
    items: { unit_amount: 30, quantity: 2 },
    apiCalls: { unit_amount: 200, quantity: 5 },
    plan: { unit_amount: 1, quantity: 0 },
  };
  const invoice = await generateInvoiceAndChargePayment(
    stripeCustomerId,
    defaultTaxRateId,
    usage
  );
  console.log("invoice -> ", invoice);
  res.send({
    message:
      "Invoice generated! Stripe will collect the payment and inform you of any failures",
    invoice: invoice,
  });
}

export default cors(AfterSubscriptionRenewal);
