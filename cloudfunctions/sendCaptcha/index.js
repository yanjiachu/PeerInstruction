const cloud = require('wx-server-sdk');
const nodemailer = require('nodemailer');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (event, context) => {
  const {
    email
  } = event;

  try {
    const captcha = generateCaptcha(); // 生成验证码

    const transporter = nodemailer.createTransport({
      host: 'smtp.qq.com', // 主机
      secureConnection: true, // 使用 SSL加密通信
      service: 'qq',
      port: 465, // SMTP 端口
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: '验证码',
      html: `<h1>【PeerInstruction】</h1><p>温馨提示，您的验证码为：<span style="color:#889bf3;text-decoration: underline;">${captcha}</span>，请勿泄露和转发，如非本人操作，请忽略此邮件。</p>`
    };

    await transporter.sendMail(mailOptions);

    // 将验证码存储到数据库中（假设存储在 `users` 集合中）
    const db = cloud.database();
    const usersCollection = db.collection('users');
    await usersCollection.where({
      email
    }).update({
      data: {
        captcha
      }
    });

    return {
      success: true,
      message: '验证码发送成功',
      captcha
    };
  } catch (error) {
    console.error('验证码发送失败', error);
    return {
      success: false,
      message: '验证码发送失败'
    };
  }
};

function generateCaptcha() {
  // 生成一个随机的6位验证码
  return Math.random().toString().slice(-6);
}