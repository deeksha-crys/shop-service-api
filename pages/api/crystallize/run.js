import cors from "../../../lib/cors";
import { autoRenewSubscription } from "../../../src/services/crystallize/subscriptions/auto-renew";

async function autoRenew(req, res) {
  await autoRenewSubscription();
  res.send({
    messages: "All active subscriptions have been renewed",
  });
}

export default cors(autoRenew);
