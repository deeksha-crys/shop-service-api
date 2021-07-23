const fetch = require("node-fetch");

const SLACK_INCOMING_WEBHOOK_URL = process.env.SLACK_INCOMING_WEBHOOK_URL;
const newSubscriptionActivated = async (props) => {
  return fetch(SLACK_INCOMING_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(constructSlackPayload({ ...props })),
  });
};

const constructSlackPayload = ({
  planName,
  productSubscriptionId,
  customerIdentifier,
}) => {
  return {
    text: `New product subscription  `,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `🥳 🥳 New ${planName} plan subscription activated.`,
        },
      },
      {
        type: "section",
        block_id: "section789",
        fields: [
          {
            type: "mrkdwn",
            text: `*Subscription plan*\n${planName}`,
          },
          {
            type: "mrkdwn",
            text: `* Crystallize Customer ID*\n${customerIdentifier}`,
          },
          {
            type: "mrkdwn",
            text: `*Crystallize Product Subscription ID*\n${productSubscriptionId}`,
          },
        ],
      },
    ],
  };
};

module.exports = { newSubscriptionActivated };
