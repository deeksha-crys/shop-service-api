import cors from "../../../lib/cors";
import { informPaymentFailedToCrystallize } from "../../../src/services/slack/send-payment-failed";
import setPipelineStage from "../../../src/services/crystallize/orders/set-pipeline-stage";

async function InvoicePaymentFailed(req, res) {
  const { customer, customer_email, customer_name, total, metadata } = {
    ...req.body.data.object,
  };
  const orderId = metadata.crystallizeOrderId;
  const tenantId = metadata.customerTenantId;
  const setPipelineStageResponse = await setPipelineStage({
    orderId: orderId,
    stageName: "fail",
  });
  console.log(
    `OrderId: ${orderId} moved to Failed Orders pipeline stage`,
    setPipelineStageResponse
  );

  const response = await informPaymentFailedToCrystallize({
    customer,
    customer_email,
    customer_name,
    total: total / 100,
    tenantId,
  });
  if (response.status === 200)
    res.send({ message: "Payment message posted on slack" });
  else res.send({ message: "Failed to send message" });
}

export default cors(InvoicePaymentFailed);
