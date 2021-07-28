const { callPimApi } = require("../utils");

module.exports = async function getMetrics(tenantId) {
  const response = await callPimApi({
    variables: {
      id: tenantId,
    },
    query: `
      query getTenantUsage($id: ID) {
        tenant {
          get(id: $id) {
            metrics{
              items {
                count
              }
              bandwidth {
                 total
              }
              apiCalls {
                count
              }
              orders {
                count
              }
            }                      
          }
        }
      }
    `,
  });

  return response.data.tenant.get.metrics;
};
