const { getTenantId, callProductSubscriptionsApi } = require("../utils");
const renewSubscription = require("./renew");

const autoRenewSubscription = async () => {
  const tenantId = await getTenantId();
  const response = await callProductSubscriptionsApi({
    variables: {
      tenantId,
    },
    query: `
      query getAllSubscriptions($tenantId: ID!){
        subscriptionContracts{
          getMany(tenantId: $tenantId){
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
        status { renewAt activeUntil }
      }
    `,
  });

  const subscriptionsObj = response.data?.subscriptionContracts?.getMany?.edges;
  const activeSubscriptions = subscriptionsObj.filter(
    (sub) => sub.node.status.renewAt && sub.node.status.activeUntil
  );
  const allPromises = activeSubscriptions.map((activeSub) => {
    return renewSubscription({ id: activeSub.node.id }).catch(
      (err) => "Error: " + err
    );
  });
  Promise.all(allPromises).then((values) => console.log(values));
  return activeSubscriptions;
};

module.exports = { autoRenewSubscription };
