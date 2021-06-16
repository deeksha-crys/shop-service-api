module.exports = async function createCustomerWithSetUpIntent({ customer }) {
  const { getClient } = require("./utils");
  const stripeCustomer =  await getClient().customers.create({ ...customer });
  return await getClient().setupIntents.create({
    customer: stripeCustomer.id
  });
};