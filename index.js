import express from "express";

const app = express();

app.use(express.json());

app.post("/api/meetings", function (req, res) {
    console.log("Received meeting data:");
    console.log(req.body);

    res.json({
        success: true,
        message: "Meeting data saved successfully"
    });
});

app.listen(3000, function () {
    console.log("Business system API running on port 3000");
});