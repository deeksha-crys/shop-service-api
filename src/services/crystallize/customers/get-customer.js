const { callPimApi, getTenantId } = require("../utils");

module.exports = async function getCustomer({ identifier, externalReference }) {
  const tenantId = await getTenantId();
  const response = await callPimApi({
    variables: {
      tenantId,
      identifier,
      externalReference,
    },
    query: `
      query getCustomer(
        $tenantId: ID!
        $identifier: String
        $externalReference: CustomerExternalReferenceInput
      ){
        customer {
          get(
            tenantId: $tenantId
            identifier: $identifier
            externalReference: $externalReference
          ) {
            identifier
            firstName
            middleName
            lastName
            email
            companyName
            taxNumber
            addresses {
              type
              country
              state
              city
              postalCode
            }
            meta {
              key
              value
            }
            externalReferences {
              key
              value
            }
          }
        }
      }
    `,
  });
  return response.data.customer.get;
};
