const { callPimApi } = require("../utils");

module.exports = async function getTenantInfo(tenantId) {
  const response = await callPimApi({
    variables: {
      id: tenantId,
    },
    query: `
      query getTenantInfo($id: ID) {
        tenant {
          get(id: $id) {
            identifier
          }
        }
      }
    `,
  });
  return response.data.tenant.get;
};
