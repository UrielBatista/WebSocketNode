const { GraphQLServer, PubSub } = require("graphql-yoga");

const messages = [];

const typeDefs = `
  type Message {
    id: ID!
    nome: String!
    processo: String!
  }

  type Query {
    messages: [Message!]
  }

  type Mutation {
    postMessage(nome: String!, processo: String!): ID!
    deleteMessage(nome: String!, processo: String!): ID!
  }

  type Subscription {
    messages: [Message!]
  }
`;

const subscribers = [];
const onMessagesUpdates = (fn) => subscribers.push(fn);

const resolvers = {
  Query: {
    messages: () => messages,
  },

  Mutation: {
    postMessage: (parent, { nome, processo }) => {
      const id = messages.length;
      messages.push({
        id,
        nome,
        processo,
      });
      subscribers.forEach((fn) => fn());
      return id;
    },
    deleteMessage: (parent, { nome, processo }) => {
      const id = messages.length;
      for (var i = 0; i < id; i++) {
        messages.pop({
          id,
          nome,
          processo,
        });
      }
      subscribers.forEach((fn) => fn());
      return id;
    },
  },

  Subscription: {
    messages: {
      subscribe: (parent, args, { pubsub }) => {
        const channel = Math.random().toString(36).slice(2, 15);
        onMessagesUpdates(() => pubsub.publish(channel, { messages }));
        setTimeout(() => pubsub.publish(channel, { messages }), 0);
        return pubsub.asyncIterator(channel);
      },
    },
  },
};

const pubsub = new PubSub();
const server = new GraphQLServer({ typeDefs, resolvers, context: { pubsub } });
server.start(({ port }) => {
  console.log(`Server on http://localhost:${port}/`);
});
