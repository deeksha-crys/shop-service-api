import cors from "../../../lib/cors";
import createOrder from "../../../src/services/crystallize/orders/create-order";
import getCustomer from "../../../src/services/crystallize/customers/get-customer";
import getMetrics from "../../../src/services/crystallize/tenants/get-metrics";
// import generateInvoiceAndChargePayment from "../../../src/services/payment-providers/stripe/generate-invoice-and-charge";
import {
  getNetUsageCost,
  getPayableUsage,
} from "../../../src/services/crystallize/utils";
// import setPipelineStage from "../../../src/services/crystallize/orders/set-pipeline-stage";

const STRIPE_CUSTOMER_ID_KEY = "stripeCustomerId";
const STRIPE_PAYMENT_METHOD_ID = "stripePaymentMethodId";
// const STRIPE_ZERO_TAX_RATE_ID = process.env.STRIPE_ZERO_TAX_RATE_ID;
// const STRIPE_NORWAY_TAX_RATE_ID = process.env.STRIPE_NORWAY_TAX_RATE_ID;

// async function AfterSubscriptionRenewal(req, res) {
//   const { customerIdentifier, item } = req.body.productSubscription.get;
//   const crystallizeCustomer = await getCustomer({
//     identifier: customerIdentifier,
//   });
//   const {
//     identifier,
//     firstName,
//     lastName,
//     externalReferences,
//     addresses,
//     meta,
//   } = crystallizeCustomer;
//   const stripeCustomerId = externalReferences.filter(
//     (ext) => ext.key === STRIPE_CUSTOMER_ID_KEY
//   )[0].value;
//
//   let stripePaymentMethodId = meta?.filter(
//     (m) => m.key === STRIPE_PAYMENT_METHOD_ID
//   )[0]?.value;
//
//   const billingAddress = addresses.filter(
//     (addr) => addr?.type?.toLowerCase() === "billing" && addr?.country
//   )[0];
//
//   const defaultTaxRateId =
//     billingAddress && billingAddress.country.toLowerCase() === "norway"
//       ? STRIPE_NORWAY_TAX_RATE_ID
//       : STRIPE_ZERO_TAX_RATE_ID;
//
//   const taxPercent =
//     billingAddress && billingAddress.country.toLowerCase() === "norway"
//       ? 25
//       : 0;
//
//   const metrics = await getMetrics(identifier);
//   const planName = item.name.includes("particle")
//     ? "particle"
//     : item.name.includes("atom")
//     ? "atom"
//     : "crystal";
//   const payableUsage = getPayableUsage(planName, metrics);
//   const netPrice = parseFloat(getNetUsageCost(payableUsage).toFixed(2));
//   const grossPrice = parseFloat(
//     (netPrice + (netPrice * taxPercent) / 100).toFixed(2)
//   );
//
//   const orderPayload = {
//     customer: {
//       identifier,
//       firstName,
//       lastName,
//     },
//     cart: [
//       {
//         quantity: item.quantity,
//         name: item.name,
//         sku: item.sku,
//         price: {
//           gross: grossPrice,
//           net: netPrice,
//           currency: "USD",
//           tax: { name: "VAT", percent: taxPercent },
//         },
//       },
//     ],
//     total: {
//       tax: { name: "VAT", percent: taxPercent },
//       currency: "USD",
//       net: netPrice,
//       gross: grossPrice,
//     },
//     payment: {
//       provider: "stripe",
//       stripe: {
//         customerId: stripeCustomerId,
//         paymentMethodId: stripePaymentMethodId ? stripePaymentMethodId : "",
//       },
//     },
//   };
//   const orderResponse = await createOrder(orderPayload);
//   const orderId = orderResponse.id;
//   let invoice;
//   let pipelineStageResponse;
//   if (netPrice > 0 && grossPrice > 0 && !stripePaymentMethodId) {
//     pipelineStageResponse = await setPipelineStage({
//       orderId: orderId,
//       stageName: "fail",
//     });
//   } else if (netPrice > 0 && grossPrice > 0 && stripePaymentMethodId) {
//     invoice = await generateInvoiceAndChargePayment(
//       stripeCustomerId,
//       defaultTaxRateId,
//       payableUsage,
//       orderId
//     );
//   } else {
//     pipelineStageResponse = await setPipelineStage({
//       orderId: orderId,
//       stageName: "success",
//     });
//   }
//   res.send({
//     message:
//       "New order generated. Stripe will collect any pending payment and update the status on Crystallize slack",
//     orderId: orderId,
//     invoice: invoice,
//     newPipelineStage: pipelineStageResponse,
//   });
// }

async function AfterSubscriptionRenewal(req, res) {
  const { customerIdentifier, item } = req.body.productSubscription.get;
  const crystallizeCustomer = await getCustomer({
    identifier: customerIdentifier,
  });
  const {
    identifier,
    firstName,
    lastName,
    externalReferences,
    addresses,
    email,
    meta,
  } = crystallizeCustomer;
  const stripeCustomerId = externalReferences.filter(
    (ext) => ext.key === STRIPE_CUSTOMER_ID_KEY
  )[0].value;

  let stripePaymentMethodId = meta?.filter(
    (m) => m.key === STRIPE_PAYMENT_METHOD_ID
  )[0]?.value;

  const billingAddress = addresses.filter(
    (addr) => addr?.type?.toLowerCase() === "billing" && addr?.country
  )[0];

  const taxPercent =
    billingAddress && billingAddress.country.toLowerCase() === "norway"
      ? 25
      : 0;

  const metrics = await getMetrics(identifier);
  const planName = item.name.includes("particle")
    ? "particle"
    : item.name.includes("atom")
    ? "atom"
    : "crystal";
  const payableUsage = getPayableUsage(planName, metrics);
  const netPrice = parseFloat(getNetUsageCost(payableUsage).toFixed(2));
  const grossPrice = parseFloat(
    (netPrice + (netPrice * taxPercent) / 100).toFixed(2)
  );

  const orderPayload = {
    customer: {
      identifier,
      firstName,
      lastName,
      addresses,
    },
    cart: [
      {
        quantity: item.quantity,
        name: item.name,
        sku: item.sku,
        price: {
          gross: grossPrice,
          net: netPrice,
          currency: "USD",
          tax: { name: "VAT", percent: taxPercent },
        },
      },
    ],
    total: {
      tax: { name: "VAT", percent: taxPercent },
      currency: "USD",
      net: netPrice,
      gross: grossPrice,
    },
    payment: {
      provider: "stripe",
      stripe: {
        customerId: stripeCustomerId,
        paymentMethodId: stripePaymentMethodId ? stripePaymentMethodId : "",
      },
    },
    meta: [{ key: "email", value: email }],
  };
  const orderResponse = await createOrder(orderPayload);
  const orderId = orderResponse.id;

  res.send({
    message: "New order generated for subscription renewal",
    orderId: orderId,
  });
}

export default cors(AfterSubscriptionRenewal);
