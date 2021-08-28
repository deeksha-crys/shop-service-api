const invariant = require("invariant");
const fetch = require("node-fetch");

const CRYSTALLIZE_TENANT_IDENTIFIER = process.env.CRYSTALLIZE_TENANT_IDENTIFIER;
const CRYSTALLIZE_ACCESS_TOKEN_ID = process.env.CRYSTALLIZE_ACCESS_TOKEN_ID;
const CRYSTALLIZE_ACCESS_TOKEN_SECRET =
  process.env.CRYSTALLIZE_ACCESS_TOKEN_SECRET;
const CRYSTALLIZE_PIM_API_URL = process.env.CRYSTALLIZE_PIM_API_URL;
const CRYSTALLIZE_CATALOGUE_API_URL = process.env.CRYSTALLIZE_CATALOGUE_API_URL;
const CRYSTALLIZE_ORDERS_API_URL = process.env.CRYSTALLIZE_ORDERS_API_URL;
const CRYSTALLIZE_SUBSCRIPTIONS_API_URL =
  process.env.CRYSTALLIZE_SUBSCRIPTIONS_API_URL;
const STRIPE_CUSTOMER_ID_KEY = "stripeCustomerId";
const STRIPE_PAYMENT_METHOD_ID = "stripePaymentMethodId";

invariant(
  CRYSTALLIZE_TENANT_IDENTIFIER,
  "Missing process.env.CRYSTALLIZE_TENANT_IDENTIFIER"
);

function createApiCaller(uri) {
  return async function callApi({ query, variables, operationName }) {
    invariant(
      CRYSTALLIZE_ACCESS_TOKEN_ID,
      "Missing process.env.CRYSTALLIZE_ACCESS_TOKEN_ID"
    );
    invariant(
      CRYSTALLIZE_ACCESS_TOKEN_SECRET,
      "Missing process.env.CRYSTALLIZE_ACCESS_TOKEN_SECRET"
    );

    const response = await fetch(uri, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "X-Crystallize-Access-Token-Id": CRYSTALLIZE_ACCESS_TOKEN_ID,
        "X-Crystallize-Access-Token-Secret": CRYSTALLIZE_ACCESS_TOKEN_SECRET,
      },
      body: JSON.stringify({ operationName, query, variables }),
    });

    const json = await response.json();
    if (json.errors) {
      console.log(JSON.stringify(json.errors, null, 2));
    }

    return json;
  };
}

function normaliseOrderModel({ customer, cart, total, ...rest }) {
  return {
    ...rest,
    ...(total && {
      total: {
        gross: total.gross,
        net: total.net,
        currency: total.currency,
        tax: total.tax,
      },
    }),
    ...(cart && {
      cart: cart.map(function handleOrderCartItem(item) {
        const {
          images = [],
          name,
          sku,
          productId,
          productVariantId,
          quantity,
          subscription,
          subscriptionContractId,
          price,
        } = item;

        return {
          name,
          sku,
          productId,
          productVariantId,
          quantity,
          subscription,
          subscriptionContractId,
          price,
          imageUrl: images && images[0] && images[0].url,
        };
      }),
    }),
    ...(customer && {
      customer: {
        identifier: customer.identifier || null,
        firstName: customer.firstName || null,
        lastName: customer.lastName || null,
        addresses: customer.addresses || [
          {
            type: "billing",
            email: customer.email || undefined,
          },
        ],
      },
    }),
  };
}

const getTenantId = (function () {
  let tenantId;

  return async () => {
    if (tenantId) {
      return tenantId;
    }

    const tenantIdResponse = await callCatalogueApi({
      query: `
          {
            tenant {
              id
            }
          }
        `,
    });
    tenantId = tenantIdResponse.data.tenant.id;

    return tenantId;
  };
})();

/**
 * Catalogue API is the fast read-only API to lookup data
 * for a given item path or anything else in the catalogue
 */
// const callCatalogueApi = createApiCaller(
//   `https://api.crystallize.com/${CRYSTALLIZE_TENANT_IDENTIFIER}/catalogue`
// );

