\# Meeting Automation Prototype



A small prototype for automating the processing of meeting transcripts using local AI.



The prototype extracts structured information from an unstructured meeting transcript, validates the result, asks for human confirmation, and sends the approved data to a business-system API.



\## Workflow



```text

Meeting transcript

&#x20;       ↓

Local AI extraction

&#x20;       ↓

Structured JSON

&#x20;       ↓

Validation

&#x20;       ↓

Human approval

&#x20;       ↓

Business-system API

&#x20;       ↓

Success / Retry / Local backup

```



\## Features



\* Extracts customer information, requirements, deadlines, and next steps from meeting transcripts

\* Uses a predefined JSON schema for structured AI output

\* Performs application-level validation before sending data

\* Requires human confirmation before modifying the business system

\* Sends approved data through an HTTP API

\* Retries failed API requests

\* Saves approved requests locally if the business system remains unavailable



\## Technologies



\* \*\*Node.js\*\*

\* \*\*JavaScript\*\*

\* \*\*Ollama\*\*

\* \*\*Llama 3.2 3B\*\*

\* \*\*Express.js\*\*

\* \*\*Axios\*\*

\* \*\*JSON\*\*



The AI model runs locally through Ollama, so the meeting transcript does not need to be sent to an external AI API.



\## Project Structure



```text

meeting-automation/

├── process-meeting.js    # Main automation workflow

├── index.js              # Mock business-system API

├── test-api.js           # API connection test

├── meeting.txt           # Example meeting transcript

├── package.json

├── package-lock.json

├── failed-requests/      # Failed API requests saved for later retry

└── README.md

```



\## Requirements



\* Node.js

\* Ollama

\* Llama 3.2 3B



\## Setup



Install the Node.js dependencies:



```bash

npm install

```



Pull the local AI model:



```bash

ollama pull llama3.2:3b

```



Make sure Ollama is running.



\## Running the Prototype



First, start the mock business-system API:



```bash

node index.js

```



In another terminal, run the meeting automation:



```bash

node process-meeting.js

```



The program will:



1\. Read `meeting.txt`

2\. Send the transcript to the local AI model

3\. Generate structured JSON

4\. Validate the extracted data

5\. Ask the user for confirmation

6\. Send approved data to the mock business-system API

7\. Retry the request if the API is unavailable

8\. Save the approved data locally if all retries fail



\## Design Principle



The AI is not trusted to directly modify the business system.



The application separates interpretation from execution:



```text

AI interpretation

&#x20;      ↓

Schema validation

&#x20;      ↓

Application validation

&#x20;      ↓

Human confirmation

&#x20;      ↓

API execution

```



This provides a control point where incorrect AI interpretation can be detected before business data is changed.



\## Prototype Scope



This is a demonstration prototype rather than a production-ready business integration.



In a production implementation, the failure-handling mechanism could be replaced or extended with a persistent message queue, automatic background retries, authentication, monitoring, and idempotency mechanisms to prevent duplicate records.



