import cors from "../../../lib/cors";
import createOrder from "../../../src/services/crystallize/orders/create-order";
import setPipelineStage from "../../../src/services/crystallize/orders/set-pipeline-stage";
import getCustomer from "../../../src/services/crystallize/customers/get-customer";
import generateInvoiceAndChargePayment from "../../../src/services/payment-providers/stripe/generate-invoice-and-charge";

const STRIPE_CUSTOMER_ID_KEY = "stripeCustomerId";
const STRIPE_ZERO_TAX_RATE_ID = process.env.STRIPE_ZERO_TAX_RATE_ID;
const STRIPE_NORWAY_TAX_RATE_ID = process.env.STRIPE_NORWAY_TAX_RATE_ID;
const NET_PRICE = 324.9;

const usage = {
  orders: { unit_amount: 20, quantity: 97 },
  bandwidth: { unit_amount: 15, quantity: 10 },
  items: { unit_amount: 2, quantity: 100 },
  apiCalls: { unit_amount: 0.001, quantity: 300000 },
  plan: { unit_amount: 29900, quantity: 1 },
};

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

  const taxPercent =
    billingAddress && billingAddress.country.toLowerCase() === "norway"
      ? 25
      : 0;

  //TODO: This will be derived from Subscriptions API
  const grossPrice = parseFloat(
    (NET_PRICE + (NET_PRICE * taxPercent) / 100).toFixed(2)
  );

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
          gross: grossPrice,
          net: NET_PRICE,
          currency: "USD",
          tax: { name: "VAT", percent: taxPercent },
        },
      },
    ],
    total: {
      tax: { name: "VAT", percent: taxPercent },
      currency: "USD",
      net: NET_PRICE,
      gross: grossPrice,
    },
    payment: {
      provider: "stripe",
      stripe: {
        customerId: stripeCustomerId,
        paymentMethodId: "pm_abcggjadg7jdhgd", //TODO: PaymentMethod ID should not be hard coded
      },
    },
  };

  const orderResponse = await createOrder(orderPayload);
  const orderId = orderResponse.id;
  const setPipelineStageResponse = await setPipelineStage({
    orderId: orderId,
    stageName: "new",
  });

  console.log("setPipelineStageResponse -> ", setPipelineStageResponse); //TODO: Remove this log after issue resolves or throw error

  const invoice = await generateInvoiceAndChargePayment(
    stripeCustomerId,
    defaultTaxRateId,
    usage,
    orderId
  );
  res.send({
    message:
      "Invoice generated! Stripe will collect the payment and inform you of any failures",
    invoice: invoice,
  });
}

export default cors(AfterSubscriptionRenewal);
