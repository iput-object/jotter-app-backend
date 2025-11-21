const nodemailer = require("nodemailer");
const config = require("./config");
const logger = require("./logger");

const transport = nodemailer.createTransport(config.email.smtp);

/* istanbul ignore next */
if (config.env !== "test") {
  transport
    .verify()
    .then(() => logger.info("Connected to email server"))
    .catch((err) =>
      logger.warn(
        "Unable to connect to email server. Make sure SMTP options are configured in .env"
      )
    );
}

const sendEmail = async (to, subject, html) => {
  const msg = { from: config.email.from, to, subject, html };
  await transport.sendMail(msg);
};

// Verification code for account
const sendEmailVerification = async (to, otp) => {
  const subject = "Jotter Verification Code";
  const html = `
  <body style="background-color:#f3f4f6;padding:2rem;font-family:Arial,sans-serif;color:#333;">
    <div style="max-width:32rem;margin:0 auto;background-color:#fff;padding:2rem;border-radius:.75rem;box-shadow:0 10px 20px rgba(0,0,0,0.15);text-align:center;">
      <h1 style="font-size:1.75rem;font-weight:700;margin-bottom:1rem;color:#1f2937;">Verify Your Jotter Account</h1>
      <p style="color:#4b5563;margin-bottom:1.5rem;">Use the code below to verify your account.</p>
      <div style="background:linear-gradient(135deg,#3b82f6,#06b6d4);color:#fff;padding:1rem;border-radius:.5rem;font-size:2rem;font-weight:800;letter-spacing:.1rem;margin-bottom:1.5rem;">
        ${otp}
      </div>
      <p style="color:#4b5563;margin-bottom:1.5rem;">This code expires in 3 minutes.</p>
    </div>
  </body>`;
  await sendEmail(to, subject, html);
};

// Password reset
const sendResetPasswordEmail = async (to, otp) => {
  const subject = "Jotter Password Reset Code";
  const html = `
  <body style="background-color:#f3f4f6;padding:2rem;font-family:Arial,sans-serif;color:#333;">
    <div style="max-width:32rem;margin:0 auto;background-color:#fff;padding:2rem;border-radius:.75rem;box-shadow:0 10px 20px rgba(0,0,0,0.15);text-align:center;">
      <h1 style="font-size:1.75rem;font-weight:700;margin-bottom:1rem;color:#1f2937;">Reset Your Password</h1>
      <p style="color:#4b5563;margin-bottom:1.5rem;">Use the code below to reset your Jotter account password:</p>
      <div style="background:linear-gradient(135deg,#3d56ad,#0032D3);color:#fff;padding:1rem;border-radius:.5rem;font-size:2rem;font-weight:800;letter-spacing:.1rem;margin-bottom:1.5rem;">
        ${otp}
      </div>
      <p style="color:#d6471c;margin-bottom:1.5rem;">This code is valid for 3 minutes.</p>
    </div>
  </body>`;
  await sendEmail(to, subject, html);
};

// Email verification with token (confirming email)
const sendVerificationEmail = async (to, token) => {
  const subject = "Jotter Email Verification";
  const verificationUrl = `${config.frontendUrl}/verify-email?token=${token}`;
  const text = `Hello,

Please verify your email to activate your Jotter account:

${verificationUrl}

If you did not create this account, ignore this email.`;
  await sendEmail(to, subject, text);
};

module.exports = {
  transport,
  sendEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
  sendEmailVerification,
};
