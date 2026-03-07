import nodemailer from "nodemailer";

const sendEmail = async (email, otp) => {

  const transporter = nodemailer.createTransport({

    service: "gmail",

    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }

  });

  const mailOptions = {

    from: process.env.EMAIL_USER,
    to: email,
    subject: "URBANIQ Email Verification OTP",

    html: `
<h2>Email Verification</h2>
<p>Your OTP is:</p>
<h1>${otp}</h1>
<p>This OTP will expire in 5 minutes.</p>
`

  };

  await transporter.sendMail(mailOptions);

};

export default sendEmail;