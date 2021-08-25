import cors from "../../../lib/cors";
import { newSubscriptionActivated } from "../../../src/services/slack/new-subscription-activated";
import getCustomer from "../../../src/services/crystallize/customers/get-customer";
import getTenantInfo from "../../../src/services/crystallize/tenants/get-tenant";

async function newProductSubscription(req, res) {
  const { customerIdentifier, item, id } = req.body.productSubscription.get;
  const crystallizeCustomer = await getCustomer({
    identifier: customerIdentifier,
  });
  const { firstName, lastName, email } = crystallizeCustomer;
  const tenantInfo = await getTenantInfo(customerIdentifier);
  const planName = item.name.includes("particle")
    ? "Particle"
    : item.name.includes("atom")
    ? "Atom"
    : "Crystal";

  const response = await newSubscriptionActivated({
    planName,
    customerIdentifier,
    productSubscriptionId: id,
    tenantIdentifier: tenantInfo.identifier,
    firstName,
    lastName,
    email,
  });
  if (response.status === 200)
    res.send({
      message: "Message sent to Crystallize slack about new subscription",
    });
  else
    res.send({
      message: "Failed to inform Crystallize about new subscription",
    });
}
export default cors(newProductSubscription);
