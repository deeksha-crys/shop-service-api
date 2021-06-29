import cors from "../../../lib/cors";
import setPipelineStage from "../../../src/services/crystallize/orders/set-pipeline-stage";

async function InvoicePaymentSuccess(req, res) {
  const orderId = req.body.data.object.metadata.crystallizeOrderId;
  const setPipelineStageResponse = await setPipelineStage({
    orderId: orderId,
    stageName: "success",
  });
  console.log("setPipelineStageResponse -> ", setPipelineStageResponse);
  res.status(200).send({ message: "Invoice is paid" });
}

export default cors(InvoicePaymentSuccess);
