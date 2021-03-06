const { callOrdersApi } = require("../utils");

module.exports = async function getOrder(id) {
  const response = await callOrdersApi({
    variables: {
      id,
    },
    query: `
      query getOrder($id: ID!){
        orders {
          get(id: $id) {
            id
            createdAt
            total {
              net
              gross
              currency
              tax {
                name
                percent
              }
            }
            meta {
              key
              value
            }
            additionalInformation
            payment {
              ... on StripePayment {
                paymentMethod
              }
              ... on CustomPayment {
                provider
                properties {
                  property
                  value
                }
              }
            }
            cart {
              sku
              name
              quantity
              imageUrl
              subscription {
                meteredVariables {
                  id
                  usage
                  price
                }
              }
              price {
                net
                gross
                currency
                tax{name percent}
              }
              meta {
                key
                value
              }
            }
            customer {
              identifier
              firstName
              lastName
              addresses {
                type
                email
              }
            }
          }
        }
      }
    `,
  });

  const order = response.data.orders.get;

  if (!order) {
    throw new Error(`Cannot retrieve order "${id}"`);
  }

  return order;
};
