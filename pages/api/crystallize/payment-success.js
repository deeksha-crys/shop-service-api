import cors from "../../../lib/cors";
// import { informPaymentFailedToCrystallize } from "../../../src/services/slack/send-payment-failed";
// import setPipelineStage from "../../../src/services/crystallize/orders/set-pipeline-stage";

async function InvoicePaymentSuccess(req, res) {
  console.log("Invoice payment success -> ", req.body);
  // const {
  //   customer,
  //   customer_email,
  //   customer_name,
  //   subtotal,
  //   tax,
  //   total,
  //   hosted_invoice_url,
  //   invoice_pdf,
  // } = {
  //   ...req.body,
  // };
  // const setPipelineStageResponse = await setPipelineStage({
  //   orderId: "orderId",
  //   stageName: "success",
  // });

  res.status(200).send({ message: "Invoice is paid" });
}

export default cors(InvoicePaymentSuccess);
