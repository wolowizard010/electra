import nodemailer from 'nodemailer';

async function testEmail() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  console.log(`Testing with user: ${user}`);
  
  if (!user || !pass) {
    console.error("Missing EMAIL_USER or EMAIL_PASS");
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });

  try {
    const info = await transporter.sendMail({
      from: `"Electra Private Ltd." <${user}>`,
      to: user, // Send to self
      subject: "Test Email from Electra",
      text: "This is a test email to verify nodemailer configuration.",
    });
    console.log(`Successfully sent email: ${info.messageId}`);
  } catch (error) {
    console.error("Failed to send email:", error);
  }
}

testEmail();
