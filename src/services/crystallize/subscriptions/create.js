import {
  callProductSubscriptionsApi,
  callCatalogueApi,
  getTenantId,
} from "../utils";
import getSubscriptionPlan from "./get-subscription-plan";

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
        price
        meteredVariables {
          id
          tierType
          tiers { price threshold }
        }
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

const getMeteredVariableTier = (productMeteredVariables, id) => {
  return productMeteredVariables.filter((m) => m.id === id)[0].tiers[0];
};

const constructMetersForContract = (subPlanMeters, planName, productMeters) => {
  return subPlanMeters.reduce((newArr, curr) => {
    const tier = {
      currency: "USD",
      ...getMeteredVariableTier(productMeters, curr.id),
    };
    newArr.push({
      id: curr.id,
      tierType: "graduated",
      tiers: [tier],
    });
    return newArr;
  }, []);
};

module.exports = async function createProductSubscription({
  item,
  itemPath,
  customerIdentifier,
  priceVariantIdentifier,
}) {
  const plan = await getSubscriptionPlan();
  const subscriptionPlanPeriodId = plan.periods[0].id;
  const subscriptionPlanReference = {
    identifier: plan.identifier,
    periodId: subscriptionPlanPeriodId,
  };
  const planName = item.name.includes("particle") ? "particle" : "atom";
  try {
    const tenantId = await getTenantId();
    const product = await getProduct(itemPath);
    const planPeriod = product.variants
      .find((v) => v.sku === item.sku)
      ?.subscriptionPlans.find((p) => p.identifier === plan.identifier)
      ?.periods.find((p) => p.id === subscriptionPlanPeriodId);
    if (!planPeriod) {
      throw new Error(
        `Cannot find plan period with id "${subscriptionPlanPeriodId}" for ${item.sku}`
      );
    }
    const productMeteredVariables =
      product.variants[0].subscriptionPlans[0].periods[0].initial
        .meteredVariables;
    const subContractMeteredVariables = constructMetersForContract(
      plan.meteredVariables,
      planName,
      productMeteredVariables
    );
    const getPrice = getPriceForIdentifier(priceVariantIdentifier);
    const initial = getPrice(planPeriod.initial.priceVariants);
    initial.meteredVariables = subContractMeteredVariables;
    const recurring = getPrice(planPeriod.recurring.priceVariants);
    recurring.meteredVariables = subContractMeteredVariables;

    const subscriptionContract = {
      tenantId,
      subscriptionPlan: subscriptionPlanReference,
      customerIdentifier,
      item,
      initial,
      recurring,
    };

    // Define the current status of the subscription
    {
      const date = new Date();
      const activeUntil = new Date();
      activeUntil.setMonth(date.getMonth() + 1, 1);

      subscriptionContract.status = {
        price: initial.price,
        currency: initial.currency,
        activeUntil: activeUntil.toISOString(),
        renewAt: activeUntil.toISOString(),
      };
    }
    const response = await callProductSubscriptionsApi({
      query: `
        mutation CREATE_SUBSCRIPTION_CONTRACT($subscriptionContract: CreateSubscriptionContractInput) {
          subscriptionContracts {
            create(input: $subscriptionContract) {
              id
            }
          }
        }
      `,
      variables: {
        subscriptionContract,
      },
    });
    if (response.errors) console.log(JSON.stringify(response.errors, null, 2));
    return response.data.subscriptionContracts.create;
  } catch (error) {
    console.log("Error -> ", error.message);
    throw new Error(error);
  }
};
