const crystallize = require("../services/crystallize");

const basketService = require("../services/basket-service");
const userService = require("../services/user-service");
const voucherService = require("../services/voucher-service");

const stripeService = require("../services/payment-providers/stripe");
const mollieService = require("../services/payment-providers/mollie");
const vippsService = require("../services/payment-providers/vipps");
const klarnaService = require("../services/payment-providers/klarna");

function paymentProviderResolver(service) {
  return () => {
    return {
      enabled: service.enabled,
      config: service.frontendConfig,
    };
  };
}

function stripeResolver(service) {
  return () => {
    return {
      enabled: service.enabled,
      config: service.frontendConfig,
      retrievePaymentMethod: (args) =>
        stripeService.retrievePaymentMethod(args.id),
    };
  };
}

module.exports = {
  Query: {
    myCustomBusinessThing: () => ({
      whatIsThis:
        "This is an example of a custom query for GraphQL demonstration purpuses. Check out the MyCustomBusinnessQueries resolvers for how to resolve additional fields apart from the 'whatIsThis' field",
    }),
    basket: (parent, args, context) => basketService.get({ ...args, context }),
    user: (parent, args, context) => userService.getUser({ context }),
    orders: () => ({}),
    paymentProviders: () => ({}),
    voucher: (parent, args, context) =>
      voucherService.get({ ...args, context }),
  },
  MyCustomBusinnessQueries: {
    dynamicRandomInt() {
      console.log("dynamicRandomInt called");
      return parseInt(Math.random() * 100);
    },
  },
  PaymentProvidersQueries: {
    stripe: stripeResolver(stripeService),
    klarna: paymentProviderResolver(klarnaService),
    vipps: paymentProviderResolver(vippsService),
    mollie: paymentProviderResolver(mollieService),
  },
  OrderQueries: {
    get: (parent, args) => crystallize.orders.get(args.id),
  },
  Mutation: {
    user: () => ({}),
    paymentProviders: () => ({}),
    customers: () => ({}),
    subscriptions: () => ({}),
  },
  UserMutations: {
    sendMagicLink: (parent, args, context) =>
      userService.sendMagicLink({ ...args, context }),
    update: (parent, args, context) => userService.update({ ...args, context }),
  },
  PaymentProvidersMutations: {
    stripe: () => ({}),
    klarna: () => ({}),
    mollie: () => ({}),
    vipps: () => ({}),
  },
  CrystallizeCustomerMutations: {
    create: (parent, args) => {
      return crystallize.customers.create({ ...args });
    },
  },
  SubscriptionMutations: {
    create: (parent, args) => {
      return crystallize.subscriptions.create({ ...args });
    },
  },
  StripeMutations: {
    createPaymentIntent: (parent, args, context) =>
      stripeService.createPaymentIntent({ ...args, context }),
    confirmOrder: (parent, args, context) =>
      stripeService.confirmOrder({ ...args, context }),
    createCustomerWithSetUpIntent: (parent, args) =>
      stripeService.createCustomerWithSetUpIntent({ ...args }),
    detachPaymentMethod: (parent, args) =>
      stripeService.detachPaymentMethod(args.id),
    attachPaymentMethod: (parent, args) =>
      stripeService.attachPaymentMethod(args.id, args.customerId),
  },
  KlarnaMutations: {
    renderCheckout: (parent, args, context) =>
      klarnaService.renderCheckout({
        ...args,
        context,
      }),
  },
  MollieMutations: {
    createPayment: (parent, args, context) =>
      mollieService.createPayment({
        ...args,
        context,
      }),
  },
  VippsMutations: {
    initiatePayment: (parent, args, context) =>
      vippsService.initiatePayment({
        ...args,
        context,
      }),
  },
};
