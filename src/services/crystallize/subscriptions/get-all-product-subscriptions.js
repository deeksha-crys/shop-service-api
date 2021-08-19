const { callProductSubscriptionsApi, getTenantId } = require("../utils");

module.exports = async function getAllProductSubscriptions(customerIdentifier) {
  const tenantId = await getTenantId();
  const response = await callProductSubscriptionsApi({
    variables: {
      tenantId,
      customerIdentifier: customerIdentifier,
    },
    query: `
      query getAllSubscriptionContracts($tenantId: ID!, $customerIdentifier: String){
        subscriptionContracts{
          getMany(tenantId: $tenantId, customerIdentifier: $customerIdentifier){
            pageInfo {
              totalNodes
            }
            edges {
              node {
                ...subscriptionContractFragment
              }  
            }
          }
        }
      } 
      fragment subscriptionContractFragment on SubscriptionContract {
        customerIdentifier
        id
        item { 
          name
          sku
        }
        status { renewAt activeUntil}
        subscriptionPlan {
          name
          periods {
            id
            initial {
              unit
              period
            }
            recurring {
              unit
              period
            }
          }
        }
      }         
    `,
  });
  return response.data?.subscriptionContracts?.getMany?.edges;
};
