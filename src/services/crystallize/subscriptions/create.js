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

//TODO: These meteredVariables should be derived by querying the /catalogue API on Product.
//      But catalogue API currently does not have the meteredVariables.
const atomMeterTiers = {
  atom: {
    "catalogue-items": { threshold: 1000000, price: 0.0, currency: "USD" },
    orders: { threshold: 1000, price: 0.0, currency: "USD" },
    bandwidth: { threshold: 50, price: 0.0, currency: "USD" },
    "api-calls": { threshold: 500000, price: 0.0, currency: "USD" },
  },
  particle: {
    "catalogue-items": { threshold: 1000, price: 0.0, currency: "USD" },
    orders: { threshold: 50, price: 0.0, currency: "USD" },
    bandwidth: { threshold: 5, price: 0.0, currency: "USD" },
    "api-calls": { threshold: 25000, price: 0.0, currency: "USD" },
  },
};

const constructMetersForContract = (meters, planName) => {
  const planMeters = atomMeterTiers[planName];
  return meters.reduce((newArr, curr) => {
    const tier = planMeters[curr.identifier];
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
  subscriptionPlan,
  customerIdentifier,
  priceVariantIdentifier,
}) {
  const plan = await getSubscriptionPlan();
  const subscriptionPlanPeriodId = plan.periods[0].id;
  const subscriptionPlanReference = {
    identifier: plan.identifier,
    periodId: subscriptionPlanPeriodId,
  };
  const meteredVariables = constructMetersForContract(plan.meteredVariables);
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
    const getPrice = getPriceForIdentifier(priceVariantIdentifier);
    const initial = getPrice(planPeriod.initial.priceVariants);
    initial.meteredVariables = meteredVariables;
    const recurring = getPrice(planPeriod.recurring.priceVariants);
    recurring.meteredVariables = meteredVariables;

    const productSubscription = {
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

      productSubscription.status = {
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
