import cors from "../../../lib/cors";
import { informPaymentFailedToCrystallize } from "../../../src/services/slack/send-payment-failed";
import setPipelineStage from "../../../src/services/crystallize/orders/set-pipeline-stage";

async function InvoicePaidAction(req, res) {
  console.log(req.body);
  const {
    customer,
    customer_email,
    customer_name,
    subtotal,
    tax,
    total,
    hosted_invoice_url,
    invoice_pdf,
  } = {
    ...req.body,
  };
  console.log(customer_name);
  console.log(customer);
  console.log(subtotal);
  res.send({ message: "Payment message posted on slack" });
  const setPipelineStageResponse = await setPipelineStage({
    orderId: "orderId",
    stageName: "fail",
  });

  informPaymentFailedToCrystallize({ ...req.body }).then((response) => {
    if (response.status === 200)
      res.send({ message: "Payment message posted on slack" });
    else res.send({ message: "Failed to send message" });
  });
}

export default cors(InvoicePaidAction);
