import nodemailer from "nodemailer";

export const handler = async (event, context) => {
  const { email, subject, message } = JSON.parse(event.body);

  if (!email || !subject || !message) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing email, subject, or message" }),
    };
  }

  // Настройка транспортера (замените на свои данные)
  const transporter = nodemailer.createTransport({
    service: "gmail", // Используйте свой почтовый сервис
    auth: {
      user: process.env.VITE_EMAIL, // Ваш email
      pass: process.env.VITE_EMAIL_PASSWORD, // Ваш пароль или App Password
    },
  });

  try {
    await transporter.sendMail({
      from: process.env.VITE_EMAIL,
      to: email,
      subject: subject,
      text: message,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Email sent successfully" }),
    };
  } catch (error) {
    console.error("Error sending email:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to send email" }),
    };
  }
};
