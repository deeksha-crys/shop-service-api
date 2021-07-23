import cors from "../../../lib/cors";
import { newSubscriptionActivated } from "../../../src/services/slack/new-subscription-activated";

async function newProductSubscription(req, res) {
  const { customerIdentifier, item, id } = req.body.productSubscription.get;
  const planName = item.name.includes("particle")
    ? "Particle"
    : item.name.includes("atom")
    ? "Atom"
    : "Crystal";

  const response = await newSubscriptionActivated({
    planName,
    customerIdentifier,
    productSubscriptionId: id,
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
