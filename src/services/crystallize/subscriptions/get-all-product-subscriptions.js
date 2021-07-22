const { callProductSubscriptionsApi, getTenantId } = require("../utils");

module.exports = async function getAllProductSubscriptions(customerIdentifier) {
  const tenantId = await getTenantId();
  const response = await callProductSubscriptionsApi({
    variables: {
      tenantId,
      customerIdentifier: customerIdentifier,
    },
    query: `
      query getAllSubscriptions($tenantId: ID!, $customerIdentifier: String){
        productSubscriptions{
          getMany(tenantId: $tenantId, customerIdentifier: $customerIdentifier){
            pageInfo {
              totalNodes
            }
            edges {
              node {
                ...productSubscriptionsFragment
              }  
            }
          }
        }
      } 
      fragment productSubscriptionsFragment on ProductSubscription {
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
  return response.data?.productSubscriptions?.getMany?.edges;
};
