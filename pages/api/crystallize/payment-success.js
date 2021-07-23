import cors from "../../../lib/cors";
import setPipelineStage from "../../../src/services/crystallize/orders/set-pipeline-stage";
import { informPaymentSuccessToCrystallize } from "../../../src/services/slack/notify-customer-payment-success";

async function InvoicePaymentSuccess(req, res) {
  const { customer, customer_email, customer_name, total, metadata } = {
    ...req.body.data.object,
  };
  const orderId = metadata.crystallizeOrderId;
  const tenantId = metadata.customerTenantId;

  const setPipelineStageResponse = await setPipelineStage({
    orderId: orderId,
    stageName: "success",
  });
  console.log(
    " setPipelineStageResponse for Successful payment-> ",
    setPipelineStageResponse
  );

  /** Inform Crystallize on Slack about this payment success**/
  const response = await informPaymentSuccessToCrystallize({
    customer,
    customer_email,
    customer_name,
    total: total / 100,
    tenantId,
    orderId,
  });
  if (response.status === 200)
    res.send({ message: "Payment success message sent to Crystallize." });
  else
    res.send({ message: "Failed to inform Crystallize about payment success" });
}

export default cors(InvoicePaymentSuccess);
