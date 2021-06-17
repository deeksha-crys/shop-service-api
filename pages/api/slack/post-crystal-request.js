import cors from "../../../lib/cors";
import { postToSlack } from "../../../src/services/slack/send-crystal-req";

async function PostCrystalRequest(req, res) {
  postToSlack({ ...req.body }).then((response) => {
    if (response.status === 200) res.send({ message: "success" });
  });
}

export default cors(PostCrystalRequest);
