const fetch = require("node-fetch");

const SLACK_INCOMING_WEBHOOK_URL = process.env.SLACK_INCOMING_WEBHOOK_URL;
const paymentMethodAdded = async (props) => {
  return fetch(SLACK_INCOMING_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(constructSlackPayload({ ...props })),
  });
};

const constructSlackPayload = ({
  customer,
  billing_details,
  paymentMethodId,
  tenantId,
}) => {
  return {
    text: `New payment method  added.`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `💸 New payment method  added in Crystallize`,
        },
      },
      {
        type: "section",
        block_id: "section789",
        fields: [
          {
            type: "mrkdwn",
            text: `*Cardholder name *\n${billing_details.name}`,
          },
          {
            type: "mrkdwn",
            text: `*Stripe CustomerID *\n${customer}`,
          },
          {
            type: "mrkdwn",
            text: `*Crystallize Tenant ID*\n${tenantId}`,
          },
          {
            type: "mrkdwn",
            text: `*Stripe PaymentMethodId*\n${paymentMethodId}`,
          },
        ],
      },
    ],
  };
};

module.exports = { paymentMethodAdded };
