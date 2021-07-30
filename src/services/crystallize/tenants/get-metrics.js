const { callPimApi } = require("../utils");
const now = new Date();
const year = now.getFullYear();
const month = now.getMonth();

export const getStartDate = () => getIsoDate(year, month, true);
export const getEndDate = () => getIsoDate(year, month, false);

export const getIsoDate = (year, month, start) => {
  const firstDay = 1;
  const lastDay = new Date(year, month + 1, 0).getDate();
  return new Date(
    Date.UTC(year, month, start ? firstDay : lastDay)
  ).toISOString();
};

module.exports = async function getMetrics(tenantId) {
  const response = await callPimApi({
    variables: {
      id: tenantId,
      start: getStartDate(),
      end: getEndDate(),
    },
    query: `
      query getTenantUsage($id: ID, $start: DateTime!, $end: DateTime!) {
        tenant {
          get(id: $id) {
            metrics{
              items {
                periodCount: count(start: $start, end: $end) 
                countSinceInception: count(end: $end)
              }
              bandwidth {
                 periodTotal: total(start: $start, end: $end, unit: GiB)
                 totalSinceInception: total(end: $end, unit: GiB)
              }
              apiCalls {
                count(start: $start, end: $end)
              }
              orders {
                count(start: $start, end: $end)
              }
            }                      
          }
        }
      }
    `,
  });

  return response.data.tenant.get.metrics;
};
