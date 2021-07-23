const fetch = require("node-fetch");

const SLACK_INCOMING_WEBHOOK_URL = process.env.SLACK_INCOMING_WEBHOOK_URL;
const paymentMethodDeleted = async (props) => {
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
  tenantId,
  paymentMethodId,
}) => {
  return {
    text: `Payment method deleted.`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `:warning: TenantId ${tenantId} deleted payment method in Crystallize`,
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
            text: `*Customer name *\n${customer_name}`,
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
            text: `* Stripe PaymentMethodId *\n${paymentMethodId}`,
          },
        ],
      },
    ],
  };
};

module.exports = { paymentMethodDeleted };
