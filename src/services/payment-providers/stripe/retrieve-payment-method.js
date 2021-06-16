module.exports = async function retrievePaymentMethod(paymentMethodId) {
  const { getClient } = require("./utils");
  return await getClient().paymentMethods.retrieve(paymentMethodId);
};
