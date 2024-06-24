require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

// Setup email credentials based on environment
// Local = Mail Trap account (Does not send email)
// QA = testVehicleFormNoReply@gmail.com (TestVehicleFormNoReply1!)
// Prod - Certified autoplex email?

const emailUser = process.env.EMAIL_USER
const emailPassword = process.env.EMAIL_PASSWORD

const app = express();
app.use(cors());
app.use(express.json());

const transporter = nodemailer.createTransport({
  host: process.env.ENVIRONMENT === 'local' ? 'sandbox.smtp.mailtrap.io' : '',
  port: process.env.ENVIRONMENT === 'local' ? 2525 : '',
  service: process.env.ENVIRONMENT !== 'local' ? 'gmail' : '',
  auth: {
    user: emailUser,
    pass: emailPassword,
  },
});

app.post('/send-email', (req, res) => {
  const { ownerName, carModel, carYear, vin, licensePlate, email } = req.body;

  // Determine the identifier to use (either VIN or License Plate)
  const identifier = vin || licensePlate;
  const identifierLabel = vin ? 'VIN' : 'License Plate';

  const mailOptions = {
    from: emailUser,
    to: email,
    subject: `Cash Offer Information - ${ownerName}`,
    text: `Owner Name: ${ownerName}\nCar Model: ${carModel}\nCar Year: ${carYear}\n${identifierLabel}: ${identifier}\nEmail: ${email}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.status(500).send(error.toString());
    }
    res.status(200).send('Email sent: ' + info.response);
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
