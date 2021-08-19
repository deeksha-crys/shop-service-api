import { callProductSubscriptionsApi } from "../utils";

module.exports = async function cancelSubscription(
  productSubscriptionId,
  deactivate
) {
  const response = await callProductSubscriptionsApi({
    query: `
        mutation CANCEL_PRODUCT_SUBSCRIPTION($id: ID!, $deactivate: Boolean) {
          subscriptionContracts {
            cancel(id: $id, deactivate: $deactivate) {
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
      deactivate,
    },
  });
  if (response.errors) {
    throw new Error(response.errors);
  }
  console.log(JSON.stringify(response));
  return response.data.subscriptionContracts.cancel;
};
