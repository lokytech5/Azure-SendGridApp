// Sample data structure for testing purposes.
// In production, remove the following mock data and ensure all data comes from the request body (req.body).
require('dotenv').config();
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const conferenceSchedule = [
    { id: 1, title: "Emerging Technologies in AI", timeSlot: "9:00 AM - 10:30 AM" },
    { id: 2, title: "Learn Blockchain", timeSlot: "11:00 AM - 12:30 PM" },
    { id: 3, title: "The Future of Cloud computing", timeSlot: "2:00 PM - 3:30 PM" },
]

const registrationData = {
    name: "Jane Doe",
    email: "jane.doe@example.com",
    organization: "Tech Innovators Inc.",
    position: "Software Developer",
    sessions: [
        { id: 1, title: "Emerging Technologies in AI", timeSlot: "9:00 AM - 10:30 AM" },
        { id: 2, title: "Learn Blockchain", timeSlot: "11:00 AM - 12:30 PM" },
    ],
};

async function sendRegistrationEmail(userDetails) {
    // Generate session details string
    let sessionDetailsString = userDetails.sessions.map(session => {
        return `${session.title} - ${session.timeSlot}`;
    }).join("\n");


    const msg = {
        to: userDetails.email,
        from: 'lokosman5@hotmail.com',
        subject: 'Registration Confirmation',
        text: `Hello ${userDetails.name} thank you for registering. Here are your session details: \n${sessionDetailsString}`
    };
    try {
        await sgMail.send(msg);
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email: ', error);
    }
}

module.exports = async function (context, req) {
    context.log('Processing workshop registration request.');

    const registrationDetails = req.body || registrationData;

    // Validate registration details
    const validationResult = validateRegistrationDetails(registrationDetails, conferenceSchedule);
    if (!validationResult.isValid) {
        context.res = { status: 400, body: validationResult.message };
        return;
    }

    //Send registration confirmation email
    await sendRegistrationEmail(registrationDetails);

    // Prepare a confirmation message to send back to the user
    const confirmationMessage = `Hello ${registrationDetails.name}, your registration for the selected sessions has been successfully processed.`;

    context.res = {
        status: 200,
        body: confirmationMessage
    };
};

function validateRegistrationDetails(details, schedule) {
    let isValid = true;
    let message = 'Registration details are valid.';

    // Check if all required fields are present
    if (!details.name || !details.email || !details.sessions || details.sessions.length === 0) {
        isValid = false;
        message = 'Missing required registration details: name, email, or sessions.';
        return { isValid, message };
    }

    // Check if sessions do not overlap and are present in the conference schedule
    let sessionTimes = details.sessions.map(s => s.timeSlot);
    let sessionIds = details.sessions.map(s => s.id);

    if (new Set(sessionTimes).size !== sessionTimes.length) {
        isValid = false;
        message = 'Selected sessions have overlapping times.';
        return { isValid, message };
    }

    // Check if selected sessions exist in the conference schedule
    const sessionExists = sessionIds.every(id =>
        schedule.some(session => session.id === id));

    if (!sessionExists) {
        isValid = false;
        message = 'One or more selected sessions do not exist in the conference schedule.';
        return { isValid, message };
    }

    return { isValid, message };
}