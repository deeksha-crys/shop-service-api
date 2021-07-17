import { callPimApi } from "../utils";

module.exports = async function cancelSubscription(productSubscriptionId) {
  const response = await callPimApi({
    query: `
        mutation CANCEL_PRODUCT_SUBSCRIPTION($id: ID!) {
          productSubscription {
            cancel(id: $id, deactivate: true) {
              id
              status{
                renewAt
                activeUntil
              }
            }
          }
        }
      `,
    variables: {
      id: productSubscriptionId,
    },
  });
  if (response.errors) {
    throw new Error(response.errors);
  }
  console.log(response);
  return response.data.productSubscription.cancel;
};
