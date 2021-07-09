const { callPimApi, getTenantId } = require("../utils");

module.exports = async function createCustomer({ customer }) {
  const tenantId = await getTenantId();
  const response = await callPimApi({
    variables: {
      input: {
        tenantId,
        ...customer,
      },
    },
    query: `
      mutation createCustomer(
        $input: CreateCustomerInput!
      ) {
        customer {
          create(
            input: $input
          ) {
            identifier
          }
        }
      }
    `,
  });
  if (response?.errors)
    throw new Error("Failed to create customer in Crystallize: ");
  return response.data.customer.create;
};
