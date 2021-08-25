const fetch = require("node-fetch");

const SLACK_INCOMING_WEBHOOK_URL = process.env.SLACK_INCOMING_WEBHOOK_URL;
const informPaymentFailedToCrystallize = async (props) => {
  return fetch(SLACK_INCOMING_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(constructSlackPayload({ ...props })),
  });
};

const constructSlackPayload = ({
  customer,
  customer_email,
  customer_name,
  total,
  tenantId,
  tenantIdentifier,
  orderId,
}) => {
  return {
    text: `Stripe failed to collect monthly subscription payment for ${customer_name}.`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `:warning: Stripe failed to collect monthly subscription payment for tenant identifier: *${tenantIdentifier}*.`,
        },
      },
      {
        type: "section",
        block_id: "section789",
        fields: [
          {
            type: "mrkdwn",
            text: `*Customer Email*\n${customer_email}`,
          },
          {
            type: "mrkdwn",
            text: `*Stripe CustomerID *\n${customer}`,
          },
          {
            type: "mrkdwn",
            text: `*Tenant identifier*\n${tenantIdentifier}`,
          },
          {
            type: "mrkdwn",
            text: `*Total balance due*\n${total}`,
          },
          {
            type: "mrkdwn",
            text: `*Crystallize Order ID*\n${orderId}`,
          },
          {
            type: "mrkdwn",
            text: `*Crystallize Tenant ID*\n${tenantId}`,
          },
        ],
      },
    ],
  };
};

module.exports = { informPaymentFailedToCrystallize };
