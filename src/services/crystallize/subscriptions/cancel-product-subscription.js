import { callProductSubscriptionsApi } from "../utils";

module.exports = async function cancelSubscription(productSubscriptionId) {
  const response = await callProductSubscriptionsApi({
    query: `
        mutation CANCEL_PRODUCT_SUBSCRIPTION($id: ID!) {
          productSubscriptions {
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
  console.log(JSON.stringify(response));
  return response.data.productSubscriptions.cancel;
};
