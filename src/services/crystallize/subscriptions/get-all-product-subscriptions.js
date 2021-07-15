const { callPimApi, getTenantId } = require("../utils");

module.exports = async function getAllProductSubscriptions(customerIdentifier) {
  const tenantId = await getTenantId();
  const response = await callPimApi({
    variables: {
      tenantId,
      customerIdentifier: customerIdentifier,
    },
    query: `
      query getAllSubscriptions($tenantId: ID!, $customerIdentifier: String){
        productSubscription{
          getMany(tenantId: $tenantId, customerIdentifier: $customerIdentifier){
            pageInfo {
              totalNodes
            }
            edges {
              node {
                ...productSubscriptionFragment
              }  
            }
          }
        }
      } 
      fragment productSubscriptionFragment on ProductSubscription {
        customerIdentifier
        id
        item {name, sku}
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
  return response.data?.productSubscription?.getMany?.edges;
};
