module.exports = async function retrievePaymentMethod(paymentMethodId) {
  const { getClient } = require("./utils");
  const p = await getClient().paymentMethods.retrieve( paymentMethodId );
  console.log("p -> ", p);
  return p;
}