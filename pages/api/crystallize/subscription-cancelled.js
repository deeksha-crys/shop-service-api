import cors from "../../../lib/cors";
import { informSubscriptionCancellation } from "../../../src/services/slack/notify-subscription-cancellation";
import getCustomer from "../../../src/services/crystallize/customers/get-customer";

async function subscriptionCancelled(req, res) {
  const { customerIdentifier, item, id } = req.body.productSubscription.get;
  const crystallizeCustomer = await getCustomer({
    identifier: customerIdentifier,
  });
  const { firstName, lastName, email } = crystallizeCustomer;
  const planName = item.name.includes("particle")
    ? "Particle"
    : item.name.includes("atom")
    ? "Atom"
    : "Crystal";

  const response = await informSubscriptionCancellation({
    planName,
    customerIdentifier,
    productSubscriptionId: id,
    firstName,
    lastName,
    email,
  });
  if (response.status === 200)
    res.send({
      message:
        "Message sent to Crystallize regarding subscription cancellation",
    });
  else
    res.send({
      message: "Failed to inform Crystallize about subscription cancellation",
    });
}
export default cors(subscriptionCancelled);
