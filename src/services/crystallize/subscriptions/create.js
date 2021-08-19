import {
  callProductSubscriptionsApi,
  callCatalogueApi,
  getTenantId,
} from "../utils";

async function getProduct(path) {
  const r = await callCatalogueApi({
    query: `
      query GET_PRODUCT($path: String!) {
        catalogue(path: $path, language: "en") {
          ... on Product {
            variants {
              sku
              subscriptionPlans {
                identifier
                name
                periods {
                  id
                  name
                  initial {
                    ...period
                  }
                  recurring {
                    ...period
                  }
                }
              }
            }
          }
        }
      }

      fragment period on ProductVariantSubscriptionPlanPricing {
        unit
        period
        priceVariants {
          identifier
          name
          currency
          price
        }
      }
    `,
    variables: {
      path,
    },
  });

  return r.data.catalogue;
}

const getPriceForIdentifier = (priceVariantIdentifier) => (priceVariants) => {
  const { price, currency } = priceVariants.find(
    (p) => p.identifier === priceVariantIdentifier
  );

  return {
    price,
    currency,
  };
};

module.exports = async function createProductSubscription({
  item,
  itemPath,
  subscriptionPlan,
  customerIdentifier,
  priceVariantIdentifier,
}) {
  try {
    const tenantId = await getTenantId();
    const product = await getProduct(itemPath);
    const planPeriod = product.variants
      .find((v) => v.sku === item.sku)
      ?.subscriptionPlans.find(
        (p) => p.identifier === subscriptionPlan.identifier
      )
      ?.periods.find((p) => p.id === subscriptionPlan.periodId);
    if (!planPeriod) {
      throw new Error(
        `Cannot find plan period with id "${subscriptionPlan.periodId}" for ${item.sku}`
      );
    }

    const getPrice = getPriceForIdentifier(priceVariantIdentifier);

    const initial = getPrice(planPeriod.initial.priceVariants);

    const productSubscription = {
      tenantId,
      subscriptionPlan,
      customerIdentifier,
      item,
      initial,
      recurring: getPrice(planPeriod.recurring.priceVariants),
    };

    // Define the current status of the subscription
    {
      const date = new Date();
      const activeUntil = new Date();
      activeUntil.setMonth(date.getMonth() + 1, 1);

      productSubscription.status = {
        price: initial.price,
        currency: initial.currency,
        activeUntil: activeUntil.toISOString(),
        renewAt: activeUntil.toISOString(),
      };
    }
    const response = await callProductSubscriptionsApi({
      query: `
        mutation CREATE_PRODUCT_SUBSCRIPTION($productSubscription: CreateSubscriptionContractInput) {
          subscriptionContracts {
            create(input: $productSubscription) {
              id
            }
          }
        }
      `,
      variables: {
        productSubscription,
      },
    });
    console.log("Response from server ", response);
    if (response.errors) console.log(JSON.stringify(response.errors, null, 2));
    return response.data.subscriptionContracts.create;
  } catch (error) {
    console.log("Error -> ", error.message);
    throw new Error(error);
  }
};
