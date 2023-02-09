import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth : {
        type: 'OAuth2',
        user: 'mailservice.taxami@gmail.com',
        pass: '61dc4184Terryd0f585b9',
        clientId: '467383995265-6q1hsfv16h70brtfmfg74lbhl49guuv4.apps.googleusercontent.com',
        clientSecret: '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',
        refreshToken: '1//04UIn2OzqiVCyCgYIARAAGAQSNwF-L9Ir15SR2---WKgMsTq1YDtgPwELUftL0Bz65MJUymggol7IkwXskVNYvRLOltARAMjwBkU'
    }
});

const mailOptions = {
    from: 'mailservice.taxami@gmail.com',
    to: 'alibaba.alibabasson@gmail.com',
    subject: 'Test email subject',
    text: 'Test email Text'
};

transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        console.error(error);
    } else {
        console.log('Email sent: ' + info.response);
    }
});