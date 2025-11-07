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
        auth: {
            user: config.SMTP_USER,
            pass: config.SMTP_PASS
        }
    })

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