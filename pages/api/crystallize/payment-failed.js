import cors from "../../../lib/cors";
import { informPaymentFailedToCrystallize } from "../../../src/services/slack/send-payment-failed";
import setPipelineStage from "../../../src/services/crystallize/orders/set-pipeline-stage";
import { sendOrderConfirmation } from "../../../src/services/email-service";
import { paymentStatus } from "../../../src/services/crystallize/utils";

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

  const emailResponse = await sendOrderConfirmation(
    orderId,
    customer_email,
    paymentStatus.PAYMENT_FAILURE
  );
  if (response.status === 200 && emailResponse.success)
    res.send({
      message: "Payment message posted on slack and email sent to customer",
    });
  else
    res.send({
      message: "Failed to send message",
      emailResponse: emailResponse,
      slackResponse: response,
    });
}

export default cors(InvoicePaymentFailed);
