import cors from "../../../lib/cors";
import createOrder from "../../../src/services/crystallize/orders/create-order";
import setPipelineStage from "../../../src/services/crystallize/orders/set-pipeline-stage";

async function RenewSubscription(req, res) {
  console.log("Renew Subscription");
  //1. update subscription renewAt and activeUntil date
  //2. create a new order
  //3. call generate invoice and pass the orderId from above, finalize it and pay or send-invoice
  //4. set Stage of the order as New Order

  const variables = {
    customer: { firstName: "Warren", lastName: "Cheng" },
    cart: [
      {
        quantity: 1,
        name: "Particle monthly subscription order",
        sku: "particle-plan-1624058225886",
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
        customerId: "cus_Jj2pmqf0aVzKey",
        paymentMethodId: "pm_abcggjadg7jdhgd",
      },
    },
  };
  const orderResponse = await createOrder(variables);
  const orderId = orderResponse.id;
  const setPipelineStageResponse = await setPipelineStage({
    orderId: orderId,
    stageName: "success",
  });
  console.log("setPipelineStageResponse -> ", setPipelineStageResponse);
  res.send({
    message: "New order added to pipeline stage: New Order",
    order: setPipelineStageResponse,
  });
}

export default cors(RenewSubscription);
