import { defineData, a, type ClientSchema } from '@aws-amplify/backend';

const schema = a.schema({
  Note: a.model({
    name: a.string().required(),
    description: a.string(),
    image: a.string(),
  }).authorization((allow) => [allow.owner()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: { defaultAuthorizationMode: 'userPool' },
});