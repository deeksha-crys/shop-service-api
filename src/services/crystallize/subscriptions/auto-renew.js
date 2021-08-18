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
        productSubscriptions{
          getMany(tenantId: $tenantId){
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
        status { renewAt activeUntil }
      }
    `,
  });

  const subscriptionsObj = response.data?.productSubscriptions?.getMany?.edges;
  const activeSubscriptions = subscriptionsObj.filter(
    (sub) => sub.node.status.renewAt && sub.node.status.activeUntil
  );
  const totalActiveSub = activeSubscriptions.length;
  let count = 0;
  for (let index = 0; index < totalActiveSub; index++) {
    await (async function (subId) {
      await renewSubscription({ id: subId });
      count++;
      if (count > totalActiveSub - 1) console.log("All subscriptions renewed");
    })(activeSubscriptions[index].node.id);
  }
  return activeSubscriptions;
};

module.exports = { autoRenewSubscription };