const callCatalogueApi = createApiCaller(
  `${CRYSTALLIZE_CATALOGUE_API_URL}/${CRYSTALLIZE_TENANT_IDENTIFIER}/catalogue`
);

/**
 * Search API is the fast read-only API to search across
 * all items and topics
 */
const callSearchApi = createApiCaller(
  `https://api.crystallize.com/${CRYSTALLIZE_TENANT_IDENTIFIER}/search`
);

/**
 * Orders API is the highly scalable API to send/read massive
 * amounts of orders
 */
// const callOrdersApi = createApiCaller(
//   `https://api.crystallize.com/${CRYSTALLIZE_TENANT_IDENTIFIER}/orders`
// );
const callOrdersApi = createApiCaller(
  `${CRYSTALLIZE_ORDERS_API_URL}/${CRYSTALLIZE_TENANT_IDENTIFIER}/orders`
);

const callProductSubscriptionsApi = createApiCaller(
  `${CRYSTALLIZE_SUBSCRIPTIONS_API_URL}/${CRYSTALLIZE_TENANT_IDENTIFIER}/subscriptions`
);

/**
 * The PIM API is used for doing the ALL possible actions on
 * a tenant or your user profile
 */
// const callPimApi = createApiCaller("https://pim.crystallize.com/graphql");
const callPimApi = createApiCaller(CRYSTALLIZE_PIM_API_URL);

const planPricing = {
  atom: {
    orders: { max_orders: 1000, per_extra_orders: 0.2 },
    bandwidth: {
      max_bandwidth: 50,
      per_extra_bandwidth: 0.15,
    },
    items: { max_items: 1000000, per_extra_items: 0.02 },
    apiCalls: {
      max_api_calls: 500000,
      per_extra_api_calls: 1,
      api_calls_chunk_size: 100000,
    },
    basePrice: 29900,
  },
  particle: {
    orders: { max_orders: 50, per_extra_orders: 0.5 },
    bandwidth: { max_bandwidth: 5, per_extra_bandwidth: 0.3 },
    items: { max_items: 1000, per_extra_items: 0.05 },
    apiCalls: {
      max_api_calls: 25000,
      per_extra_api_calls: 2,
      api_calls_chunk_size: 25000,
    },
    basePrice: 0,
  },
};

const getPayableUsage = (planName, metrics) => {
  const planLimit = planPricing[planName];
  return {
    orders: {
      unit_amount: planLimit.orders.per_extra_orders * 100,
      quantity:
        metrics.orders.count <= planLimit.orders.max_orders
          ? 0
          : metrics.orders.count - planLimit.orders.max_orders,
    },
    items: {
      unit_amount: planLimit.items.per_extra_items * 100,
      quantity:
        metrics.items.periodCount <= planLimit.items.max_items
          ? 0
          : metrics.items.periodCount - planLimit.items.max_items,
    },
    apiCalls: {
      unit_amount:
        (planLimit.apiCalls.per_extra_api_calls /
          planLimit.apiCalls.api_calls_chunk_size) *
        100,
      quantity:
        metrics.apiCalls.count <= planLimit.apiCalls.max_api_calls
          ? 0
          : metrics.apiCalls.count - planLimit.apiCalls.max_api_calls,
    },
    bandwidth: {
      unit_amount: planLimit.bandwidth.per_extra_bandwidth * 100,
      quantity:
        metrics.bandwidth.totalSinceInception -
          planLimit.bandwidth.max_bandwidth >=
        metrics.bandwidth.periodTotal
          ? Math.round(metrics.bandwidth.periodTotal)
          : 0,
    },
    plan: { unit_amount: planLimit.basePrice, quantity: 1 },
  };
};

const getNetUsageCost = (usage) => {
  const itemsCost = usage.items.unit_amount * usage.items.quantity;
  const apiCallsCost = usage.apiCalls.unit_amount * usage.apiCalls.quantity;
  const bandwidthCost = usage.bandwidth.unit_amount * usage.bandwidth.quantity;
  const ordersCost = usage.orders.unit_amount * usage.orders.quantity;
  return (
    itemsCost / 100 +
    apiCallsCost / 100 +
    bandwidthCost / 100 +
    ordersCost / 100 +
    usage.plan.unit_amount / 100
  );
};

