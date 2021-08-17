import cors from "../../../lib/cors";
import { renewMonthlySubscription } from "../../../src/services/crystallize/subscriptions/auto-renew";

async function autoRenew(req, res) {
  const response = await renewMonthlySubscription();
  res.send({
    message: response.message,
  });
}

export default cors(autoRenew);
