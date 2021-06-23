import cors from "../../../lib/cors";
import { postToSlack } from "../../../src/services/slack/send-crystal-req";

async function PostCrystalRequest(req, res) {
  if (Object.keys(req.body).length === 0)
    res.status(400).send({ message: "Invalid data in request body" });
  postToSlack({ ...req.body }).then((response) => {
    if (response.status === 200) res.send({ message: "Success" });
    else res.send({ message: "Failed to send message" });
  });
}

export default cors(PostCrystalRequest);
