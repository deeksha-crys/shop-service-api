const fetch = require("node-fetch");

const SLACK_INCOMING_WEBHOOK_URL = process.env.SLACK_INCOMING_WEBHOOK_URL;
const newSubscriptionActivated = async (props) => {
  return fetch(SLACK_INCOMING_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(constructSlackPayload({ ...props })),
  });
};

//TODO: Add tenantId also
const constructSlackPayload = ({
  firstName,
  lastName,
  email,
  tenantId,
  planName,
}) => {
  return {
    text: `${firstName} ${lastName} activated ${planName} subscription  `,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `:star: ${firstName} ${lastName} activated ${planName} subscription`,
        },
      },
      {
        type: "section",
        block_id: "section789",
        fields: [
          {
            type: "mrkdwn",
            text: `*Email*\n${email}`,
          },
          {
            type: "mrkdwn",
            text: `*TenantId*\n${tenantId}`,
          },
        ],
      },
    ],
  };
};

module.exports = { newSubscriptionActivated };