const paymentStatus = {
  PAYMENT_SUCCESS: "PAYMENT_SUCCESS",
  PAYMENT_FAILURE: "PAYMENT_FAILURE",
  PAYMENT_METHOD_MISSING: "PAYMENT_METHOD_MISSING",
  NO_PAYMENT_REQUIRED: "NO_PAYMENT_REQUIRED",
};

const constructOrderPayload = (
  downgradedAtomPlanThisMonth,
  crystallizeCustomer,
  item,
  metrics,
  payableUsage,
  subscriptionContractId
) => {
  const {
    identifier,
    firstName,
    lastName,
    addresses,
    externalReferences,
    email,
    meta,
  } = crystallizeCustomer;
  const stripeCustomerId = externalReferences.filter(
    (ext) => ext.key === STRIPE_CUSTOMER_ID_KEY
  )[0].value;

  let stripePaymentMethodId = meta?.filter(
    (m) => m.key === STRIPE_PAYMENT_METHOD_ID
  )[0]?.value;

  const billingAddress = addresses.filter(
    (addr) => addr?.type?.toLowerCase() === "billing" && addr?.country
  )[0];

  const taxPercent =
    billingAddress && billingAddress.country.toLowerCase() === "norway"
      ? 25
      : 0;
  const netPrice = parseFloat(getNetUsageCost(payableUsage).toFixed(2));
  const grossPrice = parseFloat(
    (netPrice + (netPrice * taxPercent) / 100).toFixed(2)
  );

  const catalogueItemsPrice =
    (payableUsage.items.unit_amount * payableUsage.items.quantity) /
    (100).toFixed(2);
  const ordersPrice =
    (payableUsage.orders.unit_amount * payableUsage.orders.quantity) /
    (100).toFixed(2);
  const apiCallsPrice =
    (payableUsage.apiCalls.unit_amount * payableUsage.apiCalls.quantity) /
    (100).toFixed(2);
  const bandwidthPrice =
    (payableUsage.bandwidth.unit_amount * payableUsage.bandwidth.quantity) /
    (100).toFixed(2);

  return {
    customer: {
      identifier,
      firstName,
      lastName,
      addresses,
    },
    cart: [
      {
        quantity: 1,
        subscriptionContractId: subscriptionContractId,
        name: downgradedAtomPlanThisMonth
          ? downgradedAtomPlanThisMonth.node.item.name
          : item.name,
        sku: downgradedAtomPlanThisMonth
          ? downgradedAtomPlanThisMonth.node.item.sku
          : item.sku,
        price: {
          gross: grossPrice,
          net: netPrice,
          currency: "USD",
          tax: { name: "VAT", percent: taxPercent },
        },
        subscription: {
          period: 1,
          unit: "month",
          meteredVariables: [
            {
              id: "611ebbe7fd767e0008d72025",
              usage: metrics.items.periodCount,
              price: parseFloat(catalogueItemsPrice),
            },
            {
              id: "611ebbe7fd767e0008d72028",
              usage: metrics.bandwidth.periodTotal,
              price: parseFloat(bandwidthPrice),
            },
            {
              id: "611ebbe7fd767e0008d72027",
              usage: metrics.apiCalls.count,
              price: parseFloat(apiCallsPrice),
            },
            {
              id: "611ebbe7fd767e0008d72026",
              usage: metrics.orders.count,
              price: parseFloat(ordersPrice),
            },
          ],
        },
      },
    ],
    total: {
      tax: { name: "VAT", percent: taxPercent },
      currency: "USD",
      net: netPrice,
      gross: grossPrice,
    },
    payment: {
      provider: "stripe",
      stripe: {
        customerId: stripeCustomerId,
        paymentMethodId: stripePaymentMethodId ? stripePaymentMethodId : "",
      },
    },
    meta: [{ key: "email", value: email }],
  };
};

module.exports = {
  normaliseOrderModel,
  callCatalogueApi,
  callSearchApi,
  callOrdersApi,
  callPimApi,
  getTenantId,
  callProductSubscriptionsApi,
  getPayableUsage,
  getNetUsageCost,
  constructOrderPayload,
  paymentStatus,
  planPricing,
};
