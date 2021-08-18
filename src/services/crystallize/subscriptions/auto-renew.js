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
  // const activeSubscriptions = [
  //   {
  //     node: {
  //       customerIdentifier: "60f9784dadddea0008fb4536",
  //       id: "611bf6aed983fe0009bb5bba",
  //       status: {
  //         renewAt: "2021-11-01T17:49:33.626Z",
  //         activeUntil: "2021-11-01T17:49:33.626Z",
  //       },
  //     },
  //   },
  //   {
  //     node: {
  //       customerIdentifier: "603d4bc27b6fc80009c747a0",
  //       id: "611d3901d983fe0009bb5bcb",
  //       status: {
  //         renewAt: "2021-09-01T16:44:49.413Z",
  //         activeUntil: "2021-09-01T16:44:49.413Z",
  //       },
  //     },
  //   },
  // ];
  const allPromises = activeSubscriptions.map((activeSub) => {
    return renewSubscription({ id: activeSub.node.id }).catch(
      (err) => "Error: " + err
    );
  });
  Promise.all(allPromises).then((values) => console.log(values));

  // const totalActiveSub = activeSubscriptions.length;
  // let count = 0;
  // for (let index = 0; index < totalActiveSub; index++) {
  //   await (async function (subId) {
  //     await renewSubscription({ id: subId });
  //     count++;
  //     if (count > totalActiveSub - 1) console.log("All subscriptions renewed");
  //   })(activeSubscriptions[index].node.id);
  // }
  return activeSubscriptions;
};

module.exports = { autoRenewSubscription };
