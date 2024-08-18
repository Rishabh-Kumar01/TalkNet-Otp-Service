const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "otp-service",
  brokers: ["localhost:9092"],
});

const consumer = kafka.consumer({ groupId: "otp-service-group" });
const producer = kafka.producer();

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

const connectProducer = async () => {
  await producer.connect();
  console.log("Kafka producer connected");
};

const disconnectProducer = async () => {
  await producer.disconnect();
};

const sendMessage = async (topic, message) => {
  try {
    await producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }],
    });
    console.log(`Message sent successfully to topic ${topic}`);
  } catch (error) {
    console.error(`Failed to send message to topic ${topic}:`, error);
  }
};

module.exports = {
  connectConsumer,
  startConsumer,
  connectProducer,
  disconnectProducer,
  sendMessage,
};
