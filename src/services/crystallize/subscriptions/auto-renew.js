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
  console.log("TOTAL subscriptions ", subscriptionsObj.length);
  // const subscriptionsObj = {
  //   subscriptions: [
  //     {
  //       node: {
  //         customerIdentifier: "60f9784dadddea0008fb4536",
  //         id: "611bf6aed983fe0009bb5bba",
  //         status: {
  //           renewAt: "2021-09-01T18:33:15.662Z",
  //           activeUntil: "2021-09-01T18:33:15.662Z",
  //         },
  //       },
  //     },
  //     {
  //       node: {
  //         customerIdentifier: "604130d69b7883000883106r",
  //         id: "60f96b48c6709b0008a9db65a",
  //         status: {
  //           renewAt: null,
  //           activeUntil: "2021-09-01T12:57:43.992Z",
  //         },
  //       },
  //     },
  //   ],
  // };
  const activeSubscriptions = subscriptionsObj.filter(
    (sub) => sub.node.status.renewAt && sub.node.status.activeUntil
  );
  console.log("ACTIVE SUBSCRIPTIONS ", activeSubscriptions);
  const totalActiveSub = activeSubscriptions.length;
  console.log("TOTAL ACTIVE SUBSCRIPTIONS ", totalActiveSub);
  let count = 0;
  for (let index = 0; index < totalActiveSub; index++) {
    await (async function (subId) {
      const res = await renewSubscription({ id: subId });
      console.log("renew response ", res);
      count++;
      if (count > totalActiveSub - 1) return "All subscriptions renewed";
    })(activeSubscriptions[index].node.id);
  }

  // activeSubscriptions.forEach((activeSub) => {
  //   renewSubscription({ id: activeSub.node.id }).then((response) => {
  //     console.log("Subscription renewed ", response);
  //   });
  // });
  return activeSubscriptions;
};

module.exports = { autoRenewSubscription };
