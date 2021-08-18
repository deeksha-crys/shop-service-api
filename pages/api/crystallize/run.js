import cors from "../../../lib/cors";
import { autoRenewSubscription } from "../../../src/services/crystallize/subscriptions/auto-renew";

async function autoRenew(req, res) {
  const activeSubscriptions = await autoRenewSubscription();
  res.send({
    message: "Subscription renewal job started.",
    activeSubscriptions: activeSubscriptions,
  });
}

export default cors(autoRenew);
