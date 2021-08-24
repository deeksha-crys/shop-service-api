const { callPimApi, getTenantId } = require("../utils");

const CRYSTALLIZE_NEW_ORDER_STAGE_ID =
  process.env.CRYSTALLIZE_NEW_ORDER_STAGE_ID;
const CRYSTALLIZE_FAILED_ORDER_STAGE_ID =
  process.env.CRYSTALLIZE_FAILED_ORDER_STAGE_ID;

module.exports = async function getAllOrdersForCustomer(customerIdentifier) {
  const tenantId = await getTenantId();
  const response = await callPimApi({
    variables: {
      customerIdentifier: customerIdentifier,
      tenantId: tenantId,
    },
    query: `
      query getAllOrders($customerIdentifier: String, $tenantId: ID!) {
        order {
          getMany(customerIdentifier: $customerIdentifier, tenantId: $tenantId) {
            pageInfo {
              totalNodes
            }
            edges {
              node {
                createdAt
                updatedAt
                total {
                  gross
                  currency
                }
                cart {
                  quantity
                  name
                  sku
                  subscription {
                    meteredVariables {
                      id
                      usage
                      price
                    }
                  }
                }
                pipelines {
                  stageId            
                }
              }
            }
          }
        }
      }
    `,
  });

  const orders = response.data.order.getMany.edges;
  const ordersWithStatus = orders.map((order) => {
    let status;
    const stageId = order.node.pipelines[0]["stageId"];
    if (stageId === CRYSTALLIZE_NEW_ORDER_STAGE_ID) status = "Due";
    else if (stageId === CRYSTALLIZE_FAILED_ORDER_STAGE_ID) status = "OverDue";
    else status = "Paid";
    return { status: status, ...order.node };
  });

  if (!orders) {
    throw new Error(
      `Cannot retrieve orders for customer identifier:  "${customerIdentifier}"`
    );
  }
  return ordersWithStatus;
};
