import cors from "../../../lib/cors";
import setPipelineStage from "../../../src/services/crystallize/orders/set-pipeline-stage";
import generateInvoiceAndChargePayment from "../../../src/services/payment-providers/stripe/generate-invoice-and-charge";
import { subscriptionRenewedPaymentMissing } from "../../../src/services/slack/subscription-renewed-payment-missing";
import { subscriptionRenewedNoPaymentRequired } from "../../../src/services/slack/subscription-renewed-no-payment-required";
import { sendOrderConfirmation } from "../../../src/services/email-service";
import { paymentStatus } from "../../../src/services/crystallize/utils";
const STRIPE_ZERO_TAX_RATE_ID = process.env.STRIPE_ZERO_TAX_RATE_ID;
const STRIPE_NORWAY_TAX_RATE_ID = process.env.STRIPE_NORWAY_TAX_RATE_ID;

async function AfterOrderCreated(req, res) {
  const { customer, total, payment, id, meta } = req.body.order.get;
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
  const email = meta.filter((m) => m.key === "email")[0].value;
  let invoice;
  let pipelineStageResponse;
  if (grossPrice > 0 && !stripePaymentMethodId) {
    pipelineStageResponse = await setPipelineStage({
      orderId: id,
      stageName: "fail",
    });
    await subscriptionRenewedPaymentMissing({
      tenantId: customer.identifier,
      orderId: id,
      amountPending: grossPrice,
    });
    await sendOrderConfirmation(
      id,
      email,
      paymentStatus.PAYMENT_METHOD_MISSING
    );
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
    await subscriptionRenewedNoPaymentRequired({
      tenantId: customer.identifier,
      orderId: id,
      amountPending: grossPrice,
    });
    await sendOrderConfirmation(id, email, paymentStatus.NO_PAYMENT_REQUIRED);
  }
  res.send({
    message: "Order pipeline updated. Stripe will collect any pending payment",
    orderId: id,
    orderPipelineStageId: pipelineStageResponse,
    invoice: invoice,
  });
}
export default cors(AfterOrderCreated);
