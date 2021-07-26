import cors from "../../../lib/cors";
import { notifyPaymentMethodDelete } from "../../../src/services/slack/notify-payment-method-deleted";
const {
  getClient,
} = require("../../../src/services/payment-providers/stripe/utils");

async function paymentMethodDeleted(req, res) {
  const { billing_details, id } = {
    ...req.body.data.object,
  };
  const stripeCustomerId = req.body.data.previous_attributes.customer;
  const stripeCustomer = await getClient().customers.retrieve(stripeCustomerId);
  const crystallizeCustomerIdentifier =
    stripeCustomer?.metadata?.customerTenantId;
  const response = await notifyPaymentMethodDelete({
    customer: stripeCustomerId,
    billing_details,
    paymentMethodId: id,
    crystallizeCustomerIdentifier,
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
