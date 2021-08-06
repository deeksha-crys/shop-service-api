// import cors from "../../../lib/cors";
// import createOrder from "../../../src/services/crystallize/orders/create-order";
// import getCustomer from "../../../src/services/crystallize/customers/get-customer";
// import getMetrics from "../../../src/services/crystallize/tenants/get-metrics";
// import {
//   getNetUsageCost,
//   getPayableUsage,
// } from "../../../src/services/crystallize/utils";
//
// const STRIPE_CUSTOMER_ID_KEY = "stripeCustomerId";
// const STRIPE_PAYMENT_METHOD_ID = "stripePaymentMethodId";
//
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
//     email,
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
//       addresses,
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
//     meta: [{ key: "email", value: email }],
//   };
//   const orderResponse = await createOrder(orderPayload);
//   const orderId = orderResponse.id;
//
//   res.send({
//     message: "New order generated for subscription renewal",
//     orderId: orderId,
//   });
// }
//
// export default cors(AfterSubscriptionRenewal);

import cors from "../../../lib/cors";
import createOrder from "../../../src/services/crystallize/orders/create-order";
import getCustomer from "../../../src/services/crystallize/customers/get-customer";
import getMetrics from "../../../src/services/crystallize/tenants/get-metrics";
import getAllProductSubscriptions from "../../../src/services/crystallize/subscriptions/get-all-product-subscriptions";
import cancelSubscription from "../../../src/services/crystallize/subscriptions/cancel-product-subscription";
import {
  getNetUsageCost,
  getPayableUsage,
} from "../../../src/services/crystallize/utils";

const STRIPE_CUSTOMER_ID_KEY = "stripeCustomerId";
const STRIPE_PAYMENT_METHOD_ID = "stripePaymentMethodId";

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

  const allSubscriptions = await getAllProductSubscriptions(customerIdentifier);
  console.log("allSubscriptions -> ", allSubscriptions);
  const activeSubscription = allSubscriptions.filter(
    (sub) => sub.node.status.activeUntil && sub.node.status.renewAt
  )[0];
  console.log("activeSubscription ", activeSubscription);
  const activeUntilMonth = new Date(
    activeSubscription.node.status.activeUntil
  ).getMonth();

  let planToBill;
  let downgradedAtomPlanThisMonth;
  const activePlan = activeSubscription.node.item.name.includes("particle")
    ? "particle"
    : activeSubscription.node.item.name.includes("atom")
    ? "atom"
    : "crystal";
  console.log("activePlan ", activePlan);
  if (activePlan === "particle") {
    /** if there was an Atom plan active last month to charge**/
    downgradedAtomPlanThisMonth = allSubscriptions.filter(
      (sub) =>
        new Date(sub.node.status.activeUntil).getMonth() ===
          activeUntilMonth - 1 && sub.node.item.name.includes("atom")
    )[0];
    if (downgradedAtomPlanThisMonth) planToBill = "atom";
  }
  console.log("downgradedAtomPlanThisMonth ", downgradedAtomPlanThisMonth);
  console.log("planToBill", planToBill);
  const metrics = await getMetrics(identifier);
  const payableUsage = getPayableUsage(planToBill || activePlan, metrics);
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
        quantity: downgradedAtomPlanThisMonth
          ? downgradedAtomPlanThisMonth.node.item.quantity
          : item.quantity,
        name: downgradedAtomPlanThisMonth
          ? downgradedAtomPlanThisMonth.node.item.name
          : item.name,
        sku: downgradedAtomPlanThisMonth
          ? downgradedAtomPlanThisMonth.node.item.sku
          : item.sku,
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

  /** After order is created, deactivate the plan**/
  if (downgradedAtomPlanThisMonth)
    await cancelSubscription(downgradedAtomPlanThisMonth.node.id, true);
  res.send({
    message: "New order generated for subscription renewal",
    orderId: orderId,
  });
}

export default cors(AfterSubscriptionRenewal);
