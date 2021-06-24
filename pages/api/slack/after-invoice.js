import cors from "../../../lib/cors";

async function InvoicePaidAction(req, res) {
  console.log(req.body);
  res.send({ message: "Invoice paid", data: req.body });
}

export default cors(InvoicePaidAction);
