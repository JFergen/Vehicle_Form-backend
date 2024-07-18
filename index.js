require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const sharp = require('sharp');
const multer = require('multer');
const upload = multer(); // Initialize multer

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

app.post('/send-email', upload.fields([
  { name: 'odometerPhoto', maxCount: 1 },
  { name: 'driverFrontCornerPhoto', maxCount: 1 },
  { name: 'passengerRearCornerPhoto', maxCount: 1 },
]), async (req, res) => {
  try {
    const { ownerName, carModel, carYear, carMake, vin, email, phoneNumber, smokedIn_question, smokedIn_answer, mechanicalIssues_question, mechanicalIssues_answer, odometerBroken_question, odometerBroken_answer, panelsNeedWork_question, panelsNeedWork_answer, rustOrHailDamage_question, rustOrHailDamage_answer } = req.body;
    const from = {
      name: 'Cash Offer Customer',
      address: emailUser
    }
    const text = `
      Owner & Vehicle Information:
      Owner Name: ${ownerName}
      VIN: ${vin}
      Car Make: ${carMake}
      Car Model: ${carModel}
      Car Year: ${carYear}
      Email: ${email}
      Phone Number: ${phoneNumber}

      Questions and Answers:
      1. ${smokedIn_question}: ${smokedIn_answer}
      2. ${mechanicalIssues_question}: ${mechanicalIssues_answer}
      3. ${odometerBroken_question}: ${odometerBroken_answer}
      4. ${panelsNeedWork_question}: ${panelsNeedWork_answer}
      5. ${rustOrHailDamage_question}: ${rustOrHailDamage_answer}
    `;
    const compressedOdometerPhoto = await sharp(req.files.odometerPhoto[0].buffer).jpeg().toBuffer();
    const compressedDriverFrontCornerPhoto = await sharp(req.files.driverFrontCornerPhoto[0].buffer).resize(800).jpeg().toBuffer();
    const compressedPassengerRearCornerPhoto = await sharp(req.files.passengerRearCornerPhoto[0].buffer).resize(800).jpeg().toBuffer();
    const attachments = []

    attachments.push({
      filename: `Odometer Photo_${ownerName}.jpg`,
      content: compressedOdometerPhoto
    })
    attachments.push({
      filename: `Driver Front Corner Photo_${ownerName}.jpg`,
      content: compressedDriverFrontCornerPhoto
    })
    attachments.push({
      filename: `Passenger Rear Corner Photo_${ownerName}.jpg`,
      content: compressedPassengerRearCornerPhoto
    })

    const mailOptions = {
      from: from,
      to: process.env.EMAIL_TO,
      subject: `Cash Offer Information - ${ownerName}`,
      text: text,
      attachments: attachments
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.status(500).send(error.toString());
      }
      res.status(200).send('Email sent: ' + info.response);
    });
  } catch (error) {
    res.status(500).send(error.toString())
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});