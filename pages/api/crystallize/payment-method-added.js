import cors from "../../../lib/cors";
import { paymentMethodAdded } from "../../../src/services/slack/notify-payment-method-added";
const {
  getClient,
} = require("../../../src/services/payment-providers/stripe/utils");

async function newPaymentMethodAdded(req, res) {
  const { customer, billing_details, id } = {
    ...req.body.data.object,
  };
  /**
   * TODO: customer object is expandable which contains "customerTenantId" in metadata
   * Get that tenantId and send to paymentMethodAdded()
   */
  const stripeCustomer = await getClient().customers.retrieve(customer);
  const tenantId = stripeCustomer?.metadata?.customerTenantId;
  const response = await paymentMethodAdded({
    customer,
    billing_details,
    paymentMethodId: id,
    tenantId,
  });
  if (response.status === 200)
    res.send({
      message: "Message sent to Crystallize slack about new payment method",
    });
  else
    res.send({
      message: "Failed to inform Crystallize about new payment method",
    });
}

export default cors(newPaymentMethodAdded);
