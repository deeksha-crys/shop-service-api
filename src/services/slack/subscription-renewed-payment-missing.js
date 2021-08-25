const fetch = require("node-fetch");
const SLACK_INCOMING_WEBHOOK_URL = process.env.SLACK_INCOMING_WEBHOOK_URL;

const subscriptionRenewedPaymentMissing = async (props) => {
  return fetch(SLACK_INCOMING_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(constructSlackPayload({ ...props })),
  });
};

const constructSlackPayload = ({
  tenantId,
  orderId,
  amountPending,
  tenantIdentifier,
  firstName,
  lastName,
  email,
}) => {
  return {
    text: `Subscription contract renewed.`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `ℹ️ Payment method is missing for Crystallize tenant identifier *${tenantIdentifier}* but subscription contract is renewed. Customer and order details below 👇`,
        },
      },
      {
        type: "section",
        block_id: "section789",
        fields: [
          {
            type: "mrkdwn",
            text: `*Crystallize Tenant ID *\n${tenantId}`,
          },
          {
            type: "mrkdwn",
            text: `*Tenant identifier *\n${tenantIdentifier}`,
          },
          {
            type: "mrkdwn",
            text: `*Customer name *\n${firstName} ${lastName}`,
          },
          {
            type: "mrkdwn",
            text: `*Customer email *\n${email}`,
          },
          {
            type: "mrkdwn",
            text: `*Failed Order ID *\n${orderId}`,
          },
          {
            type: "mrkdwn",
            text: `*Balance due *\n$${amountPending}`,
          },
        ],
      },
    ],
  };
};

module.exports = { subscriptionRenewedPaymentMissing };
