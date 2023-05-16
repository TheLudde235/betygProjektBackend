# Grading project, Backend

### Backend server for Ludvig Lagerströms grading project
---

## Overview

The server uses NodeJS with express to build a RESTful api
Data is stored at [cockroachlabs](https://www.cockroachlabs.com/)


## Node Libraries
- Express: Request handling
- Pg: Postgresql client - Communicating with database
- Joi: Request body validation
- BcryptJS: for encrypting user passwords
- JWT: Authenticating users when requesting routes that need specific permissions
- NodeMailer: Sending emails for confirmations and important updates to users


## Hosting
The backend is hosted on a raspberrypi and frontend on [cloudflare pages](https://pages.cloudflare.com/)

The project is live at [this link](https://taxami.pages.dev/)
