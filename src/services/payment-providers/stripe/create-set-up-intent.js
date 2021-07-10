module.exports = async function createSetupIntent(customerId) {
  const { getClient } = require("./utils");
  return await getClient().setupIntents.create({
    customer: customerId,
  });
};
