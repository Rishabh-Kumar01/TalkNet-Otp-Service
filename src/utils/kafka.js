const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "otp-service",
  brokers: ["localhost:9092"],
});

const consumer = kafka.consumer({ groupId: "otp-service-group" });

const connectConsumer = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: "otp-notifications", fromBeginning: true });
  console.log("Kafka consumer connected and subscribed");
};

const startConsumer = async (messageHandler) => {
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const messageContent = JSON.parse(message.value.toString());
      await messageHandler(messageContent);
    },
  });
};

module.exports = {
  connectConsumer,
  startConsumer,
};
