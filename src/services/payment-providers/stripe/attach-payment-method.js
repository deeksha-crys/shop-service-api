module.exports = async function attachPaymentMethod(
  paymentMethodId,
  customerId
) {
  const { getClient } = require("./utils");
  return await getClient().paymentMethods.attach(paymentMethodId, {
    customer: customerId,
  });
};
