import cors from "../../../lib/cors";
import createOrder from "../../../src/services/crystallize/orders/create-order";
import setPipelineStage from "../../../src/services/crystallize/orders/set-pipeline-stage";
import getCustomer from "../../../src/services/crystallize/customers/get-customer";
import generateInvoiceAndChargePayment from "../../../src/services/payment-providers/stripe/generate-invoice-and-charge";

//After the subscription is renewed this API is called with a subscription object
// Create Order
// Generate and pay invoice
//2. [DONE]create a new order and to pipeline
//3. call generate invoice and pass the orderId from above, finalize it and pay or send-invoice
const STRIPE_CUSTOMER_ID_KEY = "stripeCustomerId";
const STRIPE_TAX_RATE_ID_KEY = "StripeTaxRateId";

async function RenewSubscription(req, res) {
  const { customerIdentifier, item, id } = req.body.productSubscription.get;
  const crystallizeCustomer = await getCustomer({
    identifier: customerIdentifier,
  });
  // console.log("crystallizeCustomer", crystallizeCustomer);
  const {
    identifier,
    firstName,
    lastName,
    externalReferences,
    meta,
  } = crystallizeCustomer;
  const stripeCustomerId = externalReferences.filter(
    (ext) => ext.key === STRIPE_CUSTOMER_ID_KEY
  )[0].value;
  // console.log("stripeCustomerId -> ", stripeCustomerId);

  const defaultTaxRateId = meta.filter(
    (ext) => ext.key === STRIPE_TAX_RATE_ID_KEY
  )[0].value;
  // console.log("defaultTaxRateId -> ", defaultTaxRateId);

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
  // console.log("ORDER PAYLOAD -> ", orderPayload);
  const orderResponse = await createOrder(orderPayload);
  const orderId = orderResponse.id;
  const setPipelineStageResponse = await setPipelineStage({
    orderId: orderId,
    stageName: "new",
  });

  console.log("New order created and added to pipeline");
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

export default cors(RenewSubscription);
