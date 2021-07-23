import cors from "../../../lib/cors";
import { notifyPaymentMethodDelete } from "../../../src/services/slack/notify-payment-method-deleted";
const {
  getClient,
} = require("../../../src/services/payment-providers/stripe/utils");

async function paymentMethodDeleted(req, res) {
  const { customer, billing_details, id } = {
    ...req.body.data.object,
  };
  const stripeCustomer = await getClient().customers.retrieve(customer);
  const tenantId = stripeCustomer?.metadata?.customerTenantId;
  const response = await notifyPaymentMethodDelete({
    customer,
    billing_details,
    paymentMethodId: id,
    tenantId,
  });
  if (response.status === 200)
    res.send({
      message: "Message sent to Crystallize slack about credit card delete",
    });
  else
    res.send({
      message: "Failed to inform Crystallize about deleted credit card",
    });
}

export default cors(paymentMethodDeleted);
