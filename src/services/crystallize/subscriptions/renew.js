import { callProductSubscriptionsApi } from "../utils";

module.exports = async function renewSubscription({ id }) {
  const response = await callProductSubscriptionsApi({
    query: `
        mutation RENEW_PRODUCT_SUBSCRIPTION($id: ID!) {
          subscriptionContracts {
            renew(id: $id) {
              id
              status {
                renewAt
                activeUntil
              }
            }
          }
        }
      `,
    variables: {
      id,
    },
  });
  if (response.errors) {
    throw new Error(response.errors);
  }
  return response.data.subscriptionContracts.renew;
};
