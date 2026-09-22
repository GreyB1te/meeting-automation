import fs from "fs";
import axios from "axios";
import readline from "readline";
import path from "path";

const meetingText = fs.readFileSync("meeting.txt", "utf-8");

console.log("Processing meeting...\n");

const schema = {
    type: "object",
    properties: {
        customer: {
            type: ["string", "null"]
        },
        requirements: {
            type: "array",
            items: {
                type: "string"
            }
        },
        deadline: {
            type: ["string", "null"]
        },
        next_steps: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    task: {
                        type: "string"
                    },
                    responsible: {
                        type: ["string", "null"]
                    },
                    deadline: {
                        type: ["string", "null"]
                    }
                },
                required: [
                    "task",
                    "responsible",
                    "deadline"
                ]
            }
        }
    },
    required: [
        "customer",
        "requirements",
        "deadline",
        "next_steps"
    ]
};

function validateMeetingData(data) {
    const errors = [];

    if (
        typeof data.customer !== "string" ||
        data.customer.trim() === ""
    ) {
        errors.push("Customer is missing.");
    }

    if (!Array.isArray(data.requirements)) {
        errors.push("Requirements must be an array.");
    }

    if (
        data.deadline !== null &&
        typeof data.deadline !== "string"
    ) {
        errors.push("Deadline must be a string or null.");
    }

    if (!Array.isArray(data.next_steps)) {
        errors.push("Next steps must be an array.");
    }

    for (const step of data.next_steps) {
        if (
            typeof step.task !== "string" ||
            step.task.trim() === ""
        ) {
            errors.push("A next step is missing a task.");
        }

        if (
            step.responsible !== null &&
            typeof step.responsible !== "string"
        ) {
            errors.push("Responsible person must be a string or null.");
        }

        if (
            step.deadline !== null &&
            typeof step.deadline !== "string"
        ) {
            errors.push("Next-step deadline must be a string or null.");
        }
    }

    return errors;
}

function askForApproval(data) {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        console.log("\nAI extracted the following information:\n");

        console.log(`Customer: ${data.customer}`);

        console.log("\nRequirements:");

        for (const requirement of data.requirements) {
            console.log(`- ${requirement}`);
        }

        console.log(`\nOverall deadline: ${data.deadline}`);

        console.log("\nNext steps:");

        for (const step of data.next_steps) {
            console.log(`- ${step.task}`);

            if (step.responsible !== null) {
                console.log(`  Responsible: ${step.responsible}`);
            }

            if (step.deadline !== null) {
                console.log(`  Deadline: ${step.deadline}`);
            }
        }

        rl.question(
            "\nSend this information to the business system? (y/n): ",
            (answer) => {
                rl.close();

                resolve(answer.toLowerCase() === "y");
            }
        );
    });
}

function wait(milliseconds) {
    return new Promise((resolve) => {
        setTimeout(resolve, milliseconds);
    });
}

async function sendToBusinessSystem(data) {
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            console.log(
                `\nSending data to business system (attempt ${attempt}/${maxAttempts})...`
            );

            const response = await axios.post(
                "http://localhost:3000/api/meetings",
                data,
                {
                    timeout: 5000
                }
            );

            return response.data;

        } catch (error) {
            console.error(
                `Attempt ${attempt} failed: ${error.message}`
            );

            if (attempt < maxAttempts) {
                const delay = attempt * 2000;

                console.log(
                    `Retrying in ${delay / 1000} seconds...`
                );

                await wait(delay);
            }
        }
    }

    throw new Error(
        "Business system unavailable after all retry attempts."
    );
}

function saveFailedRequest(data) {
    const directory = "failed-requests";

    fs.mkdirSync(directory, {
        recursive: true
    });

    const filename = `meeting-${Date.now()}.json`;

    const filepath = path.join(
        directory,
        filename
    );

    fs.writeFileSync(
        filepath,
        JSON.stringify(data, null, 2)
    );

    return filepath;
}

async function main() {
    const prompt = `
Extract information from this meeting transcript.

Rules:
- Only include information explicitly stated in the transcript.
- Never guess or invent information.
- If something is unknown, use null or an empty array.
- Extract actual customer requirements.
- Extract concrete next steps and who is responsible.
- Preserve deadlines when they are explicitly stated.
- Return the information according to the provided JSON schema.

Meeting transcript:

${meetingText}
`;

    try {
       
        // 1. AI extraction
     
        const response = await axios.post(
            "http://localhost:11434/api/generate",
            {
                model: "llama3.2:3b",
                prompt: prompt,
                stream: false,
                format: schema
            }
        );

        // 2. Parse AI output

        const meetingData = JSON.parse(
            response.data.response
        );

        console.log("Structured AI output:");
        console.log(
            JSON.stringify(meetingData, null, 2)
        );

        // 3. Validate

        const validationErrors =
            validateMeetingData(meetingData);

        if (validationErrors.length > 0) {
            console.log("\nValidation failed:");

            for (const error of validationErrors) {
                console.log(`- ${error}`);
            }

            process.exit(1);
        }

        console.log("\nValidation passed.");

        // 4. Human approval

        const approved =
            await askForApproval(meetingData);

        if (!approved) {
            console.log(
                "\nOperation cancelled by user."
            );

            process.exit(0);
        }

        console.log(
            "\nHuman approval received."
        );

        // 5. Send to business system

        try {
            const result =
                await sendToBusinessSystem(
                    meetingData
                );

            console.log(
                "\nBusiness system response:"
            );

            console.log(result);

        } catch (error) {

            // 6. Save failed request for later retry

            console.error(
                `\n${error.message}`
            );

            const filepath =
                saveFailedRequest(
                    meetingData
                );

            console.log(
                `Approved data saved locally for later retry: ${filepath}`
            );
        }

    } catch (error) {
        console.error(
            "\nProcess failed:"
        );

        if (error.response) {
            console.error(
                `HTTP ${error.response.status}:`,
                error.response.data
            );
        } else {
            console.error(error.message);
        }
    }
}

main();