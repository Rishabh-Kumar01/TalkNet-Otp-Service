const utils = require("./utils/index.util");
const config = require("./config/index.config");
const routes = require("./routes/index.route");
const { AppError } = require("./utils/index.util").errorHandler;
const OTPService = require("./services/otp.service");

const app = utils.imports.express();

// Function to setup and start the server
const setupAndStartServer = async () => {
  // Middlewares
  app.use(utils.imports.morgan("dev"));
  app.use(utils.imports.cors());
  app.use(utils.imports.helmet());
  app.use(utils.imports.compression());
  app.use(utils.imports.express.json());
  app.use(utils.imports.express.urlencoded({ extended: true }));

  // Routes
  app.use("/api", routes);

  // Error handling middleware
  app.use((err, req, res, next) => {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        status: "Failure",
        message: err.message,
        data: {},
        error: { details: err.description },
      });
    } else {
      res.status(500).json({
        status: "Failure",
        message: "Internal Server Error",
        data: {},
        error: { details: err.message },
      });
    }
  });

  // Cron Job to clean up expired OTPs
  utils.otpCleanup();

  await utils.kafka.connectConsumer();
  await utils.kafka.connectProducer();
  await utils.kafka.startConsumer();
  console.log("Kafka consumer started");

  // Start the server and connect to the database
  app.listen(config.serverConfig.PORT, async () => {
    console.log(`SERVER IS RUNNING ON PORT ${config.serverConfig.PORT}`);
    await config.connection();
  });

  // Home Route
  app.get("/", (request, response) => {
    response.send("Hello Server!!!😊😊😊😊");
  });
};

// Call the function to setup and start the server
setupAndStartServer();

module.exports = app;
