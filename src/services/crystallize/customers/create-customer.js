// const { callPimApi, getTenantId } = require("../utils");
//
// module.exports = async function createCustomer(customer) {
//   const tenantId = await getTenantId();
//   const response = await callPimApi({
//     variables: {
//       input: {
//         tenantId,
//         ...customer,
//       },
//     },
//     query: `
//       mutation createCustomer(
//         $input: CreateCustomerInput!
//       ) {
//         customer {
//           create(
//             input: $input
//           ) {
//             identifier
//           }
//         }
//       }
//     `,
//   });
//
//   return response.data.customer.create;
// };

/**
 * TODO: Confirm with Håkon if there should be different impl for create-customer?
 * TODO: Currently for Crystallize subscriptions, PIM should call create-customer with tenantId and customer
 */
const { callPimApi } = require("../utils");
module.exports = async function createCustomer({ customer }) {
  const response = await callPimApi({
    variables: {
      input: {
        ...customer,
      },
    },
    query: `
      mutation createCustomer(
        $input: CreateCustomerInput!
      ) {
        customer {
          create(
            input: $input
          ) {
            identifier
          }
        }
      }
    `,
  });
  return response.data.customer.create;
};
