import cors from "../../../lib/cors";
import createOrder from "../../../src/services/crystallize/orders/create-order";
import getCustomer from "../../../src/services/crystallize/customers/get-customer";
import getMetrics from "../../../src/services/crystallize/tenants/get-metrics";
import getAllProductSubscriptions from "../../../src/services/crystallize/subscriptions/get-all";
import cancelSubscription from "../../../src/services/crystallize/subscriptions/cancel";
import {
  constructOrderPayload,
  getPayableUsage,
} from "../../../src/services/crystallize/utils";

async function AfterSubscriptionRenewal(req, res) {
  const { customerIdentifier, item } = req.body.productSubscription.get;
  const crystallizeCustomer = await getCustomer({
    identifier: customerIdentifier,
  });

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
    /** Check if Atom plan was downgraded during this billing period**/
    downgradedAtomPlanThisMonth = allSubscriptions.filter(
      (sub) =>
        new Date(sub.node.status.activeUntil).getMonth() ===
          activeUntilMonth - 1 && sub.node.item.name.includes("atom")
    )[0];
    if (downgradedAtomPlanThisMonth) planToBill = "atom";
  }
  console.log("downgradedAtomPlanThisMonth ", downgradedAtomPlanThisMonth);
  console.log("planToBill", planToBill);
  const metrics = await getMetrics(customerIdentifier);
  const payableUsage = getPayableUsage(planToBill || activePlan, metrics);
  const orderPayload = constructOrderPayload(
    downgradedAtomPlanThisMonth,
    crystallizeCustomer,
    item,
    metrics,
    payableUsage
  );
  const orderResponse = await createOrder(orderPayload);
  const orderId = orderResponse.id;
  /** After order is created, deactivate old plan**/
  if (downgradedAtomPlanThisMonth)
    await cancelSubscription(downgradedAtomPlanThisMonth.node.id, true);
  res.send({
    message: "New order generated for subscription renewal",
    orderId: orderId,
  });
}

export default cors(AfterSubscriptionRenewal);
