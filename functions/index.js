import { onCall } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import * as logger from 'firebase-functions/logger';
import { onSchedule } from 'firebase-functions/scheduler';
import { getFirestore } from 'firebase-admin/firestore';
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { getAuth } from 'firebase-admin/auth';
import { defineString } from 'firebase-functions/params';
// Initialize Firebase Admin
initializeApp();

export const validateEmptyString = onCall({
  memory: '256MiB',
  region: 'us-central1',
}, async (request) => {
  try {
    const { data, auth } = request;
    
    logger.info("validateEmptyString called", {
      auth: auth,
      data: data
    });

    // Check authentication
    if (!auth) {
        throw new Error("Unauthorized access");
      }

    const inputString = data.inputString;

    if (!inputString || typeof inputString !== "string") {
      throw new Error("Invalid input: string required");
    }

    if (inputString.trim() === "") {
      return {
        success: false,
        message: "Input string cannot be empty.",
      };
    }

    return {
      success: true,
      message: "Input string is valid.",
    };
  } catch (error) {
    logger.error("validateEmptyString error", {
      error: error.message,
    });

    throw new Error(error.message);
  }
});


const db = getFirestore();

// will check in env file and save it as secret in firebase config
const awsAccessKeyId = defineString('AWS_ACCESS_KEY_ID')
const awsSecretAccessKey = defineString('AWS_SECRET_ACCESS_KEY')

// Initialize AWS SES
const ses = new SESClient({
    region: "ap-southeast-2", // Replace with your AWS region
    credentials: {
        accessKeyId: awsAccessKeyId.value() ,
        secretAccessKey: awsSecretAccessKey.value() 
    }
});

// Function to send email using AWS SES
async function sendEmail(toEmail, subject, body) {
    const params = {
        Source: 'wyusufalvian@gmail.com',
        Destination: {
            ToAddresses: [toEmail]
        },
        Message: {
            Subject: {
                Data: subject
            },
            Body: {
                Text: {
                    Data: body
                }
            }
        }
    };

    try {
        const command = new SendEmailCommand(params);
        const response = await ses.send(command);
        logger.info('Email sent successfully:', response);
        return true;
    } catch (error) {
        logger.error('Error sending email:', error);
        return false;
    }
}


export const checkOverdueTasks = onSchedule({
    schedule: 'every day 00:00', // 'every hour',
    region: 'us-central1',
    timeZone: 'UTC',
    invoker: ''
}, async()=>{
    try {
        logger.info('Starting overdue tasks check');
         // Get current date
         const now = new Date();
         logger.info('Current time:', { now: now.toISOString() });
        
        // Get all tasks
        const tasksSnapshot = await db.collection('tasks').get();
                23
        logger.info(`Found ${tasksSnapshot.size} total tasks`);

         // Check each task
         const overdueTasks = [];

         // Process tasks and send emails
        const emailPromises = [];


         for (const doc of tasksSnapshot.docs) {
            const task = doc.data();
            const dueDate = task.dueDate.toDate();

            if (dueDate < now) {
                overdueTasks.push({
                    id: doc.id,
                    title: task.title,
                    description: task.description,
                    dueDate: dueDate,
                    userId: task.userId
                });

                try {
                    const user = await getAuth().getUser(task.userId);
                    const emailSubject = 'Task Overdue Notification';
                    const emailBody = `
                        Your task "${task.title}" is overdue!
                        
                        Due Date: ${dueDate.toLocaleDateString()}
                        Description: ${task.description}
                        
                        Please login to your account to update the task status.
                    `;

                    // Send email
                    emailPromises.push(sendEmail(user.email, emailSubject, emailBody));
                } catch (error) {
                    logger.error('Error getting user or sending email:', {
                        taskId: doc.id,
                        userId: task.userId,
                        error: error.message
                    });
                }
            }
        }

        // Wait for all emails to be sent
        if (emailPromises.length > 0) {
            const emailResults = await Promise.all(emailPromises);
            logger.info('Email sending results:', {
                total: emailPromises.length,
                successful: emailResults.filter(result => result).length
            });
        }

        if (overdueTasks.length > 0) {
            logger.info('Overdue tasks:', overdueTasks);
        }

        return {
            success: true,
            overdueTasks: overdueTasks,
            emailsSent: emailPromises.length
        };

      } catch (error) {
        logger.error('Error in checkOverdueTasks:', error);
        throw error;
      }
})