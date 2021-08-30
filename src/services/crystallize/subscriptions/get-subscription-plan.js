const { getTenantId, callPimApi } = require("../utils");

const CRYSTALLIZE_SUBSCRIPTION_PLAN_IDENTIFIER =
  process.env.CRYSTALLIZE_SUBSCRIPTION_PLAN_IDENTIFIER;

module.exports = async function getSubscriptionPlan() {
  const tenantId = await getTenantId();
  const response = await callPimApi({
    variables: {
      identifier: CRYSTALLIZE_SUBSCRIPTION_PLAN_IDENTIFIER,
      tenantId,
    },
    query: `
      query getSubscriptionPlan($identifier: String!, $tenantId: ID!) {
        subscriptionPlan {
          get(identifier: $identifier, tenantId: $tenantId) {
            identifier
            name
            meteredVariables {
              id
              name
              unit
              identifier
            }
            periods {
              name
              id
              initial {
                period
                unit
              }
              recurring {
                period
                unit
              }
            }
          }
        }
      }
    `,
  });
  return response.data.subscriptionPlan.get;
};
