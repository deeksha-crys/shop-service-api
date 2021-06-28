import { callPimApi } from "../utils";

module.exports = async function renewSubscription({ subscriptionId }) {
  const response = await callPimApi({
    query: `
        mutation RENEW_PRODUCT_SUBSCRIPTION($id: ID!) {
          productSubscription {
            renew(id: $id) {
              id
            }
          }
        }
      `,
    variables: {
      subscriptionId,
    },
  });
  if (response.errors) {
    throw new Error(response.errors);
  }
  console.log(response.data.productSubscription);
  return response.data.productSubscription;
};
