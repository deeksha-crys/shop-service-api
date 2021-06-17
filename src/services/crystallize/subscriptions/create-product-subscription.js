import { callPimApi, callCatalogueApi, getTenantId } from "../utils";

async function getProduct(path) {
  console.log("path ", path);
  const r = await callCatalogueApi({
    query: `
      query GET_PRODUCT($path: String!) {
        catalogue(path: $path, language: "en") {
          children {
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
    console.log("product ", JSON.stringify(product));
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
      const activeUntil = new Date();

      switch (planPeriod.initial.unit) {
        case "day": {
          activeUntil.setDate(
            activeUntil.getDate() + planPeriod.initial.period
          );
          break;
        }
        case "week": {
          activeUntil.setDate(
            activeUntil.getDate() + planPeriod.initial.period * 7
          );
          break;
        }
        case "month": {
          activeUntil.setMonth(
            activeUntil.getMonth() + planPeriod.initial.period
          );
          break;
        }
        case "year": {
          activeUntil.setFullYear(
            activeUntil.getFullYear() + planPeriod.initial.period
          );
          break;
        }
      }

      productSubscription.status = {
        price: initial.price,
        currency: initial.currency,
        activeUntil: activeUntil.toISOString(),
        renewAt: activeUntil.toISOString(),
      };
    }

    const createSubscriptionResponse = await callPimApi({
      query: `
        mutation CREATE_PRODUCT_SUBSCRIPTION($productSubscription: CreateProductSubscriptionInput!) {
          productSubscription {
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

    if (createSubscriptionResponse.errors) {
      console.log(JSON.stringify(createSubscriptionResponse.errors, null, 2));
      throw new Error(createSubscriptionResponse.errors);
    }
    console.log("createSubscriptionResponse -> ", createSubscriptionResponse);
    return createSubscriptionResponse;

    // res.json({
    //   status: "success",
    //   createSubscriptionResponse,
    // });
  } catch (error) {
    console.log("Error -> ", error.message);
  }
};
