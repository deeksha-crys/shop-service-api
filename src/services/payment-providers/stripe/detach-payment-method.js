module.exports = async function detachPaymentMethod(paymentMethodId) {
  const { getClient } = require("./utils");
  return await getClient().paymentMethods.detach(paymentMethodId);
};
