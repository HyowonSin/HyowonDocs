# ERD Editor Session Persistor

A management tool that provides persistent hosting for ERD Editor sessions.

## Introduction

While [ERD Editor](https://erd-editor.io) is an excellent tool for designing ERDs,  
it requires a host to maintain active sessions for collaboration.  
This can be inconvenient for users who need continuous access.

This project hosts ERD Editor sessions on a dedicated server,  
ensuring 24/7 availability and automating the setup process for collaboration:

- Automated session hosting and management
- Simple schema creation and sharing
- Continuous access without host restrictions
- Real-time monitoring of session status

The hosted server keeps sessions active, allowing you to access your ERD designs from anywhere, at any time, without the need for manual management.

## Future Plans

In addition to the current features, future updates will include:

- Deployment to a cloud service for enhanced accessibility
- Regular data backups to ensure data integrity and security

## Current Status

Currently, the implementation uses Puppeteer for browser automation,  
which serves as a temporary solution. Future updates will focus on developing a more robust and efficient approach for session management.

<img width="700" alt="Image" src="https://github.com/user-attachments/assets/fca258a0-99f4-4c50-a45a-b5561fcb4311" />