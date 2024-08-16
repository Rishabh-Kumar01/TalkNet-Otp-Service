# OTP Service

## Overview

The OTP (One-Time Password) Service is a microservice designed to handle the generation, sending, and verification of one-time passwords. It integrates with Kafka for asynchronous processing of OTP requests and supports both email and SMS delivery methods.

## Features

- Generate secure one-time passwords
- Send OTPs via email and SMS
- Verify OTPs
- Integrate with Kafka for asynchronous processing
- Support for multiple OTP types (e.g., account verification, password reset)

## Prerequisites

- Node.js (v14 or later)
- MongoDB
- Kafka

## Installation

1. Clone the repository:

   ```
   git clone https://github.com/Rishabh-Kumar01/TalkNet-Otp-Service.git
   cd otp-service
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add the following:
   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/otp_service
   KAFKA_BROKERS=localhost:9092
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-email-password
   TWILIO_ACCOUNT_SID=your-twilio-account-sid
   TWILIO_AUTH_TOKEN=your-twilio-auth-token
   TWILIO_PHONE_NUMBER=your-twilio-phone-number
   OTP_EXPIRY_TIME=300000
   ```

## Usage

1. Start the service:

   ```
   npm start
   ```

2. The service will start listening for Kafka messages on the `otp-requests` topic.

3. To send an OTP, publish a message to the `otp-requests` topic with the following structure:

   ```json
   {
     "userId": "user123",
     "recipient": "user@example.com",
     "type": "email",
     "otpType": "VERIFICATION"
   }
   ```

4. The service will generate an OTP, send it to the specified recipient, and publish the result to the `otp-results` topic.

5. To verify an OTP, use the `/api/v1/otp/verify` endpoint:
   ```
   POST /api/v1/otp/verify
   {
     "otp": "123456",
     "verificationKey": "encoded-verification-key"
   }
   ```

## API Endpoints

- `POST /api/v1/otp/send`: Send an OTP
- `POST /api/v1/otp/verify`: Verify an OTP

## Kafka Topics

- `otp-notifications`: Used for both incoming requests for OTP generation and sending, as well as for publishing the results of OTP operations (success/failure)

## Development

To run the service in development mode with hot reloading:

```
npm run dev
```

## Testing

Run the test suite:

```
npm test
```


