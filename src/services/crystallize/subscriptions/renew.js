import { callProductSubscriptionsApi } from "../utils";

module.exports = async function renewSubscription({ id }) {
  const response = await callProductSubscriptionsApi({
    query: `
        mutation RENEW_PRODUCT_SUBSCRIPTION($id: ID!) {
          productSubscriptions {
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
  console.log(response.data.productSubscriptions);
  return response.data.productSubscriptions;
};
