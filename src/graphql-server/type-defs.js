const gql = require("graphql-tag");

module.exports = gql`
  scalar JSON

  type Query {
    myCustomBusinessThing: MyCustomBusinnessQueries!
    basket(basketModel: BasketModelInput!): Basket!
    user: User!
    paymentProviders: PaymentProvidersQueries!
    orders: OrderQueries!
    subscriptions: SubscriptionQueries!
    customers: CustomerQueries!
    voucher(code: String!): VoucherResponse!
  }

  type CustomerQueries {
    get(identifier: String!, externalReference: String): JSON
  }

  type VoucherResponse {
    voucher: Voucher
    isValid: Boolean!
  }

  type MyCustomBusinnessQueries {
    whatIsThis: String!
    dynamicRandomInt: Int!
  }

  type Basket {
    cart: [CartItem!]!
    total: Price!
    voucher: Voucher
  }

  type CartItem {
    sku: String!
    name: String
    path: String
    quantity: Int!
    vatType: VatType
    stock: Int
    price: Price
    priceVariants: [PriceVariant!]
    attributes: [Attribute!]
    images: [Image!]
  }

  type PriceVariant {
    price: Float
    identifier: String!
    currency: String!
  }

  type Attribute {
    attribute: String!
    value: String
  }

  type Image {
    url: String!
    variants: [ImageVariant!]
  }

  type ImageVariant {
    url: String!
    width: Int
    height: Int
  }

  type Price {
    gross: Float!
    net: Float!
    currency: String
    tax: Tax
    taxAmount: Float
    discount: Float!
  }

  type Tax {
    name: String
    percent: Float
  }

  type VatType {
    name: String!
    percent: Int!
  }

  type User {
    logoutLink: String!
    isLoggedIn: Boolean!
    email: String
    firstName: String
    middleName: String
    lastName: String
    meta: [KeyValuePair!]
  }

  input CreateCustomerInput {
    identifier: String
    email: String
    firstName: String!
    middleName: String
    lastName: String!
    companyName: String
    taxNumber: String
    addresses: [AddressInput!]
    meta: [KeyValuePairInput!]
    externalReferences: [KeyValuePairInput!]
  }

  input UpdateCustomerInput {
    email: String
    firstName: String!
    middleName: String
    lastName: String!
    companyName: String
    taxNumber: String
    addresses: [AddressInput!]
    meta: [KeyValuePairInput!]
    externalReferences: [KeyValuePairInput!]
  }

  type PaymentProvidersQueries {
    stripe: StripePaymentProvider!
    klarna: PaymentProvider!
    vipps: PaymentProvider!
    mollie: PaymentProvider!
  }

  type PaymentProvider {
    enabled: Boolean!
    config: JSON
  }

  type StripePaymentProvider {
    enabled: Boolean!
    config: JSON
    retrievePaymentMethod(id: String!): JSON
  }

  type OrderQueries {
    get(id: String!): JSON
    getAll(customerIdentifier: String!): JSON
  }

  type SubscriptionQueries {
    getAll(customerIdentifier: String!): JSON
  }

  type Voucher {
    code: String!
    discountAmount: Int
    discountPercent: Float
  }

  type Mutation {
    user: UserMutations
    paymentProviders: PaymentProvidersMutations!
    customers: CrystallizeCustomerMutations!
    subscriptions: SubscriptionMutations!
  }

  type CrystallizeCustomerMutations {
    create(customer: CreateCustomerInput!): JSON
    update(identifier: String!, customer: UpdateCustomerInput!): JSON
  }

  type SubscriptionMutations {
    create(input: CreateSubscriptionContractInput!): JSON
    cancel(id: String!, deactivate: Boolean): JSON
    renew(id: String!): JSON
  }

  input CreateSubscriptionContractInput {
    item: ProductSubscriptionItem!
    itemPath: String!
    customerIdentifier: String!
    priceVariantIdentifier: String!
  }

  input ProductSubscriptionItem {
    name: String!
    sku: String!
  }

  input BasketModelInput {
    locale: LocaleInput!
    cart: [SimpleCartItem!]!
    voucherCode: String
    crystallizeOrderId: String
    klarnaOrderId: String
  }

  input LocaleInput {
    locale: String!
    displayName: String
    appLanguage: String!
    crystallizeCatalogueLanguage: String
    crystallizePriceVariant: String
  }

  input SimpleCartItem {
    sku: String!
    path: String!
    quantity: Int
    priceVariantIdentifier: String!
  }

  type UserMutations {
    sendMagicLink(
      email: String!
      redirectURLAfterLogin: String!
    ): SendMagicLinkResponse!
    update(input: UserUpdateInput!): User!
  }

  input UserUpdateInput {
    firstName: String
    middleName: String
    lastName: String
    meta: [KeyValuePairInput!]
  }

  type SendMagicLinkResponse {
    success: Boolean!
    error: String
  }

  input CheckoutModelInput {
    basketModel: BasketModelInput!
    customer: OrderCustomerInput
    confirmationURL: String!
    checkoutURL: String!
    termsURL: String!
  }

  input OrderCustomerInput {
    firstName: String
    lastName: String
    addresses: [AddressInput!]
  }

  input AddressInput {
    type: String
    email: String
    firstName: String
    middleName: String
    lastName: String
    street: String
    street2: String
    streetNumber: String
    postalCode: String
    city: String
    state: String
    country: String
    phone: String
  }

  type PaymentProvidersMutations {
    stripe: StripeMutations!
    klarna: KlarnaMutations!
    mollie: MollieMutations!
    vipps: VippsMutations!
  }

  type StripeMutations {
    createPaymentIntent(
      checkoutModel: CheckoutModelInput!
      confirm: Boolean
      paymentMethodId: String
    ): JSON
    createCustomerWithSetUpIntent(customer: StripeCustomerInput!): JSON
    createSetupIntent(customerId: String!): JSON
    detachPaymentMethod(id: String!): JSON
    attachPaymentMethod(id: String!, customerId: String!): JSON
    generateInvoiceAndChargePayment(
      customerId: String!
      taxRateId: String
      usage: StripeInvoiceUsageInput!
      orderId: String!
    ): JSON
    confirmOrder(
      checkoutModel: CheckoutModelInput!
      paymentIntentId: String!
    ): StripeConfirmOrderResponse!
  }

  input StripeInvoiceUsageInput {
    orders: StripeInvoiceItemInput!
    bandwidth: StripeInvoiceItemInput!
    items: StripeInvoiceItemInput!
    apiCalls: StripeInvoiceItemInput!
    plan: StripeInvoiceItemInput!
  }

  input StripeInvoiceItemInput {
    unit_amount: Float
    quantity: Int
  }

  input StripeCustomerInput {
    name: String!
    email: String!
    address: StripeAddressInput!
    metadata: JSON
  }

  input StripeAddressInput {
    city: String!
    line1: String!
    country: String!
    postal_code: String!
    state: String!
  }

  type StripeConfirmOrderResponse {
    success: Boolean!
    orderId: String
  }

  type KlarnaMutations {
    renderCheckout(
      checkoutModel: CheckoutModelInput!
    ): KlarnaRenderCheckoutReponse!
  }

  type KlarnaRenderCheckoutReponse {
    html: String!
    klarnaOrderId: String!
    crystallizeOrderId: String!
  }

  type MollieMutations {
    createPayment(
      checkoutModel: CheckoutModelInput!
    ): MollieCreatePaymentResponse!
  }

  type MollieCreatePaymentResponse {
    success: Boolean!
    checkoutLink: String
    crystallizeOrderId: String!
  }

  type VippsMutations {
    initiatePayment(
      checkoutModel: CheckoutModelInput!
    ): VippsInitiatePaymentResponse!
  }

  type VippsInitiatePaymentResponse {
    success: Boolean!
    checkoutLink: String
    crystallizeOrderId: String!
  }

  type KeyValuePair {
    key: String!
    value: String
  }

  input KeyValuePairInput {
    key: String!
    value: String
  }
`;
