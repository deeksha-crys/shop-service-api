import cors from "../../../lib/cors";
import setPipelineStage from "../../../src/services/crystallize/orders/set-pipeline-stage";
import generateInvoiceAndChargePayment from "../../../src/services/payment-providers/stripe/generate-invoice-and-charge";
const STRIPE_ZERO_TAX_RATE_ID = process.env.STRIPE_ZERO_TAX_RATE_ID;
const STRIPE_NORWAY_TAX_RATE_ID = process.env.STRIPE_NORWAY_TAX_RATE_ID;

async function AfterOrderCreated(req, res) {
  const { customer, total, payment, id } = req.body.order.get;
  const grossPrice = total.gross;
  const stripePaymentMethodId = payment[0].paymentMethodId;
  const stripeCustomerId = payment[0].customerId;
  const billingAddress = customer.addresses.filter(
    (addr) => addr?.type?.toLowerCase() === "billing" && addr?.country
  )[0];

  const defaultTaxRateId =
    billingAddress && billingAddress.country.toLowerCase() === "norway"
      ? STRIPE_NORWAY_TAX_RATE_ID
      : STRIPE_ZERO_TAX_RATE_ID;

  let invoice;
  let pipelineStageResponse;
  if (grossPrice > 0 && !stripePaymentMethodId) {
    pipelineStageResponse = await setPipelineStage({
      orderId: id,
      stageName: "fail",
    });
  } else if (grossPrice > 0 && stripePaymentMethodId) {
    invoice = await generateInvoiceAndChargePayment(
      stripeCustomerId,
      defaultTaxRateId,
      id,
      grossPrice
    );
  } else {
    pipelineStageResponse = await setPipelineStage({
      orderId: id,
      stageName: "success",
    });
  }
  res.send({
    message: "Order pipeline updated and payment information sent to Stripe",
    orderId: id,
    orderPipelineStageId: pipelineStageResponse,
    invoice: invoice,
  });
}
export default cors(AfterOrderCreated);
