const nodemailer = require('nodemailer')
const config = require('../utils/config')
const logger = require('../utils/logger')

let transporter

const getTransporter = () => {
    if (transporter) {
        return transporter
    }

    transporter = nodemailer.createTransport({
        host: config.SMTP_HOST,
        port: config.SMTP_PORT,
        secure: config.SMTP_SECURE,
        connectionTimeout: config.SMTP_CONNECTION_TIMEOUT_MS,
        greetingTimeout: config.SMTP_GREETING_TIMEOUT_MS,
        socketTimeout: config.SMTP_SOCKET_TIMEOUT_MS,
        auth: {
            user: config.SMTP_USER,
            pass: config.SMTP_PASS
        },
        tls: {
            // Helps with some TLS/SNI edge-cases on hosted environments
            servername: config.SMTP_HOST
        }
    })

    logger.info(
        `SMTP transporter ready host=${config.SMTP_HOST} port=${config.SMTP_PORT} secure=${config.SMTP_SECURE}`
    )

    return transporter
}

const sendEmail = async ({ to, subject, text }) => {
    const smtp = getTransporter()
    
    const mailOptions = {
        from: config.EMAIL_FROM,
        to,
        subject,
        text
    }

    const info = await smtp.sendMail(mailOptions)
    logger.info('Email sent:', info.messageId)
    
    return info
}

module.exports = {
    sendEmail
}