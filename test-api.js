import axios from "axios";

const meetingData = {
    customer: "ACME Manufacturing",
    requirement: "Production monitoring dashboard"
};

try {
    const response = await axios.post(
        "http://localhost:3000/api/meetings",
        meetingData
    );

    console.log("Response from business system:");
    console.log(response.data);
} catch (error) {
    console.error("API request failed:");
    console.error(error.message);
}